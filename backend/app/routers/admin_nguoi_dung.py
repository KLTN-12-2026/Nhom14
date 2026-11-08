
from fastapi import APIRouter, Depends, HTTPException

from app.schemas.nguoi_dung_admin import (
    DoiVaiTroRequest,
    KhoaTaiKhoanRequest,
)
from app.services import nguoi_dung_admin as dich_vu
from app.services.nguoi_dung_admin import (
    KhongTimThayNguoiDungError,
    ThaoTacKhongHopLeError,
)
from app.utils.auth import get_current_admin_user


router = APIRouter(
    prefix="/api/admin/nguoi-dung",
    tags=["Admin - Nguoi Dung"]
)


@router.get("/nhat-ky")
async def nhat_ky_quan_tri(
    current_user: dict = Depends(get_current_admin_user)
):
    """Nhật ký quản trị (nhat_ky_quan_tri) - mới nhất trước."""
    return await dich_vu.doc_nhat_ky()


@router.get("")
async def danh_sach_nguoi_dung(
    tim_kiem: str | None = None,
    current_user: dict = Depends(get_current_admin_user),
):
    """Danh sách người dùng (vai_tro + trang_thai) - PB17."""
    return await dich_vu.lay_danh_sach_nguoi_dung(
        tim_kiem=tim_kiem
    )


@router.put("/{ten_tk}/vai-tro")
async def doi_vai_tro(
    ten_tk: str,
    yeu_cau: DoiVaiTroRequest,
    current_user: dict = Depends(get_current_admin_user),
):
    """Đổi vai trò người dùng (nguoi_dung_cv) - PB17."""
    try:
        return await dich_vu.doi_vai_tro(
            ten_tk,
            yeu_cau.vai_tro,
            id_quan_tri_vien=current_user["_id"],
        )
    except KhongTimThayNguoiDungError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ThaoTacKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.put("/{ten_tk}/khoa")
async def khoa_tai_khoan(
    ten_tk: str,
    yeu_cau: KhoaTaiKhoanRequest,
    current_user: dict = Depends(get_current_admin_user),
):
    """Khóa tài khoản + ghi lý do vào nhat_ky_quan_tri - PB17."""
    try:
        return await dich_vu.khoa_tai_khoan(
            ten_tk,
            yeu_cau.ly_do,
            id_quan_tri_vien=current_user["_id"],
        )
    except KhongTimThayNguoiDungError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ThaoTacKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.put("/{ten_tk}/mo-khoa")
async def mo_khoa_tai_khoan(
    ten_tk: str,
    current_user: dict = Depends(get_current_admin_user),
):
    """Mở khóa tài khoản - PB17."""
    try:
        return await dich_vu.mo_khoa_tai_khoan(
            ten_tk,
            id_quan_tri_vien=current_user["_id"],
        )
    except KhongTimThayNguoiDungError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ThaoTacKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))
