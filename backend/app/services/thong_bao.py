from bson import ObjectId
from datetime import datetime, timezone

from app.config.database import database
from app.utils.auth import TEN_CHUC_VU_ADMIN


# Loại thông báo khớp hệ FE (chuongService LOAI_THONG_BAO):
# He_Thong | Su_Kien | Ket_Qua_Duyet | Vi
LOAI_HOP_LE = {"He_Thong", "Su_Kien", "Ket_Qua_Duyet", "Vi"}


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


def _chuan_hoa(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_nguoi_dung": str(doc["id_nguoi_dung"])
        if doc.get("id_nguoi_dung") else None,
        "loai_thong_bao": doc.get("loai_thong_bao", "He_Thong"),
        "tieu_de": doc.get("tieu_de", ""),
        "noi_dung": doc.get("noi_dung", ""),
        "loai_doi_tuong": doc.get("loai_doi_tuong"),
        "da_doc": bool(doc.get("da_doc")),
        "ngay_tao": _iso(doc.get("ngay_tao")),
    }


async def tao_thong_bao(
    id_nguoi_dung: ObjectId,
    *,
    loai_thong_bao: str = "He_Thong",
    tieu_de: str,
    noi_dung: str = "",
    loai_doi_tuong: str | None = None,
) -> dict | None:
    """Tạo 1 thông báo cho 1 người (gọi từ các luồng sự kiện khác).

    Trả bản chuẩn hóa hoặc None nếu đầu vào trống (không ném — thông
    báo là phụ trợ, lỗi này không được làm sập nghiệp vụ chính).
    """
    if not id_nguoi_dung or not tieu_de:
        return None

    if loai_thong_bao not in LOAI_HOP_LE:
        loai_thong_bao = "He_Thong"

    now = datetime.now(timezone.utc)
    doc = {
        "id_nguoi_dung": id_nguoi_dung,
        "loai_thong_bao": loai_thong_bao,
        "tieu_de": tieu_de.strip(),
        "noi_dung": (noi_dung or "").strip(),
        "loai_doi_tuong": loai_doi_tuong,
        "da_doc": False,
        "ngay_tao": now,
    }

    result = await database["thong_bao"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _chuan_hoa(doc)


async def lay_thong_bao(id_nguoi_dung: ObjectId) -> list:
    """Hộp thư của tôi: mới nhất trước (chuông FE gọi khi mở trang)."""
    cursor = database["thong_bao"].find(
        {"id_nguoi_dung": id_nguoi_dung}
    ).sort("ngay_tao", -1).limit(100)

    return [_chuan_hoa(doc) async for doc in cursor]


async def danh_dau_da_doc(ma_thong_bao: str, id_nguoi_dung: ObjectId) -> dict:
    """Đánh dấu 1 thông báo đã đọc — chỉ đọc được thông báo của chính mình."""
    if not ma_thong_bao or not ObjectId.is_valid(ma_thong_bao):
        raise ValueError("Mã thông báo không hợp lệ.")

    cap_nhat = await database["thong_bao"].find_one_and_update(
        {
            "_id": ObjectId(ma_thong_bao),
            "id_nguoi_dung": id_nguoi_dung,
        },
        {"$set": {"da_doc": True}},
        return_document=True,
    )

    if not cap_nhat:
        raise LookupError("Không tìm thấy thông báo.")

    return _chuan_hoa(cap_nhat)


async def danh_dau_tat_ca_da_doc(id_nguoi_dung: ObjectId) -> int:
    """Đọc tất cả: trả số thông báo vừa chuyển sang đã đọc."""
    ket_qua = await database["thong_bao"].update_many(
        {"id_nguoi_dung": id_nguoi_dung, "da_doc": False},
        {"$set": {"da_doc": True}},
    )
    return ket_qua.modified_count


# ---------- Thông báo nhóm (gửi cho mọi quản trị viên) ----------


async def lay_danh_sach_id_admin() -> list:
    """Tất cả id người dùng có chức vụ quản trị (nguoi_dung_cv + chuc_vu)."""
    chuc_vu_admin = await database["chuc_vu"].find({
        "ten_cv": {"$in": list(TEN_CHUC_VU_ADMIN)}
    }).to_list(length=None)

    id_chuc_vu = [cv["_id"] for cv in chuc_vu_admin]
    if not id_chuc_vu:
        return []

    cursor = database["nguoi_dung_cv"].find(
        {"id_chuc_vu": {"$in": id_chuc_vu}},
        {"id_nguoi_dung": 1},
    )

    return [doc["id_nguoi_dung"] async for doc in cursor if doc.get("id_nguoi_dung")]


async def tao_thong_bao_cho_admin(
    *,
    loai_thong_bao: str = "He_Thong",
    tieu_de: str,
    noi_dung: str = "",
    loai_doi_tuong: str | None = None,
) -> int:
    """Gửi 1 thông báo cho MỌI quản trị viên — mỗi admin 1 dòng riêng
    (đọc riêng, badge riêng). Trả số admin đã nhận.
    """
    id_admin = await lay_danh_sach_id_admin()
    if not id_admin or not tieu_de:
        return 0

    if loai_thong_bao not in LOAI_HOP_LE:
        loai_thong_bao = "He_Thong"

    now = datetime.now(timezone.utc)
    tai_lieu = [
        {
            "id_nguoi_dung": id_nguoi_dung,
            "loai_thong_bao": loai_thong_bao,
            "tieu_de": tieu_de.strip(),
            "noi_dung": (noi_dung or "").strip(),
            "loai_doi_tuong": loai_doi_tuong,
            "da_doc": False,
            "ngay_tao": now,
        }
        for id_nguoi_dung in id_admin
    ]

    result = await database["thong_bao"].insert_many(tai_lieu)
    return len(result.inserted_ids)
