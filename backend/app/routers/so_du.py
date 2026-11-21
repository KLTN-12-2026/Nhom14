
from fastapi import APIRouter, Depends, HTTPException

from app.config.thanh_toan import cau_hinh_nap_tien
from app.schemas.so_du import NapTienRequest
from app.services import so_du as dich_vu
from app.services.so_du import (
    GiaoDichDaXuLyError,
    GiaTriKhongHopLeError,
    KhongTimThayGiaoDichError,
    SoDuKhongDuError,
)
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/api/so-du",
    tags=["So Du"]
)


@router.get("/cau-hinh-nap")
async def lay_cau_hinh_nap(
    current_user: dict = Depends(get_current_user)
):
    """Tài khoản ngân hàng nhận tiền nạp (FE dựng mã QR VietQR)."""
    return cau_hinh_nap_tien()


@router.get("/cua-toi")
async def xem_vi(current_user: dict = Depends(get_current_user)):
    """Xem ví của tôi: số dư + lịch sử giao dịch - US13, US16."""
    return await dich_vu.lay_vi(current_user["_id"])


@router.post("/nap-tien", status_code=201)
async def nap_tien(
    yeu_cau: NapTienRequest,
    current_user: dict = Depends(get_current_user)
):
    """Tạo YÊU CẦU nạp tiền chờ duyệt (chưa cộng ví).

    Người dùng chuyển khoản vào tài khoản admin với nội dung là mã giao
    dịch; admin đối chiếu sao kê rồi duyệt mới cộng tiền.
    """
    try:
        return await dich_vu.tao_yeu_cau_nap_tien(
            current_user["_id"],
            yeu_cau.so_tien,
            mo_ta=yeu_cau.mo_ta,
        )
    except GiaTriKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/nap-tien/{id_giao_dich}")
async def huy_yeu_cau_nap_tien(
    id_giao_dich: str,
    current_user: dict = Depends(get_current_user)
):
    """Hủy yêu cầu nạp khi chưa chuyển khoản (chỉ trạng thái Chờ xử lý)."""
    try:
        return await dich_vu.huy_yeu_cau_nap_tien(
            id_giao_dich,
            current_user["_id"],
        )
    except KhongTimThayGiaoDichError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except GiaoDichDaXuLyError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/giao-dich")
async def lich_su_giao_dich(
    current_user: dict = Depends(get_current_user)
):
    """Lịch sử giao dịch của tôi, mới nhất trước - US16."""
    return await dich_vu.lay_lich_su_giao_dich(current_user["_id"])
