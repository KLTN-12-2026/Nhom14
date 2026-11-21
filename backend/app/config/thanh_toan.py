import os

from dotenv import load_dotenv

load_dotenv()

# Tài khoản ngân hàng NHẬN TIỀN nạp (hiển thị QR VietQR cho người dùng).
# Điền trong backend/.env:
#   BANK_ID=MB                     # mã ngân hàng VietQR (MB, VCB, ACB, TCB...)
#   BANK_ACCOUNT_NO=0123456789     # số tài khoản nhận tiền
#   BANK_ACCOUNT_NAME=NGUYEN VAN A
BANK_ID = os.getenv("BANK_ID", "").strip()
BANK_ACCOUNT_NO = os.getenv("BANK_ACCOUNT_NO", "").strip()
BANK_ACCOUNT_NAME = os.getenv("BANK_ACCOUNT_NAME", "").strip()

# Mẫu ảnh QR VietQR: BE trả về cho FE, FE thay các {placeholder} theo từng
# yêu cầu nạp (số tiền + nội dung chuyển khoản chính là mã giao dịch).
VIETQR_MAU = os.getenv(
    "VIETQR_MAU",
    "https://img.vietqr.io/image/{ngan_hang}-{so_tai_khoan}-compact2.png"
    "?amount={so_tien}&addInfo={noi_dung}&accountName={chu_tai_khoan}",
)


def da_cau_hinh() -> bool:
    """Đã điền đủ tài khoản nhận tiền chưa."""
    return bool(BANK_ID and BANK_ACCOUNT_NO and BANK_ACCOUNT_NAME)


def cau_hinh_nap_tien() -> dict:
    """Thông tin công khai (không phải bí mật) để FE dựng QR chuyển khoản."""
    return {
        "da_cau_hinh": da_cau_hinh(),
        "ngan_hang": BANK_ID,
        "so_tai_khoan": BANK_ACCOUNT_NO,
        "chu_tai_khoan": BANK_ACCOUNT_NAME,
        "mau_qr": VIETQR_MAU,
    }
