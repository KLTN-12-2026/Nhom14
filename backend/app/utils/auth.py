
import jwt

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError

from app.config.security import SECRET_KEY, ALGORITHM
from app.config.database import database


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    )
):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id or not ObjectId.is_valid(user_id):
            raise unauthorized

    except InvalidTokenError:
        raise unauthorized

    user = await database["nguoi_dung"].find_one({
        "_id": ObjectId(user_id)
    })

    if not user:
        raise unauthorized

    return user


# Các tên chức vụ được coi là quản trị viên trong collection chuc_vu
TEN_CHUC_VU_ADMIN = ("Quan_Tri_Vien", "Quản Trị Viên", "Admin")


async def get_user_tuy_chon(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
):
    """Đọc người dùng từ token NẾU có — không token thì trả None.

    Dùng cho endpoint công khai nhưng cần biết người xem là ai (ví dụ
    chi tiết bài đăng: chủ bài được xem bài chưa duyệt của chính mình).
    Token CÓ mà sai/hết hạn -> vẫn chặn, không lặng lẽ coi như khách.
    """
    if credentials is None:
        return None
    return await get_current_user(credentials)


async def la_admin(user: dict) -> bool:
    # Phân quyền theo tài liệu database: chuc_vu (ten_cv, mo_ta_cv)
    # + nguoi_dung_cv (id_nguoi_dung, id_chuc_vu, ngay_phan_quyen)
    phan_quyen = await database["nguoi_dung_cv"].find_one({
        "id_nguoi_dung": user["_id"]
    })

    if not phan_quyen:
        return False

    id_chuc_vu = phan_quyen.get("id_chuc_vu")

    if isinstance(id_chuc_vu, str) and ObjectId.is_valid(id_chuc_vu):
        id_chuc_vu = ObjectId(id_chuc_vu)

    chuc_vu = await database["chuc_vu"].find_one({
        "_id": id_chuc_vu
    })

    return chuc_vu is not None and chuc_vu.get("ten_cv") in TEN_CHUC_VU_ADMIN


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user)
):
    if not await la_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới được thực hiện thao tác này."
        )

    return current_user
