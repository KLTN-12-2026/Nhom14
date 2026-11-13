
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.bai_dang import BaiDangCreate, BaiDangUpdate
from app.services import bai_dang as dich_vu
from app.services.bai_dang import (
    KhongCoQuyenBaiDangError,
    KhongTimThayBaiDangError,
)
from app.utils.auth import get_current_user, get_user_tuy_chon


router = APIRouter(
    prefix="/api/bai-dang",
    tags=["Bai Dang"]
)


@router.get("")
async def danh_sach_cong_khai(
    loai: str | None = None,
    tim_kiem: str | None = None,
    skip: int = 0,
    limit: int = 20,
):
    """Danh sách bài đăng công khai (chỉ bài đã duyệt) - PB10."""
    if loai and loai not in dich_vu.LOAI_BAI_DANG_HOP_LE:
        raise HTTPException(
            status_code=400,
            detail=(
                "Loại bài đăng không hợp lệ. "
                f"Nhận một trong: {', '.join(dich_vu.LOAI_BAI_DANG_HOP_LE)}"
            )
        )

    return await dich_vu.lay_bai_dang_cong_khai(
        loai=loai, tim_kiem=tim_kiem, skip=skip, limit=limit
    )


@router.get("/cua-toi")
async def bai_dang_cua_toi(
    current_user: dict = Depends(get_current_user)
):
    """Danh sách bài đăng do người dùng hiện tại tạo - PB09."""
    return await dich_vu.lay_bai_dang_cua_toi(current_user["_id"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
async def tao_bai_dang(
    du_lieu: BaiDangCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo bài đăng mới (trạng thái Chờ duyệt) - PB07."""
    try:
        return await dich_vu.tao_bai_dang(
            du_lieu.model_dump(),
            id_nguoi_dang=current_user["_id"]
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/{id_bai_dang}")
async def chi_tiet_bai_dang(
    id_bai_dang: str,
    nguoi_hien_tai: dict | None = Depends(get_user_tuy_chon),
):
    """Chi tiết bài đăng - PB10 (công khai; bài chưa duyệt/bị ẩn chỉ chủ
    bài hoặc quản trị viên xem được)."""
    from app.utils.auth import la_admin

    try:
        return await dich_vu.lay_bai_dang_theo_id(
            id_bai_dang,
            id_nguoi_hien_tai=(
                nguoi_hien_tai["_id"] if nguoi_hien_tai else None
            ),
            la_quan_tri=(
                bool(nguoi_hien_tai and await la_admin(nguoi_hien_tai))
            ),
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.put("/{id_bai_dang}")
async def cap_nhat_bai_dang(
    id_bai_dang: str,
    du_lieu: BaiDangUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật bài (chỉ chủ bài; đã duyệt -> về chờ duyệt) - PB08."""
    try:
        return await dich_vu.cap_nhat_bai_dang(
            id_bai_dang,
            du_lieu.model_dump(exclude_unset=True),
            id_nguoi_dang=current_user["_id"]
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except KhongCoQuyenBaiDangError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/{id_bai_dang}", status_code=status.HTTP_204_NO_CONTENT)
async def xoa_bai_dang(
    id_bai_dang: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa bài đăng (chỉ chủ bài)."""
    try:
        await dich_vu.xoa_bai_dang(
            id_bai_dang,
            id_nguoi_dang=current_user["_id"]
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except KhongCoQuyenBaiDangError as error:
        raise HTTPException(status_code=403, detail=str(error))
