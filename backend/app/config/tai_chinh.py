"""Quy tắc tài chính dùng chung cho ví, góp vốn và ví dự án.

Mọi mức tiền trong hệ thống là VND. Các hàm làm tròn ở đây dùng
ROUND_HALF_UP (làm tròn lên .5) thay vì round() mặc định của Python
(banker's rounding) để số tiền hiển thị/ghi DB luôn đúng kỳ vọng.
"""

from decimal import Decimal, ROUND_HALF_UP


# Giới hạn mỗi khoản ủng hộ / góp vốn / đầu tư qua ví
MONEY_MIN_GOP = 10_000.0
MONEY_MAX_GOP = 500_000_000.0

# Phí nền tảng: trừ trên tổng tiền huy động khi admin giải ngân.
# Chủ dự án nhận 97%, nền tảng giữ 3%.
TY_LE_PHI_NEN_TANG = 0.03

# Phí xử lý hoàn trả: trừ trên từng khoản góp khi dự án thất bại.
# Người góp nhận lại 95%, nền tảng giữ 5%.
TY_LE_PHI_HOAN_TRA = 0.05


def lam_tron_tien(so_tien: float) -> float:
    """Làm tròn VND đến đồng theo ROUND_HALF_UP."""
    return float(
        Decimal(str(so_tien)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    )


def tinh_phi(so_tien: float, ty_le: float) -> float:
    """Tính phí trên một khoản tiền, làm tròn đến đồng."""
    return lam_tron_tien(float(so_tien) * float(ty_le))
