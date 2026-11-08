
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.nguoi_dung import (
    NguoiDungRegister,
    NguoiDungLogin,
    NguoiDungResponse,
    NguoiDungUpdate,
    DoiMatKhauRequest
)

from app.services.nguoi_dung import (
    register_user,
    login_user,
    update_user,
    change_password,
    DuplicateUserError,
    InvalidCredentialsError,
    TaiKhoanBiKhoaError
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


def user_response(user: dict):
    return {
        "ho_ten": user["ho_ten"],
        "nam_sinh": user["nam_sinh"].date()
        if hasattr(user["nam_sinh"], "date")
        else user["nam_sinh"],
        "gioi_tinh": user["gioi_tinh"],
        "dien_thoai": user["dien_thoai"],
        "email": user["email"],
        "ten_tk": user["ten_tk"]
    }


@router.post(
    "/register",
    response_model=NguoiDungResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(user_data: NguoiDungRegister):
    try:
        result = await register_user(user_data.model_dump())
        return user_response(result)

    except DuplicateUserError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


@router.post("/login")
async def login(user_data: NguoiDungLogin):
    try:
        return await login_user(
            user_data.ten_tk,
            user_data.mat_khau
        )

    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên tài khoản hoặc mật khẩu không chính xác."
        )

    except TaiKhoanBiKhoaError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Tài khoản của bạn đã bị khóa. "
                "Vui lòng liên hệ quản trị viên để biết thêm chi tiết."
            )
        )


@router.get("/me", response_model=NguoiDungResponse)
async def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    return user_response(current_user)


@router.put("/me", response_model=NguoiDungResponse)
async def update_my_profile(
    user_data: NguoiDungUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        updated_user = await update_user(
            str(current_user["_id"]),
            user_data.model_dump(exclude_unset=True)
        )

        if not updated_user:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy tài khoản."
            )

        return user_response(updated_user)

    except DuplicateUserError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error)
        )


@router.put("/change-password")
async def change_my_password(
    user_data: DoiMatKhauRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        await change_password(
            str(current_user["_id"]),
            user_data.mat_khau_cu,
            user_data.mat_khau_moi
        )

        return {
            "message": "Đổi mật khẩu thành công."
        }

    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail="Mật khẩu hiện tại không chính xác."
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
