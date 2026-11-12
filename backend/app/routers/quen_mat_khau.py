from fastapi import APIRouter, HTTPException, status

from app.schemas.nguoi_dung import (
    QuenMatKhauRequest,
    XacMinhMaRequest,
    DatLaiMatKhauRequest,
)
from app.services import quen_mat_khau as dich_vu
from app.services.quen_mat_khau import (
    KhongTimThayEmailError,
    MaXacThucError,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Quen Mat Khau"]
)


@router.post("/forgot-password")
async def forgot_password(yeu_cau: QuenMatKhauRequest):
    """Bước 1: tạo mã xác thực 6 số, hiệu lực 10 phút.

    Chưa cấu hình SMTP nên mã trả về trong response (demo) — FE hiển thị
    trực tiếp cho người dùng nhập ở bước 2.
    """
    try:
        return await dich_vu.gui_ma_xac_thuc(yeu_cau.email)
    except KhongTimThayEmailError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.post("/verify-reset-code")
async def verify_reset_code(yeu_cau: XacMinhMaRequest):
    """Bước 2: xác minh mã trước khi cho đặt mật khẩu mới."""
    try:
        return await dich_vu.xac_minh_ma(
            yeu_cau.email,
            yeu_cau.ma_xac_thuc,
        )
    except KhongTimThayEmailError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except MaXacThucError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/reset-password")
async def reset_password(yeu_cau: DatLaiMatKhauRequest):
    """Bước 3: tiêu dùng mã + đặt mật khẩu mới (băm như đăng ký)."""
    try:
        return await dich_vu.dat_lai_mat_khau(
            yeu_cau.email,
            yeu_cau.ma_xac_thuc,
            yeu_cau.mat_khau_moi,
        )
    except KhongTimThayEmailError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except MaXacThucError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
