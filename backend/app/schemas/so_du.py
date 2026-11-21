
from pydantic import BaseModel, ConfigDict, Field


class NapTienRequest(BaseModel):
    """Yêu cầu nạp tiền vào ví (collection so_du + giao_dich Nap_Tien)."""
    model_config = ConfigDict(str_strip_whitespace=True)

    so_tien: float = Field(
        gt=0,
        le=500_000_000_000,
        description="Số tiền nạp (> 0), đơn vị VND"
    )
    don_vi_tien_te: str = Field(default="VND", max_length=10)
    mo_ta: str = Field(
        default="Nạp tiền vào ví",
        max_length=500,
        description="Ghi chú hiển thị trong lịch sử giao dịch"
    )


class DoiGiaoDichRequest(BaseModel):
    """Giao dịch trừ tiền từ ví (Góp vốn / Quyên góp - US13, US14).

    Module khoan_gop_von / khoan_quyen_gop sẽ gọi core tru_tien() nên
    endpoint này chỉ dùng cho nghiệp vụ minh họa; giữ để kiểm chứng.
    """
    model_config = ConfigDict(str_strip_whitespace=True)

    so_tien: float = Field(gt=0, le=500_000_000_000)
    loai_giao_dich: str = Field(max_length=30)
    id_bai_dang: str | None = None
    mo_ta: str = Field(default="", max_length=500)


class DuyetNapTienRequest(BaseModel):
    """Admin xác nhận đã nhận tiền chuyển khoản -> cộng vào ví."""
    model_config = ConfigDict(str_strip_whitespace=True)

    ghi_chu: str = Field(default="", max_length=500)


class TuChoiNapTienRequest(BaseModel):
    """Admin từ chối yêu cầu nạp tiền, bắt buộc ghi lý do."""
    model_config = ConfigDict(str_strip_whitespace=True)

    ly_do: str = Field(
        min_length=1,
        max_length=500,
        description="Lý do từ chối (hiển thị cho người dùng)",
    )
