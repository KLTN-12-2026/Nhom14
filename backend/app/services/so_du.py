
import secrets
import string

from bson import ObjectId
from bson.decimal128 import Decimal128
from datetime import datetime, timezone

from app.config.database import database
from app.services.thong_bao import tao_thong_bao, tao_thong_bao_cho_admin


# Tiền lưu theo tài liệu database: Decimal128 (tránh sai hao float).
# FE nhận float (JSON) sau khi chuẩn hóa ở _so().
money_max = 500_000_000_000.0

# Nạp tiền tối thiểu (khớp FE + nghiệp vụ)
money_min_nap = 10_000.0

# Trạng thái hợp lệ của giao dịch nạp tiền chờ duyệt
TRANG_THAI_NAN_TIEN = ("Cho_Xu_Ly", "Thanh_cong", "That_bai", "Da_Huy")


class SoDuKhongDuError(Exception):
    """Ném khi giao dịch trừ tiền vượt số dư hiện tại."""
    pass


class GiaTriKhongHopLeError(Exception):
    """Số tiền giao dịch không hợp lệ (<= 0 hoặc vượt trần)."""
    pass


class KhongTimThayGiaoDichError(Exception):
    """Không tìm thấy giao dịch / yêu cầu nạp tiền."""
    pass


class GiaoDichDaXuLyError(Exception):
    """Giao dịch đã được duyệt/từ chối/hủy trước đó."""
    pass


def _tien(gia_tri) -> Decimal128:
    # Làm tròn về 2 chữ số thập phân (VND thường nguyên nhưng để an toàn)
    lam_tron = round(float(gia_tri), 2)
    return Decimal128(f"{lam_tron:.2f}")


def _so(gia_tri, mac_dinh: float = 0.0) -> float:
    # Decimal128(datetime...) -> float; số seen từ Mongo kiểu Decimal128
    if isinstance(gia_tri, Decimal128):
        return float(gia_tri.to_decimal())
    if isinstance(gia_tri, (int, float)):
        return float(gia_tri)
    return mac_dinh


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


def _chuan_hoa_vi(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_nguoi_dung": str(doc["id_nguoi_dung"]),
        "so_du": _so(doc.get("so_du")),
        "don_vi_tien_te": doc.get("don_vi_tien_te", "VND"),
        "trang_thai": doc.get("trang_thai", "Hoat_Dong"),
        "ngay_tao": _iso(doc.get("ngay_tao")),
        "ngay_cap_nhat": _iso(doc.get("ngay_cap_nhat")),
    }


def _chuan_hoa_giao_dich(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_nguoi_dung": str(doc["id_nguoi_dung"]),
        "id_so_du": str(doc["id_so_du"]) if doc.get("id_so_du") else None,
        "loai_giao_dich": doc["loai_giao_dich"],
        "so_tien": _so(doc["so_tien"]),
        "don_vi_tien_te": doc.get("don_vi_tien_te", "VND"),
        "trang_thai": doc.get("trang_thai", "Thanh_cong"),
        "ma_giao_dich": doc.get("ma_giao_dich", ""),
        "mo_ta": doc.get("mo_ta", ""),
        "ly_do_tu_choi": doc.get("ly_do_tu_choi", ""),
        "ghi_chu_duyet": doc.get("ghi_chu_duyet", ""),
        "id_nguoi_duyet": str(doc["id_nguoi_duyet"])
        if doc.get("id_nguoi_duyet") else None,
        "id_bai_dang": str(doc["id_bai_dang"]) if doc.get("id_bai_dang") else None,
        "ngay_tao": _iso(doc.get("ngay_tao")),
        "ngay_duyet": _iso(doc.get("ngay_duyet")),
        "thoi_gian_hoan_tat": _iso(doc.get("thoi_gian_hoan_tat")),
    }


def _validate_so_tien(so_tien: float) -> float:
    so_tien = round(float(so_tien), 2)

    if so_tien <= 0:
        raise GiaTriKhongHopLeError("Số tiền phải lớn hơn 0.")

    if so_tien > money_max:
        raise GiaTriKhongHopLeError(
            f"Số tiền không được vượt quá {money_max:.0f} VND."
        )

    return so_tien


async def _lay_so_du(id_nguoi_dung: ObjectId) -> dict | None:
    return await database["so_du"].find_one({
        "id_nguoi_dung": id_nguoi_dung
    })


async def _dam_bao_so_du(id_nguoi_dung: ObjectId) -> dict:
    """Mỗi người dùng có đúng 1 ví: thiếu thì tạo mới số dư 0."""
    vi = await _lay_so_du(id_nguoi_dung)

    if not vi:
        now = datetime.now(timezone.utc)
        vi = {
            "id_nguoi_dung": id_nguoi_dung,
            "so_du": _tien(0),
            "don_vi_tien_te": "VND",
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
            "ngay_cap_nhat": now,
        }
        result = await database["so_du"].insert_one(vi)
        vi["_id"] = result.inserted_id

    return vi


async def lay_vi(id_nguoi_dung: ObjectId) -> dict:
    """Xem ví: số dư + lịch sử giao dịch (mới nhất trước) - US13/US16."""
    vi = await _dam_bao_so_du(id_nguoi_dung)
    ket_qua_vi = _chuan_hoa_vi(vi)

    giao_dich = await lay_lich_su_giao_dich(id_nguoi_dung)

    return {
        "so_du": ket_qua_vi["so_du"],
        "don_vi_tien_te": ket_qua_vi["don_vi_tien_te"],
        "trang_thai": ket_qua_vi["trang_thai"],
        "ngay_tao": ket_qua_vi["ngay_tao"],
        "ngay_cap_nhat": ket_qua_vi["ngay_cap_nhat"],
        "giao_dich": giao_dich,
    }


async def lay_lich_su_giao_dich(id_nguoi_dung: ObjectId) -> list:
    """Danh sách giao dịch mới nhất trước - US16 (Lịch sử số dư)."""
    cursor = database["giao_dich"].find({
        "id_nguoi_dung": id_nguoi_dung
    }).sort("ngay_tao", -1)

    return [
        _chuan_hoa_giao_dich(giao_dich)
        async for giao_dich in cursor
    ]


async def _thuc_hien_giao_dich(
    id_nguoi_dung: ObjectId,
    *,  # các tham số sau phải gọi theo tên (khóa từ khóa, tránh nhầm lẫn chiều tiền)
    loai_giao_dich: str,
    so_tien: float,
    la_tang: bool,
    mo_ta: str = "",
    id_bai_dang: str | None = None,
) -> dict:
    """Core chuyển tiền của ví: ghi giao_dich + cập nhật so_du + ghi bien_dong.

    la_tang=True (nạp tiền) | False (trừ tiền - góp vốn/quyên góp).
    Tập hợp 3 ghi chép cho 3 collection theo tài liệu database.
    """
    so_tien = _validate_so_tien(so_tien)

    if id_bai_dang and ObjectId.is_valid(id_bai_dang):
        id_bai_dang = ObjectId(id_bai_dang)
    else:
        id_bai_dang = None

    vi = await _dam_bao_so_du(id_nguoi_dung)
    so_du_dang_co = _so(vi["so_du"])

    if not la_tang and so_tien > so_du_dang_co:
        raise SoDuKhongDuError(
            "Số dư tài khoản không đủ. Vui lòng nạp thêm số dư."
        )

    so_du_sau = so_du_dang_co + so_tien if la_tang else so_du_dang_co - so_tien
    now = datetime.now(timezone.utc)

    giao_dich = {
        "id_nguoi_dung": id_nguoi_dung,
        "id_so_du": vi["_id"],
        "loai_giao_dich": loai_giao_dich,
        "so_tien": _tien(so_tien),
        "don_vi_tien_te": vi.get("don_vi_tien_te", "VND"),
        "trang_thai": "Thanh_cong",
        "mo_ta": mo_ta,
        "id_bai_dang": id_bai_dang,
        "ngay_tao": now,
        "thoi_gian_hoan_tat": now,
    }

    result = await database["giao_dich"].insert_one(giao_dich)
    id_giao_dich_moi = result.inserted_id

    await database["so_du"].update_one(
        {"_id": vi["_id"]},
        {"$set": {"so_du": _tien(so_du_sau), "ngay_cap_nhat": now}}
    )

    # bien_dong_so_du: lịch sử biến động, mỗi giao dịch 1 dòng
    await database["bien_dong_so_du"].insert_one({
        "id_giao_dich": id_giao_dich_moi,
        "id_so_du": vi["_id"],
        "loai_bien_dong": "Tang" if la_tang else "Giam",
        "so_tien": _tien(so_tien),
        "so_du": _tien(so_du_sau),
        "ngay_tao": now,
    })

    giao_dich["_id"] = id_giao_dich_moi

    return {
        "giao_dich": _chuan_hoa_giao_dich(giao_dich),
        "vi": {"so_du": so_du_sau, "don_vi_tien_te": "VND"},
    }


async def nap_tien(
    id_nguoi_dung: ObjectId,
    so_tien: float,
    mo_ta: str = "Nạp tiền vào ví",
    id_bai_dang: str | None = None,
    loai_giao_dich: str = "Nap_Tien",
) -> dict:
    """Nạp tiền vào ví - giao dịch loai_giao_dich = Nap_Tien (US13).

    Các luồng khác của hệ thống tái dùng hàm này với loại riêng:
    Giai_Ngan (admin chuyển tiền escrow cho người gọi vốn),
    Hoan_Tra (admin hoàn tiền người góp khi dự án hết hạn).
    """
    if not mo_ta.strip():
        mo_ta = "Nạp tiền vào ví"

    return await _thuc_hien_giao_dich(
        id_nguoi_dung,
        loai_giao_dich=loai_giao_dich,
        so_tien=so_tien,
        la_tang=True,
        mo_ta=mo_ta.strip(),
        id_bai_dang=id_bai_dang,
    )


async def tru_tien(
    id_nguoi_dung: ObjectId,
    so_tien: float,
    loai_giao_dich: str,
    mo_ta: str = "",
    id_bai_dang: str | None = None,
) -> dict:
    """Trừ tiền từ ví (Góp_Von / Quyen_Gop).

    Module khoan_gop_von / khoan_quyen_gop sẽ gọi hàm này để chốt giao
    dịch trước khi tạo khoản góp, giữ nhất quán ví - khoản - bài đăng.
    """
    if not mo_ta.strip():
        mo_ta = f"{loai_giao_dich} qua ví"

    return await _thuc_hien_giao_dich(
        id_nguoi_dung,
        loai_giao_dich=loai_giao_dich,
        so_tien=so_tien,
        la_tang=False,
        mo_ta=mo_ta.strip(),
        id_bai_dang=id_bai_dang,
    )


# ---------------------------------------------------------------------------
# Nạp tiền qua QR ngân hàng + quản trị viên duyệt
#
# Luồng: người dùng tạo yêu cầu (giao_dich Nap_Tien, trạng thái Cho_Xu_Ly)
# -> quét QR chuyển khoản vào tài khoản admin (nội dung = mã giao dịch)
# -> admin đối chiếu sao kê rồi bấm Duyệt -> lúc đó mới cộng tiền vào ví.
# ---------------------------------------------------------------------------


def _dinh_dang_tien(so_tien: float) -> str:
    return f"{so_tien:,.0f}".replace(",", ".") + " ₫"


def _object_id(gia_tri):
    """Chuẩn hóa id (ObjectId hoặc chuỗi 24 hex) -> ObjectId | None."""
    if isinstance(gia_tri, ObjectId):
        return gia_tri
    if isinstance(gia_tri, str) and ObjectId.is_valid(gia_tri):
        return ObjectId(gia_tri)
    return None


async def _tao_ma_nap_duy_nhat() -> str:
    """Mã chuyển khoản ngẫu nhiên, không trùng trong collection giao_dich."""
    bang = string.ascii_uppercase + string.digits

    for _ in range(5):
        ma = "NAP" + "".join(secrets.choice(bang) for _ in range(8))
        da_co = await database["giao_dich"].find_one(
            {"ma_giao_dich": ma}, {"_id": 1}
        )
        if not da_co:
            return ma

    # Xác suất gần như bằng 0 — vẫn phải trả mã thay vì treo
    return "NAP" + secrets.token_hex(6).upper()


async def _ghi_nhat_ky(
    id_quan_tri_vien: ObjectId,
    hanh_dong: str,
    loai_doi_tuong: str,
    ly_do: str = "",
):
    # Collection nhat_ky_quan_tri theo tài liệu database
    await database["nhat_ky_quan_tri"].insert_one({
        "id_quan_tri_vien": id_quan_tri_vien,
        "hanh_dong": hanh_dong,
        "loai_doi_tuong": loai_doi_tuong,
        "ly_do": ly_do.strip(),
        "ngay_tao": datetime.now(timezone.utc),
    })


async def tao_yeu_cau_nap_tien(
    id_nguoi_dung: ObjectId,
    so_tien: float,
    mo_ta: str = "",
) -> dict:
    """Tạo yêu cầu nạp tiền CHỜ DUYỆT (chưa cộng ví).

    Trả kèm mã giao dịch — FE hiển thị mã này trong nội dung chuyển khoản
    để admin đối chiếu sao kê ngân hàng trước khi bấm duyệt.
    """
    so_tien = _validate_so_tien(so_tien)

    if so_tien < money_min_nap:
        raise GiaTriKhongHopLeError(
            f"Số tiền nạp tối thiểu là {money_min_nap:,.0f} VND."
        )

    vi = await _dam_bao_so_du(id_nguoi_dung)
    ma = await _tao_ma_nap_duy_nhat()
    now = datetime.now(timezone.utc)

    giao_dich = {
        "id_nguoi_dung": id_nguoi_dung,
        "id_so_du": vi["_id"],
        "loai_giao_dich": "Nap_Tien",
        "so_tien": _tien(so_tien),
        "don_vi_tien_te": vi.get("don_vi_tien_te", "VND"),
        "trang_thai": "Cho_Xu_Ly",
        "ma_giao_dich": ma,
        "mo_ta": mo_ta.strip() or f"Nạp tiền vào ví (mã {ma})",
        "id_bai_dang": None,
        "ngay_tao": now,
        "thoi_gian_hoan_tat": None,
    }

    result = await database["giao_dich"].insert_one(giao_dich)
    giao_dich["_id"] = result.inserted_id

    # Báo cho quản trị viên có yêu cầu mới (lỗi thông báo không chặn nghiệp vụ)
    try:
        nguoi_dung = await database["nguoi_dung"].find_one(
            {"_id": id_nguoi_dung}, {"ten_tk": 1}
        )
        ten_tk = (nguoi_dung or {}).get("ten_tk", "người dùng")
        await tao_thong_bao_cho_admin(
            loai_thong_bao="Vi",
            tieu_de=f"💰 Yêu cầu nạp {_dinh_dang_tien(so_tien)} từ @{ten_tk}",
            noi_dung=(
                f"Mã {ma} — vào mục Duyệt nạp tiền để đối chiếu sao kê "
                "và xác nhận."
            ),
            loai_doi_tuong=f"nap_tien:{giao_dich['_id']}",
        )
    except Exception:
        pass

    return {
        "giao_dich": _chuan_hoa_giao_dich(giao_dich),
        "noi_dung_chuyen_khoan": ma,
        "vi": {
            "so_du": _so(vi.get("so_du")),
            "don_vi_tien_te": vi.get("don_vi_tien_te", "VND"),
        },
    }


async def huy_yeu_cau_nap_tien(
    id_giao_dich: str,
    id_nguoi_dung: ObjectId,
) -> dict:
    """Người dùng hủy yêu cầu nạp khi chưa chuyển khoản (chỉ khi chờ duyệt)."""
    id_gd = _object_id(id_giao_dich)

    if not id_gd:
        raise KhongTimThayGiaoDichError("Không tìm thấy yêu cầu nạp tiền.")

    now = datetime.now(timezone.utc)

    ket_qua = await database["giao_dich"].find_one_and_update(
        {
            "_id": id_gd,
            "id_nguoi_dung": id_nguoi_dung,
            "loai_giao_dich": "Nap_Tien",
            "trang_thai": "Cho_Xu_Ly",
        },
        {
            "$set": {
                "trang_thai": "Da_Huy",
                "ly_do_tu_choi": "Người dùng hủy yêu cầu",
                "thoi_gian_hoan_tat": now,
            }
        },
        return_document=True,
    )

    if not ket_qua:
        co = await database["giao_dich"].find_one({
            "_id": id_gd,
            "id_nguoi_dung": id_nguoi_dung,
            "loai_giao_dich": "Nap_Tien",
        })

        if not co:
            raise KhongTimThayGiaoDichError("Không tìm thấy yêu cầu nạp tiền.")

        raise GiaoDichDaXuLyError(
            "Yêu cầu đã được xử lý, không thể hủy."
        )

    return _chuan_hoa_giao_dich(ket_qua)


async def lay_yeu_cau_nap_tien(trang_thai: str | None = None) -> list:
    """Danh sách giao dịch nạp tiền cho trang quản trị (mới nhất trước)."""
    if trang_thai and trang_thai not in TRANG_THAI_NAN_TIEN:
        raise ValueError(
            "Trạng thái không hợp lệ. Nhận một trong: "
            + ", ".join(TRANG_THAI_NAN_TIEN)
        )

    dieu_kien = {"loai_giao_dich": "Nap_Tien"}
    if trang_thai:
        dieu_kien["trang_thai"] = trang_thai

    cursor = database["giao_dich"].find(dieu_kien).sort("ngay_tao", -1).limit(300)
    danh_sach = await cursor.to_list(length=300)

    # Ghép tên người nộp để admin đối chiếu nhanh
    id_nguoi_dung = {
        _object_id(dong.get("id_nguoi_dung"))
        for dong in danh_sach
        if dong.get("id_nguoi_dung")
    }
    id_nguoi_dung.discard(None)

    nguoi_dung = {}
    if id_nguoi_dung:
        async for nd in database["nguoi_dung"].find(
            {"_id": {"$in": list(id_nguoi_dung)}},
            {"ten_tk": 1, "ho_ten": 1, "email": 1},
        ):
            nguoi_dung[str(nd["_id"])] = nd

    ket_qua = []
    for dong in danh_sach:
        chuan_hoa = _chuan_hoa_giao_dich(dong)
        nd = nguoi_dung.get(str(dong.get("id_nguoi_dung", "")))
        if nd:
            chuan_hoa["ten_tk"] = nd.get("ten_tk", "")
            chuan_hoa["ho_ten"] = nd.get("ho_ten", "")
            chuan_hoa["email"] = nd.get("email", "")
        ket_qua.append(chuan_hoa)

    return ket_qua


async def duyet_yeu_cau_nap_tien(
    id_giao_dich: str,
    id_quan_tri_vien: ObjectId,
    ghi_chu: str = "",
) -> dict:
    """Admin xác nhận ĐÃ NHẬN TIỀN -> cộng tiền vào ví người dùng.

    Chuyển trạng thái bằng find_one_and_update có điều kiện Cho_Xu_Ly để
    chống cộng tiền 2 lần khi bấm duyệt liên tục.
    """
    id_gd = _object_id(id_giao_dich)

    if not id_gd:
        raise KhongTimThayGiaoDichError("Không tìm thấy yêu cầu nạp tiền.")

    now = datetime.now(timezone.utc)

    giao_dich = await database["giao_dich"].find_one_and_update(
        {
            "_id": id_gd,
            "loai_giao_dich": "Nap_Tien",
            "trang_thai": "Cho_Xu_Ly",
        },
        {
            "$set": {
                "trang_thai": "Thanh_cong",
                "id_nguoi_duyet": id_quan_tri_vien,
                "ghi_chu_duyet": ghi_chu.strip(),
                "ngay_duyet": now,
                "thoi_gian_hoan_tat": now,
            }
        },
        return_document=True,
    )

    if not giao_dich:
        co = await database["giao_dich"].find_one({
            "_id": id_gd,
            "loai_giao_dich": "Nap_Tien",
        })

        if not co:
            raise KhongTimThayGiaoDichError("Không tìm thấy yêu cầu nạp tiền.")

        raise GiaoDichDaXuLyError(
            "Yêu cầu này đã được xử lý trước đó."
        )

    id_nguoi_dung = _object_id(giao_dich.get("id_nguoi_dung"))
    if not id_nguoi_dung:
        raise KhongTimThayGiaoDichError(
            "Giao dịch không gắn với người dùng hợp lệ."
        )

    so_tien = _so(giao_dich["so_tien"])
    vi = await _dam_bao_so_du(id_nguoi_dung)
    so_du_sau = _so(vi.get("so_du")) + so_tien

    await database["so_du"].update_one(
        {"_id": vi["_id"]},
        {"$set": {"so_du": _tien(so_du_sau), "ngay_cap_nhat": now}},
    )

    await database["bien_dong_so_du"].insert_one({
        "id_giao_dich": giao_dich["_id"],
        "id_so_du": vi["_id"],
        "loai_bien_dong": "Tang",
        "so_tien": _tien(so_tien),
        "so_du": _tien(so_du_sau),
        "ngay_tao": now,
    })

    ma = giao_dich.get("ma_giao_dich", "")

    try:
        await tao_thong_bao(
            id_nguoi_dung,
            loai_thong_bao="Vi",
            tieu_de=f"Nạp {_dinh_dang_tien(so_tien)} đã được duyệt ✅",
            noi_dung=(
                f"Mã {ma} đã được cộng vào ví. "
                f"Số dư mới: {_dinh_dang_tien(so_du_sau)}."
            ),
            loai_doi_tuong=f"nap_tien:{giao_dich['_id']}",
        )
    except Exception:
        pass

    try:
        await _ghi_nhat_ky(
            id_quan_tri_vien,
            "Duyet_Nap_Tien",
            f"giao_dich:{ma or giao_dich['_id']}",
            ghi_chu,
        )
    except Exception:
        pass

    return {
        "giao_dich": _chuan_hoa_giao_dich(giao_dich),
        "vi": {"so_du": so_du_sau, "don_vi_tien_te": "VND"},
    }


async def tu_choi_yeu_cau_nap_tien(
    id_giao_dich: str,
    id_quan_tri_vien: ObjectId,
    ly_do: str,
) -> dict:
    """Admin từ chối yêu cầu (chưa nhận được tiền / sai nội dung...)."""
    id_gd = _object_id(id_giao_dich)

    if not id_gd:
        raise KhongTimThayGiaoDichError("Không tìm thấy yêu cầu nạp tiền.")

    if not ly_do.strip():
        raise GiaTriKhongHopLeError("Vui lòng nhập lý do từ chối.")

    now = datetime.now(timezone.utc)

    giao_dich = await database["giao_dich"].find_one_and_update(
        {
            "_id": id_gd,
            "loai_giao_dich": "Nap_Tien",
            "trang_thai": "Cho_Xu_Ly",
        },
        {
            "$set": {
                "trang_thai": "That_bai",
                "id_nguoi_duyet": id_quan_tri_vien,
                "ly_do_tu_choi": ly_do.strip(),
                "ngay_duyet": now,
                "thoi_gian_hoan_tat": now,
            }
        },
        return_document=True,
    )

    if not giao_dich:
        co = await database["giao_dich"].find_one({
            "_id": id_gd,
            "loai_giao_dich": "Nap_Tien",
        })

        if not co:
            raise KhongTimThayGiaoDichError("Không tìm thấy yêu cầu nạp tiền.")

        raise GiaoDichDaXuLyError(
            "Yêu cầu này đã được xử lý trước đó."
        )

    id_nguoi_dung = _object_id(giao_dich.get("id_nguoi_dung"))
    so_tien = _so(giao_dich["so_tien"])
    ma = giao_dich.get("ma_giao_dich", "")

    if id_nguoi_dung:
        try:
            await tao_thong_bao(
                id_nguoi_dung,
                loai_thong_bao="Vi",
                tieu_de=f"Yêu cầu nạp {_dinh_dang_tien(so_tien)} bị từ chối 🚫",
                noi_dung=(
                    f"Mã {ma}: {ly_do.strip()} — tiền chưa được cộng vào ví."
                ),
                loai_doi_tuong=f"nap_tien:{giao_dich['_id']}",
            )
        except Exception:
            pass

    try:
        await _ghi_nhat_ky(
            id_quan_tri_vien,
            "Tu_Choi_Nap_Tien",
            f"giao_dich:{ma or giao_dich['_id']}",
            ly_do,
        )
    except Exception:
        pass

    return {"giao_dich": _chuan_hoa_giao_dich(giao_dich)}
