
from datetime import datetime, time, timezone

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.config.database import database
from app.config.security import create_access_token
from app.utils.security import hash_password, verify_password


class DuplicateUserError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class TaiKhoanBiKhoaError(Exception):
    """Đăng nhập bị chặn vì tài khoản bị khóa (PB17)."""
    pass


async def register_user(user_data: dict) -> dict:
    collection = database["nguoi_dung"]

    checks = [
        ("email", user_data["email"], "Email đã được sử dụng."),
        ("dien_thoai", user_data["dien_thoai"], "Số điện thoại đã được sử dụng."),
        ("ten_tk", user_data["ten_tk"], "Tên tài khoản đã được sử dụng.")
    ]

    for field, value, message in checks:
        if await collection.find_one({field: value}):
            raise DuplicateUserError(message)

    now = datetime.now(timezone.utc)

    nam_sinh = datetime.combine(
        user_data["nam_sinh"],
        time.min,
        tzinfo=timezone.utc
    )

    new_user = {
        "ho_ten": user_data["ho_ten"],
        "nam_sinh": nam_sinh,
        "gioi_tinh": user_data["gioi_tinh"],
        "dien_thoai": user_data["dien_thoai"],
        "email": user_data["email"],
        "ten_tk": user_data["ten_tk"],
        "mat_khau": hash_password(user_data["mat_khau"]),
        "trang_thai": "Hoat_Dong",
        "ngay_tao": now,
        "ngay_cap_nhat": now
    }

    try:
        await collection.insert_one(new_user)
    except DuplicateKeyError:
        raise DuplicateUserError(
            "Email, số điện thoại hoặc tên tài khoản đã được sử dụng."
        )

    return {
        key: value
        for key, value in new_user.items()
        if key != "mat_khau"
    }


async def login_user(ten_tk: str, mat_khau: str):
    collection = database["nguoi_dung"]

    user = await collection.find_one({"ten_tk": ten_tk})

    if not user:
        raise InvalidCredentialsError()

    if not verify_password(mat_khau, user["mat_khau"]):
        raise InvalidCredentialsError()

    # PB17: tài khoản bị khóa không cho đăng nhập vào hệ thống
    if user.get("trang_thai", "Hoat_Dong") == "Bi_Khoa":
        raise TaiKhoanBiKhoaError()

    token = create_access_token({
        "sub": str(user["_id"])
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "ho_ten": user["ho_ten"],
            "ten_tk": user["ten_tk"],
            "email": user["email"]
        }
    }


async def get_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        return None

    return await database["nguoi_dung"].find_one({
        "_id": ObjectId(user_id)
    })


async def update_user(user_id: str, update_data: dict):
    collection = database["nguoi_dung"]

    user = await get_user_by_id(user_id)

    if not user:
        return None

    update_data = {
        key: value
        for key, value in update_data.items()
        if value is not None
    }

    if not update_data:
        return user

    for field in ["email", "dien_thoai"]:
        if field in update_data:
            existing = await collection.find_one({
                field: update_data[field],
                "_id": {"$ne": user["_id"]}
            })

            if existing:
                raise DuplicateUserError(
                    f"{field} đã được sử dụng."
                )

    if "nam_sinh" in update_data:
        update_data["nam_sinh"] = datetime.combine(
            update_data["nam_sinh"],
            time.min,
            tzinfo=timezone.utc
        )

    update_data["ngay_cap_nhat"] = datetime.now(timezone.utc)

    try:
        await collection.update_one(
            {"_id": user["_id"]},
            {"$set": update_data}
        )
    except DuplicateKeyError:
        raise DuplicateUserError(
            "Email hoặc số điện thoại đã được sử dụng."
        )

    return await get_user_by_id(user_id)


async def change_password(
    user_id: str,
    mat_khau_cu: str,
    mat_khau_moi: str
):
    collection = database["nguoi_dung"]

    user = await get_user_by_id(user_id)

    if not user:
        return False

    if not verify_password(mat_khau_cu, user["mat_khau"]):
        raise InvalidCredentialsError()

    if verify_password(mat_khau_moi, user["mat_khau"]):
        raise ValueError("Mật khẩu mới phải khác mật khẩu cũ.")

    await collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "mat_khau": hash_password(mat_khau_moi),
                "ngay_cap_nhat": datetime.now(timezone.utc)
            }
        }
    )

    return True
