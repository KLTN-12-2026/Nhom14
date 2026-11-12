from pydantic import BaseModel, Field


class KhoanGopCreate(BaseModel):
    # Loại hình (gop_von / quyen_gop / dau_tu) BE tự suy ra từ
    # loai_bai_dang của bài đăng — FE không cần gửi, tránh lệch dữ liệu.
    so_tien: float = Field(gt=0, description="Số tiền góp (VND, số nguyên)")
    an_danh: bool = False
    loi_nhac: str = Field(default="", max_length=500)
    so_huu_phan_tram: float | None = Field(
        default=None, ge=0, le=100,
        description="Tỷ lệ phần quỹ/cổ phần dự kiến (0-100%)",
    )
