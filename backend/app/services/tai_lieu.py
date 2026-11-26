# Tài liệu đính kèm của bài đăng (PDF/Word).
#
# Thiết kế DB:
#   - collection `tai_lieu_bai_dang`: chỉ lưu metadata + id_file_gridfs
#     (index: id_bai_dang:1 nonunique, id_file_gridfs:1 unique).
#   - GridFS (`fs.files` / `fs.chunks`): lưu nội dung file, tự chia chunk
#     nên không vượt giới hạn 16 MB của 1 document MongoDB.
#   - collection `bai_dang`: KHÔNG lưu nội dung file — truy vấn danh sách
#     bài không bị kéo theo tài liệu nặng.

from bson import Int64, ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from gridfs import AsyncGridFSBucket
from typing import BinaryIO

from app.config.database import database

COLLECTION = "tai_lieu_bai_dang"
BUCKET = AsyncGridFSBucket(database, bucket_name="fs")

# FE và BE đồng nhất: chỉ nhận PDF để người dùng mở được ngay trên browser
LOAI_HOP_LE = {"application/pdf"}
DUOI_HOP_LE = (".pdf",)
KICH_THUOC_TOI_DA = 10 * 1024 * 1024  # 10 MB


class TaiLieuKhongHopLeError(Exception):
    pass


class KhongTimThayTaiLieuError(Exception):
    pass


class KhongCoQuyenTaiLieuError(Exception):
    pass


def _hop_le(ten_file: str, loai: str | None) -> bool:
    ten = (ten_file or "").lower()
    return (loai in LOAI_HOP_LE) or ten.endswith(DUOI_HOP_LE)


def _loai_theo_duoi(ten_file: str) -> str:
    """Schema DB dùng 'pdf'/'doc'/'docx' (không phải MIME type)."""
    ten = (ten_file or "").lower()
    if ten.endswith(".pdf"):
        return "pdf"
    if ten.endswith(".docx"):
        return "docx"
    return "doc"


def _chuan_hoa(dong: dict) -> dict:
    return {
        "id": str(dong["_id"]),
        "id_bai_dang": str(dong["id_bai_dang"]),
        "ten_file": dong.get("ten_file", ""),
        "loai_file": dong.get("loai_file", ""),
        "kich_thuoc": int(dong.get("kich_thuoc", 0)),
        "ngay_tai": dong.get("ngay_tai").isoformat()
        if dong.get("ngay_tai")
        else None,
        "url": f"/api/tai-lieu/{str(dong['_id'])}/tai",
    }


async def _tim_bai(id_bai_dang: str) -> dict:
    try:
        id_object = ObjectId(id_bai_dang)
    except (InvalidId, TypeError):
        raise KhongTimThayTaiLieuError("Mã bài đăng không hợp lệ.")

    bai = await database["bai_dang"].find_one({"_id": id_object})
    if not bai:
        raise KhongTimThayTaiLieuError("Không tìm thấy bài đăng.")
    return bai


async def tai_len(
    id_bai_dang: str,
    ten_file: str,
    loai_file: str | None,
    noi_dung: BinaryIO,
    id_nguoi_tai: ObjectId,
) -> dict:
    """Ghi nội dung vào GridFS rồi insert metadata — dùng 1 doc riêng."""
    await _tim_bai(id_bai_dang)

    if not _hop_le(ten_file, loai_file):
        raise TaiLieuKhongHopLeError(
            "Chỉ chấp nhận tệp PDF (.pdf)."
        )

    # Đọc để kiểm tra kích thước trước khi ghi GridFS (tránh rác khi lỗi)
    du_lieu = noi_dung.read(KICH_THUOC_TOI_DA + 1)
    if len(du_lieu) > KICH_THUOC_TOI_DA:
        raise TaiLieuKhongHopLeError("Tài liệu phải có dung lượng không quá 10 MB.")
    if not du_lieu:
        raise TaiLieuKhongHopLeError("Tệp tài liệu đang rỗng.")

    id_gridfs = await BUCKET.upload_from_stream(
        ten_file,
        du_lieu,
        metadata={
            "id_bai_dang": ObjectId(id_bai_dang),
            "id_nguoi_tai": id_nguoi_tai,
            "loai_file": _loai_theo_duoi(ten_file),
        },
    )

    now = datetime.now(timezone.utc)
    try:
        ket_qua = await database[COLLECTION].insert_one({
            "id_bai_dang": ObjectId(id_bai_dang),
            "id_file_gridfs": id_gridfs,
            "ten_file": ten_file,
            # Validator của collection chỉ nhận pdf/doc/docx
            "loai_file": _loai_theo_duoi(ten_file),
            # Validator yêu cầu bsonType long -> Int64, không phải int32
            "kich_thuoc": Int64(len(du_lieu)),
            "ngay_tai": now,
            "id_nguoi_tai": id_nguoi_tai,
        })
    except Exception:
        # Metadata lỗi -> xoá file GridFS đã upload để không rác
        await BUCKET.delete(id_gridfs)
        raise

    return _chuan_hoa(await database[COLLECTION].find_one({"_id": ket_qua.inserted_id}))


async def danh_sach(id_bai_dang: str) -> list:
    """Chỉ trả metadata — không trả nội dung file."""
    await _tim_bai(id_bai_dang)
    cursor = database[COLLECTION].find(
        {"id_bai_dang": ObjectId(id_bai_dang)}
    ).sort("ngay_tai", 1)
    ket_qua = []
    async for dong in cursor:
        ket_qua.append(_chuan_hoa(dong))
    return ket_qua


async def _tim_theo_id(id_tai_lieu: str) -> dict:
    try:
        id_object = ObjectId(id_tai_lieu)
    except (InvalidId, TypeError):
        raise KhongTimThayTaiLieuError("Mã tài liệu không hợp lệ.")

    dong = await database[COLLECTION].find_one({"_id": id_object})
    if not dong:
        raise KhongTimThayTaiLieuError("Không tìm thấy tài liệu.")
    return dong


async def doc_noi_dung(id_tai_lieu: str) -> tuple[dict, bytes]:
    dong = await _tim_theo_id(id_tai_lieu)
    luong = await BUCKET.open_download_stream(dong["id_file_gridfs"])
    noi_dung = await luong.read()
    return dong, noi_dung


async def xoa(id_tai_lieu: str, id_nguoi_xoa: ObjectId, la_admin: bool = False) -> None:
    dong = await _tim_theo_id(id_tai_lieu)

    if not la_admin and dong.get("id_nguoi_tai") != id_nguoi_xoa:
        # Chủ bài cũng được xoá tài liệu của bài mình
        bai = await database["bai_dang"].find_one(
            {"_id": dong["id_bai_dang"]}
        )
        if not bai or bai.get("id_nguoi_dang") != id_nguoi_xoa:
            raise KhongCoQuyenTaiLieuError(
                "Bạn không có quyền xoá tài liệu này."
            )

    await database[COLLECTION].delete_one({"_id": dong["_id"]})
    await BUCKET.delete(dong["id_file_gridfs"])
