from bson import ObjectId
from datetime import datetime, timezone

from app.config.database import database
from app.services import so_du as dich_vu_so_du
from app.services.so_du import GiaTriKhongHopLeError, SoDuKhongDuError
from app.services.bai_dang import (
    KhongTimThayBaiDangError,
    lay_ban_do_ten_nguoi_dang,
)


# Chuẩn tài liệu DB: khoan_gop_von (Gọi Vốn) + khoan_quyen_gop (Quyên Góp).
# Đầu Tư chưa có trong tài liệu -> dùng collection riêng khoan_dau_tu
# để không trộn dữ liệu ba loại hình khác nhau.
COLLECTION_THEO_LOAI = {
    "Gọi Vốn": "khoan_gop_von",
    "Quyên Góp": "khoan_quyen_gop",
    "Đầu Tư": "khoan_dau_tu",
}

# Loại giao dịch ví theo loại hình góp (trùng loai_giao_dich của FE demo)
GIAO_DICH_THEO_LOAI = {
    "Gọi Vốn": "Gop_Von",
    "Quyên Góp": "Quyen_Gop",
    "Đầu Tư": "Dau_Tu",
}


class BaiDangChuaDuyetError(Exception):
    """Bài đăng chưa được duyệt — không nhận góp vốn/quyên góp."""
    pass


def _so(gia_tri, mac_dinh: float = 0.0) -> float:
    if gia_tri is None:
        return mac_dinh
    if hasattr(gia_tri, "to_decimal"):  # Decimal128
        return float(gia_tri.to_decimal())
    if isinstance(gia_tri, (int, float)):
        return float(gia_tri)
    return mac_dinh


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


def _chuan_hoa_gop(doc: dict, ten_nguoi_gop: str | None = None) -> dict:
    return {
        "id": str(doc["_id"]),
        "ma_loai": doc.get("ma_loai", "gop_von"),
        "loai": doc.get("loai", ""),
        "id_bai_dang": str(doc["id_bai_dang"]),
        "id_nguoi_gop": str(doc["id_nguoi_gop"]) if doc.get("id_nguoi_gop") else None,
        # Tên ghép theo id lúc đọc; an_danh -> FE tự hiển thị "Ẩn danh"
        "ten_nguoi_gop": "Người ủng hộ ẩn danh" if doc.get("an_danh") else ten_nguoi_gop,
        "so_tien": _so(doc.get("so_tien")),
        "trang_thai": doc.get("trang_thai", "Thanh_cong"),
        "ngay_tao": _iso(doc.get("ngay_tao")),
        "thoi_gian_hoan_tat": _iso(doc.get("thoi_gian_hoan_tat")),
        "id_giao_dich": str(doc["id_giao_dich"]) if doc.get("id_giao_dich") else None,
        # Ba trường FE dùng — ghi kèm để danh sách hiển thị như bản demo
        "an_danh": Boolean_an_danh(doc),
        "loi_nhac": doc.get("loi_nhac") or "",
        "so_huu_phan_tram": _so(doc.get("so_huu_phan_tram"), 0)
        if doc.get("so_huu_phan_tram") is not None
        else None,
    }


def Boolean_an_danh(doc: dict) -> bool:
    return bool(doc.get("an_danh"))


async def _lay_bai_dang_duyet(id_bai_dang: str) -> dict:
    """Bài đăng phải tồn tại và đã duyệt mới nhận góp (tránh góp bài ảo)."""
    if not id_bai_dang or not ObjectId.is_valid(id_bai_dang):
        raise KhongTimThayBaiDangError("Mã bài đăng không hợp lệ.")

    bai_dang = await database["bai_dang"].find_one(
        {"_id": ObjectId(id_bai_dang)}
    )

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    if bai_dang.get("trang_thai") != "Da_Duyet":
        raise BaiDangChuaDuyetError(
            "Bài đăng chưa được duyệt, chưa thể nhận góp vốn/quyên góp."
        )

    return bai_dang


async def tao_khoan_gop(
    id_nguoi_dang: ObjectId,
    id_bai_dang: str,
    *,
    so_tien: float,
    an_danh: bool = False,
    loi_nhac: str = "",
    so_huu_phan_tram: float | None = None,
) -> dict:
    """Ghi nhận góp vốn/quyên góp - US14.

    Trình tự chặt: kiểm bài -> trừ ví (tru_tien) -> ghi khoản góp
    -> cộng so_tien_da_gop vào bài. Nếu trừ ví xong ghi khoản lỗi thì
    hoàn tiền lại (bù giao dịch Tang) để ví không bị mất oan.
    """
    bai_dang = await _lay_bai_dang_duyet(id_bai_dang)

    loai_bai = bai_dang.get("loai_bai_dang", "")
    collection_ten = COLLECTION_THEO_LOAI.get(loai_bai)
    if not collection_ten:
        # Loại lạ -> chọn an toàn theo loại hình tương đương
        collection_ten = "khoan_gop_von"
        loai_bai = "Gọi Vốn"

    ma_loai = {
        "Gọi Vốn": "gop_von",
        "Quyên Góp": "quyen_gop",
        "Đầu Tư": "dau_tu",
    }[loai_bai]

    loai_giao_dich = GIAO_DICH_THEO_LOAI[loai_bai]
    tieu_de = bai_dang.get("tieu_de", "")
    now = datetime.now(timezone.utc)

    # 1) Trừ tiền ví (Bỏ qua lỗi SoDuKhongDuError/GiaTriKhongHopLeError —
    #    router chuyển thành 400/402 cho FE).
    giao_dich_ket_qua = await dich_vu_so_du.tru_tien(
        id_nguoi_dang,
        so_tien,
        loai_giao_dich,
        mo_ta=f"{loai_bai} cho bài đăng \"{tieu_de}\"",
        id_bai_dang=id_bai_dang,
    )
    id_giao_dich = ObjectId(giao_dich_ket_qua["giao_dich"]["id"])

    try:
        # 2) Ghi khoản góp theo đúng collection của loại hình
        khoan = {
            "id_bai_dang": ObjectId(id_bai_dang),
            "id_nguoi_gop": id_nguoi_dang,
            "id_giao_dich": id_giao_dich,
            "ma_loai": ma_loai,
            "loai": loai_bai,
            "so_tien": dich_vu_so_du._tien(so_tien),
            "trang_thai": "Thanh_cong",
            "an_danh": bool(an_danh),
            "loi_nhac": (loi_nhac or "").strip(),
            "so_huu_phan_tram": dich_vu_so_du._tien(so_huu_phan_tram)
            if so_huu_phan_tram is not None
            else None,
            "ngay_tao": now,
            "thoi_gian_hoan_tat": now,
        }
        result = await database[collection_ten].insert_one(khoan)
    except Exception:
        # Ghi khoản thất bại -> hoàn tiền ví (giao dịch đối ứng) rồi ném lại
        await dich_vu_so_du.nap_tien(
            id_nguoi_dang,
            so_tien,
            mo_ta=f"Hoàn tiền — lỗi ghi {loai_bai.lower()} \"{tieu_de}\"",
        )
        raise

    # 3) Cộng tiến độ huy động của bài đăng ($inc — không đọc không ghi)
    await database["bai_dang"].update_one(
        {"_id": ObjectId(id_bai_dang)},
        {"$inc": {"so_tien_da_gop": so_tien}, "$set": {"ngay_cap_nhat": now}},
    )

    # Bản chuẩn hóa trả FE (kèm tên người góp từ ban đồ người dùng)
    ban_do = await lay_ban_do_ten_nguoi_dang([str(id_nguoi_dang)])
    khoan["_id"] = result.inserted_id
    gop = _chuan_hoa_gop(khoan, ban_do.get(str(id_nguoi_dang)))

    return {
        "gop": gop,
        "giao_dich": giao_dich_ket_qua["giao_dich"],
        "vi": giao_dich_ket_qua["vi"],
    }


async def so_tien_da_gop(id_bai_dang: ObjectId) -> float:
    """Tổng đã huy động của bài: $group sum trên 3 collection khoản góp."""
    tong = 0.0

    for collection_ten in COLLECTION_THEO_LOAI.values():
        chuoi_tong = [
            doc async for doc in database[collection_ten].aggregate([
                {"$match": {"id_bai_dang": id_bai_dang}},
                {"$group": {"_id": None, "tong": {"$sum": "$so_tien"}}},
            ])
        ]
        if chuoi_tong:
            tong += _so(chuoi_tong[0].get("tong"))

    return round(tong, 2)


async def lay_nguoi_gop(id_bai_dang: str) -> list:
    """Danh sách người góp của một bài — công khai, mới nhất trước.

    Tên ghép theo id (batch $in như bài đăng); khoản ẩn danh giữ nguyên
    số tiền nhưng tên thay bằng "Người ủng hộ ẩn danh" (làm trong
    _chuan_hoa_gop).
    """
    if not id_bai_dang or not ObjectId.is_valid(id_bai_dang):
        raise KhongTimThayBaiDangError("Mã bài đăng không hợp lệ.")

    id_object = ObjectId(id_bai_dang)
    tong_hop: list = []

    for collection_ten in COLLECTION_THEO_LOAI.values():
        cursor = database[collection_ten].find(
            {"id_bai_dang": id_object}
        )
        tong_hop.extend([doc async for doc in cursor])

    # Ghép tên người góp một truy vấn duy nhất ($in)
    id_nguoi_hop_le = [
        doc["id_nguoi_gop"]
        for doc in tong_hop
        if doc.get("id_nguoi_gop")
    ]
    ban_do = await lay_ban_do_ten_nguoi_dang(
        [str(ma) for ma in id_nguoi_hop_le]
    )

    ket_qua = [
        _chuan_hoa_gop(doc, ban_do.get(str(doc.get("id_nguoi_gop"))))
        for doc in tong_hop
    ]

    ket_qua.sort(
        key=lambda gop: gop["ngay_tao"] or "",
        reverse=True,
    )

    return ket_qua


async def khoan_gop_cua_toi(id_nguoi_dang: ObjectId) -> list:
    """Danh sách khoản tôi đã góp/quyên góp/đầu tư (mới nhất trước)."""
    tong_hop: list = []

    for collection_ten in COLLECTION_THEO_LOAI.values():
        cursor = database[collection_ten].find(
            {"id_nguoi_gop": id_nguoi_dang}
        )
        tong_hop.extend([doc async for doc in cursor])

    # Ghép tiêu đề bài đăng để hiển thị "góp vào dự án nào"
    id_bai_hop_le = [
        doc["id_bai_dang"] for doc in tong_hop if doc.get("id_bai_dang")
    ]
    ban_do_bai = {}
    if id_bai_hop_le:
        cursor_bai = database["bai_dang"].find(
            {"_id": {"$in": id_bai_hop_le}},
            {"tieu_de": 1},
        )
        ban_do_bai = {
            doc["_id"]: doc.get("tieu_de", "")
            async for doc in cursor_bai
        }

    ban_do_ten = await lay_ban_do_ten_nguoi_dang([str(id_nguoi_dang)])

    ket_qua = [
        {
            **_chuan_hoa_gop(doc, ban_do_ten.get(str(id_nguoi_dang))),
            "tieu_de_bai_dang": ban_do_bai.get(doc.get("id_bai_dang"), ""),
        }
        for doc in tong_hop
    ]

    ket_qua.sort(key=lambda gop: gop["ngay_tao"] or "", reverse=True)

    return ket_qua
