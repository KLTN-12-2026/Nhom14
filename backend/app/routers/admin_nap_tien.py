
from fastapi import APIRouter, Depends, HTTPException

from app.schemas.so_du import DuyetNapTienRequest, TuChoiNapTienRequest
from app.services import so_du as dich_vu
from app.services.so_du import (
    GiaoDichDaXuLyError,
    GiaTriKhongHopLeError,
    KhongTimThayGiaoDichError,
)
from app.utils.auth import get_current_admin_user


router = APIRouter(
    prefix="/api/admin/nap-tien",
    tags=["Admin - Nap Tien"]
)


@router.get("")
async def danh_sach_nap_tien(
    trang_thai: str | None = None,
    current_user: dict = Depends(get_current_admin_user),
):
    """Danh sách giao dịch nạp tiền cho admin đối chiếu sao kê.

    trang_thai: Cho_Xu_Ly | Thanh_cong | That_bai | Da_Huy (bỏ trống = tất cả).
    """
    try:
        return await dich_vu.lay_yeu_cau_nap_tien(trang_thai=trang_thai)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.put("/{id_giao_dich}/duyet")
async def duyet_nap_tien(
    id_giao_dich: str,
    yeu_cau: DuyetNapTienRequest,
    current_user: dict = Depends(get_current_admin_user),
):
    """Xác nhận ĐÃ NHẬN TIỀN -> cộng tiền vào ví + thông báo người dùng."""
    try:
        return await dich_vu.duyet_yeu_cau_nap_tien(
            id_giao_dich,
            current_user["_id"],
            ghi_chu=yeu_cau.ghi_chu,
        )
    except KhongTimThayGiaoDichError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except (GiaoDichDaXuLyError, GiaTriKhongHopLeError) as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.put("/{id_giao_dich}/tu-choi")
async def tu_choi_nap_tien(
    id_giao_dich: str,
    yeu_cau: TuChoiNapTienRequest,
    current_user: dict = Depends(get_current_admin_user),
):
    """Từ chối yêu cầu nạp tiền (bắt buộc lý do) + thông báo người dùng."""
    try:
        return await dich_vu.tu_choi_yeu_cau_nap_tien(
            id_giao_dich,
            current_user["_id"],
            ly_do=yeu_cau.ly_do,
        )
    except KhongTimThayGiaoDichError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except (GiaoDichDaXuLyError, GiaTriKhongHopLeError) as error:
        raise HTTPException(status_code=400, detail=str(error))
