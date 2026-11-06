
from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

# Ba loại bài đăng theo tài liệu database (collection bai_dang)
LoaiBaiDang = Literal["Gọi Vốn", "Quyên Góp", "Đầu Tư"]


class BaiDangCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    loai_bai_dang: LoaiBaiDang
    tieu_de: str = Field(min_length=5, max_length=150)
    noi_dung: str = Field(min_length=10, max_length=20000)
    muc_tieu: float = Field(gt=0, le=500_000_000_000)
    don_vi_tien_te: str = Field(default="VND", max_length=10)
    thoi_gian_bat_dau: date | None = None
    thoi_gian_ket_thuc: date
    # Danh sách link ảnh (URL hoặc dataURL); lưu ở collection hinh_anh_bai_dang
    hinh_anh: list[str] = Field(
        default=[],
        max_length=10,
        description="Danh sách đường dẫn hình ảnh - tối đa 10 ảnh"
    )


class BaiDangUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    loai_bai_dang: LoaiBaiDang | None = None
    tieu_de: str | None = Field(default=None, min_length=5, max_length=150)
    noi_dung: str | None = Field(default=None, min_length=10, max_length=20000)
    muc_tieu: float | None = Field(default=None, gt=0, le=500_000_000_000)
    don_vi_tien_te: str | None = Field(default=None, max_length=10)
    thoi_gian_bat_dau: date | None = None
    thoi_gian_ket_thuc: date | None = None
    hinh_anh: list[str] | None = Field(default=None, max_length=10)


class DuyetBaiDangRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    hanh_dong: Literal["Duyet", "Tu_Choi"]
    ly_do: str = Field(default="", max_length=1000)
