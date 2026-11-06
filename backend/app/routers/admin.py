
from fastapi import APIRouter, Depends, HTTPException

from app.schemas.bai_dang import DuyetBaiDangRequest
from app.services import bai_dang as dich_vu
from app.services.bai_dang import KhongTimThayBaiDangError
from app.utils.auth import get_current_admin_user


router = APIRouter(
    prefix="/api/admin/bai-dang",
    tags=["Admin - Bai Dang"]
)


@router.get("")
async def danh_sach_quan_tri(
    trang_thai: str | None = None,
    current_user: dict = Depends(get_current_admin_user)
):
    """Quản lý bài đăng: xem mọi bài, lọc theo trạng thái - PB18."""
    if trang_thai and trang_thai not in dich_vu.TRANG_THAI_MO_TA:
        raise HTTPException(
            status_code=400,
            detail=(
                "Trạng thái không hợp lệ. Nhận một trong: "
                + ", ".join(dich_vu.TRANG_THAI_MO_TA.keys())
            )
        )

    return await dich_vu.lay_bai_dang_quan_tri(trang_thai=trang_thai)


@router.get("/{id_bai_dang}/lich-su-duyet")
async def lich_su_duyet(
    id_bai_dang: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Lịch sử xét duyệt của một bài đăng (lich_su_duyet_bai)."""
    return await dich_vu.doc_lich_su_duyet(id_bai_dang)


@router.put("/{id_bai_dang}/duyet")
async def duyet_bai_dang(
    id_bai_dang: str,
    yeu_cau: DuyetBaiDangRequest,
    current_user: dict = Depends(get_current_admin_user)
):
    """Duyệt hoặc từ chối bài chờ duyệt - PB19.

    Cả hai quyết định đều ghi vào lich_su_duyet_bai kèm id_nguoi_duyet,
    ly_do va ngay_tao de truy vet.
    """
    try:
        return await dich_vu.duyet_bai_dang(
            id_bai_dang,
            yeu_cau.hanh_dong,
            yeu_cau.ly_do,
            id_nguoi_duyet=current_user["_id"]
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
