
from fastapi import APIRouter, Depends, HTTPException

from app.schemas.so_du import NapTienRequest
from app.services import so_du as dich_vu
from app.services.so_du import (
    GiaTriKhongHopLeError,
    SoDuKhongDuError,
)
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/api/so-du",
    tags=["So Du"]
)


@router.get("/cua-toi")
async def xem_vi(current_user: dict = Depends(get_current_user)):
    """Xem ví của tôi: số dư + lịch sử giao dịch - US13, US16."""
    return await dich_vu.lay_vi(current_user["_id"])


@router.post("/nap-tien", status_code=201)
async def nap_tien(
    yeu_cau: NapTienRequest,
    current_user: dict = Depends(get_current_user)
):
    """Nạp tiền vào ví - tạo giao_dich Nap_Tien + bien_dong_so_du Tang."""
    try:
        return await dich_vu.nap_tien(
            current_user["_id"],
            yeu_cau.so_tien,
            mo_ta=yeu_cau.mo_ta,
        )
    except GiaTriKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/giao-dich")
async def lich_su_giao_dich(
    current_user: dict = Depends(get_current_user)
):
    """Lịch sử giao dịch của tôi, mới nhất trước - US16."""
    return await dich_vu.lay_lich_su_giao_dich(current_user["_id"])
