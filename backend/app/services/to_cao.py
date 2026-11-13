from bson import ObjectId
from datetime import datetime, timezone

from app.config.database import database


# Trạng thái tố cáo theo tài liệu DB (collection to_cao_bai_dang)
TRANG_THAI_HOP_LE = {"Chua_Xu_Ly", "Da_Xu_Ly"}


class KhongTimThayToCaoError(Exception):
    """Mã tố cáo không tồn tại trong to_cao_bai_dang."""
    pass


class TrangThaiToCaoError(Exception):
    """Trạng thái xử lý không hợp lệ."""
    pass


class ToCaoTrungError(Exception):
    """Người dùng đã tố cáo bài này và tố cáo cũ vẫn chưa xử lý."""
    pass


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


async def _chuan_hoa_nhieu(docs: list) -> list:
    """Chuẩn hóa nhiều tố cáo + ghép quan hệ lúc đọc (không đổi schema DB):
    - thong_tin_bai_dang.tieu_de  <- bai_dang (batch $in)
    - thong_tin_nguoi_to_cao      <- nguoi_dung (batch $in)
    - thong_tin_nguoi_xu_ly       <- nguoi_dung (batch $in)
    """
    if not docs:
        return []

    id_bai = [d["id_bai_dang"] for d in docs if d.get("id_bai_dang")]
    id_nguoi = [
        d[k]
        for d in docs
        for k in ("id_nguoi_to_cao", "id_nguoi_xu_ly")
        if d.get(k)
    ]

    ban_do_bai = {}
    if id_bai:
        cursor = database["bai_dang"].find({"_id": {"$in": id_bai}}, {"tieu_de": 1})
        ban_do_bai = {doc["_id"]: doc.get("tieu_de", "") async for doc in cursor}

    ban_do_nguoi = {}
    if id_nguoi:
        cursor = database["nguoi_dung"].find(
            {"_id": {"$in": id_nguoi}}, {"ten_tk": 1, "ho_ten": 1}
        )
        ban_do_nguoi = {
            doc["_id"]: {
                "id": str(doc["_id"]),
                "ten_tk": doc.get("ten_tk", ""),
                "ho_ten": doc.get("ho_ten", ""),
            }
            async for doc in cursor
        }

    ket_qua = []
    for doc in docs:
        nguoi_to_cao = ban_do_nguoi.get(doc.get("id_nguoi_to_cao"))
        nguoi_xu_ly = ban_do_nguoi.get(doc.get("id_nguoi_xu_ly"))

        ket_qua.append({
            "id": str(doc["_id"]),
            "id_bai_dang": str(doc["id_bai_dang"]),
            "id_nguoi_to_cao": str(doc["id_nguoi_to_cao"])
            if doc.get("id_nguoi_to_cao") else None,
            "id_nguoi_xu_ly": str(doc["id_nguoi_xu_ly"])
            if doc.get("id_nguoi_xu_ly") else None,
            "ly_do": doc.get("ly_do", ""),
            "mo_ta": doc.get("mo_ta"),
            "trang_thai": doc.get("trang_thai", "Chua_Xu_Ly"),
            "ghi_chu": doc.get("ghi_chu"),
            "ngay_tao": _iso(doc.get("ngay_tao")),
            "ngay_xu_ly": _iso(doc.get("ngay_xu_ly")),
            "thong_tin_bai_dang": (
                {"tieu_de": ban_do_bai.get(doc["id_bai_dang"], "")}
                if doc.get("id_bai_dang") in ban_do_bai else None
            ),
            "thong_tin_nguoi_to_cao": nguoi_to_cao,
            "thong_tin_nguoi_xu_ly": (
                {"id": nguoi_xu_ly["id"], "ten_tk": nguoi_xu_ly["ten_tk"]}
                if nguoi_xu_ly else None
            ),
        })

    return ket_qua


async def tao_to_cao(id_nguoi_to_cao: ObjectId, du_lieu: dict) -> dict:
    """Người dùng tố cáo bài đăng - PB11.

    Một bài chưa xử lý thì không nhận tố cáo trùng từ cùng người
    (tránh spam hết bảng admin); tố cáo mới cho phép khi cũ đã xử lý xong.
    """
    ma_bai = du_lieu["id_bai_dang"]
    if not ma_bai or not ObjectId.is_valid(ma_bai):
        raise ValueError("Mã bài đăng không hợp lệ.")

    bai_dang = await database["bai_dang"].find_one({"_id": ObjectId(ma_bai)})
    if not bai_dang:
        raise ValueError("Không tìm thấy bài đăng bị tố cáo.")

    # Chống spam tố cáo trùng chưa xử lý (cùng người + cùng bài)
    da_co = await database["to_cao_bai_dang"].find_one({
        "id_bai_dang": ObjectId(ma_bai),
        "id_nguoi_to_cao": id_nguoi_to_cao,
        "trang_thai": "Chua_Xu_Ly",
    })
    if da_co:
        raise ToCaoTrungError(
            "Bạn đã tố cáo bài này và tố cáo đang chờ xử lý. "
            "Vui lòng chờ quản trị viên kết luận."
        )

    now = datetime.now(timezone.utc)
    to_cao = {
        "id_bai_dang": ObjectId(ma_bai),
        "id_nguoi_to_cao": id_nguoi_to_cao,
        "id_nguoi_xu_ly": None,
        "ly_do": du_lieu["ly_do"].strip(),
        "mo_ta": (du_lieu.get("mo_ta") or "").strip() or None,
        "trang_thai": "Chua_Xu_Ly",
        "ghi_chu": None,
        "ngay_tao": now,
        "ngay_xu_ly": None,
    }

    result = await database["to_cao_bai_dang"].insert_one(to_cao)
    to_cao["_id"] = result.inserted_id

    # Thông báo cho MỌI quản trị viên: có tố cáo mới cần xử lý.
    # Badge chuông admin đếm đúng số tố cáo chưa đọc — 2 người tố cáo
    # trong ngày = admin đăng nhập thấy badge 2 + 2 dòng thông báo.
    try:
        from app.services.thong_bao import tao_thong_bao_cho_admin

        nguoi_to_cao = await database["nguoi_dung"].find_one(
            {"_id": id_nguoi_to_cao}, {"ho_ten": 1, "ten_tk": 1}
        )
        ten_nguoi_to_cao = (
            (nguoi_to_cao or {}).get("ho_ten")
            or (nguoi_to_cao or {}).get("ten_tk")
            or "Một người dùng"
        )

        await tao_thong_bao_cho_admin(
            loai_thong_bao="He_Thong",
            tieu_de="Có tố cáo mới cần xử lý 🚩",
            noi_dung=(
                f'"{ten_nguoi_to_cao}" đã tố cáo bài '
                f'"{bai_dang.get("tieu_de", "")}" — Lý do: '
                f'{to_cao["ly_do"]}.'
                + (
                    f" Mô tả: {to_cao['mo_ta']}"
                    if to_cao.get("mo_ta")
                    else ""
                )
            ),
            loai_doi_tuong=f"to_cao:{str(result.inserted_id)}",
        )
    except Exception:
        # Thông báo phụ trợ — lỗi không làm sập tố cáo chính
        pass

    (danh_sach,) = await _chuan_hoa_nhieu([to_cao])
    return danh_sach


async def lay_danh_sach_to_cao() -> list:
    """Toàn bộ tố cáo cho admin - PB20.

    Sắp xếp: chưa xử lý lên đầu (alphabet 'Chua_Xu_Ly' < 'Da_Xu_Ly'),
    trong cùng nhóm mới nhất trước.
    """
    cursor = database["to_cao_bai_dang"].find({}).sort([
        ("trang_thai", 1),
        ("ngay_tao", -1),
    ])

    docs = [doc async for doc in cursor]
    return await _chuan_hoa_nhieu(docs)


async def xu_ly_to_cao(
    ma_to_cao: str,
    trang_thai: str,
    ghi_chu: str | None,
    id_nguoi_xu_ly: ObjectId,
) -> dict:
    """Admin kết luận tố cáo - PB20: trạng thái + ghi chú + thời điểm xử lý."""
    if trang_thai not in TRANG_THAI_HOP_LE:
        raise TrangThaiToCaoError(
            "Trạng thái không hợp lệ. Nhận một trong: "
            + ", ".join(sorted(TRANG_THAI_HOP_LE))
        )

    if not ma_to_cao or not ObjectId.is_valid(ma_to_cao):
        raise KhongTimThayToCaoError("Mã tố cáo không hợp lệ.")

    now = datetime.now(timezone.utc)
    cap_nhat = await database["to_cao_bai_dang"].find_one_and_update(
        {"_id": ObjectId(ma_to_cao)},
        {"$set": {
            "trang_thai": trang_thai,
            "ghi_chu": (ghi_chu or "").strip() or None,
            "id_nguoi_xu_ly": id_nguoi_xu_ly,
            "ngay_xu_ly": now,
        }},
        return_document=True,
    )

    if not cap_nhat:
        raise KhongTimThayToCaoError("Không tìm thấy tố cáo.")

    # Ghi nhật ký quản trị (nhat_ky_quan_tri)
    await database["nhat_ky_quan_tri"].insert_one({
        "id_quan_tri_vien": id_nguoi_xu_ly,
        "hanh_dong": f"Xu_Ly_To_Cao_{trang_thai}",
        "loai_doi_tuong": f"to_cao:{ma_to_cao}",
        "ly_do": (ghi_chu or "").strip(),
        "ngay_tao": now,
    })

    # Thông báo cho người tố cáo kết quả (module thong_bao) - phụ trợ,
    # lỗi không làm sập xử lý chính.
    try:
        from app.services.thong_bao import tao_thong_bao

        if trang_thai == "Da_Xu_Ly":
            ket_luan = (ghi_chu or "").strip()
            await tao_thong_bao(
                cap_nhat["id_nguoi_to_cao"],
                loai_thong_bao="He_Thong",
                tieu_de="Tố cáo của bạn đã được xử lý ✅",
                noi_dung=(
                    f"Lý do tố cáo: {cap_nhat.get('ly_do', '')}. "
                    + (
                        f"Kết luận của quản trị viên: {ket_luan}"
                        if ket_luan
                        else "Quản trị viên đã kiểm tra và kết luận."
                    )
                ),
                loai_doi_tuong=f"to_cao:{str(cap_nhat['_id'])}",
            )
    except Exception:
        pass

    (danh_sach,) = await _chuan_hoa_nhieu([cap_nhat])
    return danh_sach
