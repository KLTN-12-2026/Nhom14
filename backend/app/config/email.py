import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

# Cấu hình gửi email qua Gmail SMTP (bắt buộc dùng App Password 16 ký tự,
# mật khẩu Gmail thường sẽ bị Google từ chối):
#   SMTP_HOST=smtp.gmail.com
#   SMTP_PORT=587
#   SMTP_USER=email_gui@gmail.com
#   SMTP_PASSWORD=abcd efgh ijkl mnop  (App Password - Google bỏ khoảng trắng)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
TEN_UNG_DUNG = "Rising Idea"


def da_cau_hinh() -> bool:
    """Đã cấu hình email gửi chưa (chưa -> dùng chế độ demo hiện mã)."""
    return bool(SMTP_USER and SMTP_PASSWORD)


def gui_email(to_email: str, tieu_de: str, noi_dung_html: str) -> None:
    """Gửi 1 email HTML qua SMTP — hàm đồng bộ, gọi trong thread riêng."""
    thu = MIMEMultipart("alternative")
    thu["Subject"] = tieu_de
    thu["From"] = f"{TEN_UNG_DUNG} <{SMTP_USER}>"
    thu["To"] = to_email
    thu.attach(MIMEText(noi_dung_html, "html", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(SMTP_USER, [to_email], thu.as_string())


def noi_dung_ma_xac_thuc(ma: str, ho_ten: str, thoi_han_phut: int) -> str:
    """Email HTML chứa mã xác thực đặt lại mật khẩu."""
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;
                padding:24px;border:1px solid #eee;border-radius:12px">
      <h2 style="color:#f59e0b">{TEN_UNG_DUNG} 🔐</h2>
      <p>Xin chào <b>{ho_ten}</b>,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã xác thực của bạn là:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;
                text-align:center;color:#111;background:#fef3c7;
                padding:16px;border-radius:8px">{ma}</p>
      <p>Mã có hiệu lực <b>{thoi_han_phut} phút</b>. Nếu không phải bạn
         yêu cầu, hãy bỏ qua email này.</p>
      <p style="color:#999;font-size:12px">
        Email tự động từ hệ thống {TEN_UNG_DUNG} — vui lòng không trả lời.
      </p>
    </div>
    """
