from datetime import datetime, timedelta, timezone
import asyncio
import random
import re

from app.config.database import database
from app.config import email as email_config
from app.utils.security import hash_password, verify_password


# Collection quen_mat_khau theo tài liệu database (06_ProjectDatabase):
#   _id, id_nguoi_dung (ref nguoi_dung._id), ma_xac_thuc,
#   thoi_han (TTL Index), thoi_diem_su_dung (nullable), ngay_tao
THOI_HAN_PHUT = 10


class KhongTimThayEmailError(Exception):
    pass


class MaXacThucError(Exception):
    """Mã xác thực sai, đã dùng rồi hoặc đã hết hạn."""
    pass


def _sinh_ma() -> str:
    return f"{random.randint(0, 999_999):06d}"


async def _tim_nguoi_dung_theo_email(email: str) -> dict:
    email = (email or "").strip()
    if not email:
        raise KhongTimThayEmailError("Vui lòng nhập email.")

    nguoi_dung = await database["nguoi_dung"].find_one({"email": email})

    if not nguoi_dung:
        # Email lưu trong DB có thể khác hoa/thường -> khớp không phân biệt
        nguoi_dung = await database["nguoi_dung"].find_one({
            "email": {
                "$regex": f"^{re.escape(email)}$",
                "$options": "i",
            }
        })

    if not nguoi_dung:
        raise KhongTimThayEmailError(
            "Không tìm thấy tài khoản nào với email này."
        )

    return nguoi_dung


def _gio_quoc_te(thoi_gian):
    """Mongo trả datetime naive (mất tz) — quy ước nó là UTC để so sánh."""
    if thoi_gian is None:
        return None
    if thoi_gian.tzinfo is None:
        return thoi_gian.replace(tzinfo=timezone.utc)
    return thoi_gian


async def _tim_yeu_cau_hop_le(nguoi_dung: dict, ma_xac_thuc: str) -> dict:
    """Yêu cầu mới nhất của người dùng: chưa dùng, chưa hết hạn, mã khớp."""
    yeu_cau = await database["quen_mat_khau"].find_one(
        {
            "id_nguoi_dung": nguoi_dung["_id"],
            "ma_xac_thuc": (ma_xac_thuc or "").strip(),
            "thoi_diem_su_dung": None,
        },
        sort=[("ngay_tao", -1)],
    )

    if not yeu_cau:
        raise MaXacThucError("Mã xác thực không đúng hoặc đã được sử dụng.")

    thoi_han = _gio_quoc_te(yeu_cau.get("thoi_han"))

    if not thoi_han or thoi_han < datetime.now(timezone.utc):
        raise MaXacThucError("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.")

    return yeu_cau


async def gui_ma_xac_thuc(email: str) -> dict:
    """Bước 1: tạo mã 6 số cho email, hiệu lực 10 phút.

    Đã cấu hình SMTP -> gửi mã qua email, KHÔNG trả mã trong response.
    Chưa cấu hình / Gmail gửi lỗi -> rơi về chế độ demo: mã trả về trong
    response để FE hiển thị trực tiếp (vẫn ghi DB như luồng thật).
    """
    nguoi_dung = await _tim_nguoi_dung_theo_email(email)

    now = datetime.now(timezone.utc)
    ma = _sinh_ma()

    # Chỉ mã mới nhất có hiệu lực
    await database["quen_mat_khau"].update_many(
        {
            "id_nguoi_dung": nguoi_dung["_id"],
            "thoi_diem_su_dung": None,
        },
        {"$set": {"thoi_diem_su_dung": now}},
    )

    await database["quen_mat_khau"].insert_one({
        "id_nguoi_dung": nguoi_dung["_id"],
        "ma_xac_thuc": ma,
        "thoi_han": now + timedelta(minutes=THOI_HAN_PHUT),
        "thoi_diem_su_dung": None,
        "ngay_tao": now,
    })

    # Gửi qua Gmail SMTP (thread riêng — smtplib đồng bộ, không block event loop)
    if email_config.da_cau_hinh():
        try:
            await asyncio.to_thread(
                email_config.gui_email,
                nguoi_dung["email"],
                f"{email_config.TEN_UNG_DUNG} — Mã xác thực đặt lại mật khẩu",
                email_config.noi_dung_ma_xac_thuc(
                    ma,
                    nguoi_dung.get("ho_ten", "bạn"),
                    THOI_HAN_PHUT,
                ),
            )
            return {
                "email": nguoi_dung["email"],
                "da_gui_email": True,
                "thoi_han_phut": THOI_HAN_PHUT,
                "ghi_chu": "Mã xác thực đã được gửi tới email của bạn.",
            }
        except Exception as error:
            # Gmail từ chối (sai App Password / hết hạn...) -> demo + báo rõ
            print(f"[quen_mat_khau] Gửi email lỗi: {error!r}")

    return {
        "email": nguoi_dung["email"],
        "da_gui_email": False,
        "ma_xac_thuc": ma,
        "thoi_han_phut": THOI_HAN_PHUT,
        "ghi_chu": (
            "Chưa cấu hình gửi email — mã hiển thị trực tiếp (chế độ demo)."
        ),
    }


async def xac_minh_ma(email: str, ma_xac_thuc: str) -> dict:
    """Bước 2: kiểm tra mã trước khi cho nhập mật khẩu mới."""
    nguoi_dung = await _tim_nguoi_dung_theo_email(email)
    await _tim_yeu_cau_hop_le(nguoi_dung, ma_xac_thuc)

    return {"hop_le": True, "email": nguoi_dung["email"]}


async def dat_lai_mat_khau(email: str, ma_xac_thuc: str, mat_khau_moi: str) -> dict:
    """Bước 3: tiêu dùng mã (thoi_diem_su_dung) + đổi mật khẩu trong 1 nhịp."""
    nguoi_dung = await _tim_nguoi_dung_theo_email(email)
    yeu_cau = await _tim_yeu_cau_hop_le(nguoi_dung, ma_xac_thuc)

    if verify_password(mat_khau_moi, nguoi_dung["mat_khau"]):
        raise ValueError("Mật khẩu mới phải khác mật khẩu cũ.")

    now = datetime.now(timezone.utc)

    await database["nguoi_dung"].update_one(
        {"_id": nguoi_dung["_id"]},
        {
            "$set": {
                "mat_khau": hash_password(mat_khau_moi),
                "ngay_cap_nhat": now,
            }
        },
    )

    # Tiêu dùng mã: 1 mã chỉ đặt lại được 1 lần
    await database["quen_mat_khau"].update_one(
        {"_id": yeu_cau["_id"]},
        {"$set": {"thoi_diem_su_dung": now}},
    )

    return {"thanh_cong": True, "email": nguoi_dung["email"]}
