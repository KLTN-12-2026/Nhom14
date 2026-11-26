# API tài liệu đính kèm (PDF/Word) của bài đăng.
# Upload: multipart/form-data -> GridFS + metadata trong tai_lieu_bai_dang.
# Tải xuống: stream từ GridFS, trả đúng tên file để trình duyệt tải về.

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.services import tai_lieu as dich_vu
from app.services.tai_lieu import (
    KhongCoQuyenTaiLieuError,
    KhongTimThayTaiLieuError,
    TaiLieuKhongHopLeError,
)
from app.utils.auth import get_current_user, get_user_tuy_chon, la_admin as kiem_tra_admin

router = APIRouter(prefix="/api", tags=["Tai Lieu Bai Dang"])


def _loi(error: Exception):
    if isinstance(error, (KhongTimThayTaiLieuError, TaiLieuKhongHopLeError,
                          KhongCoQuyenTaiLieuError)):
        ma = (
            404 if isinstance(error, KhongTimThayTaiLieuError)
            else 403 if isinstance(error, KhongCoQuyenTaiLieuError)
            else 400
        )
        raise HTTPException(status_code=ma, detail=str(error))
    raise error


@router.post(
    "/bai-dang/{id_bai_dang}/tai-lieu",
    status_code=status.HTTP_201_CREATED,
)
async def tai_len_tai_lieu(
    id_bai_dang: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload PDF/Word cho bài đăng (chủ bài hoặc admin)."""
    try:
        return await dich_vu.tai_len(
            id_bai_dang,
            file.filename or "tai-lieu",
            file.content_type,
            file.file,
            current_user["_id"],
        )
    except Exception as error:
        _loi(error)


@router.get("/bai-dang/{id_bai_dang}/tai-lieu")
async def danh_sach_tai_lieu(id_bai_dang: str):
    """Danh sách metadata tài liệu — công khai, KHÔNG trả nội dung file."""
    try:
        return await dich_vu.danh_sach(id_bai_dang)
    except Exception as error:
        _loi(error)


@router.get("/tai-lieu/{id_tai_lieu}/tai")
async def tai_tai_lieu(id_tai_lieu: str):
    """Tải nội dung file từ GridFS — công khai cho người xem bài."""
    try:
        dong, noi_dung = await dich_vu.doc_noi_dung(id_tai_lieu)
    except Exception as error:
        _loi(error)

    ten_file = dong.get("ten_file", "tai-lieu")
    # DB lưu đuôi ngắn theo schema — đổi sang MIME cho browser.
    # FE hiện chỉ cho upload PDF; vẫn giữ doc/docx để tương thích dữ liệu cũ.
    mime = {
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }.get(dong.get("loai_file"), "application/octet-stream")

    # Header HTTP chỉ nhận Latin-1 -> tên file tiếng Việt (vd "Báo cáo.pdf")
    # gây UnicodeEncodeError 500. Dùng filename* theo RFC 5987 + tên ASCII
    # dự phòng. inline để browser mở PDF trong tab mới thay vì bắt tải về.
    from urllib.parse import quote
    ten_ascii = "".join(
        c if ord(c) < 128 else "_" for c in ten_file
    ) or "tai-lieu.pdf"
    content_disposition = (
        f"inline; filename=\"{ten_ascii}\"; "
        f"filename*=UTF-8''{quote(ten_file)}"
    )

    return Response(
        content=noi_dung,
        media_type=mime,
        headers={"Content-Disposition": content_disposition},
    )


@router.delete("/tai-lieu/{id_tai_lieu}", status_code=status.HTTP_204_NO_CONTENT)
async def xoa_tai_lieu(
    id_tai_lieu: str,
    current_user: dict = Depends(get_user_tuy_chon),
):
    """Xoá tài liệu (chủ bài / người tải / admin)."""
    la_admin = bool(current_user and await kiem_tra_admin(current_user))
    id_nguoi = current_user.get("_id") if current_user else None
    try:
        await dich_vu.xoa(id_tai_lieu, id_nguoi, la_admin=la_admin)
    except Exception as error:
        _loi(error)
