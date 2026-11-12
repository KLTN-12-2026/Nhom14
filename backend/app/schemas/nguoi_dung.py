
from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class NguoiDungRegister(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    ho_ten: str = Field(min_length=2, max_length=100)
    nam_sinh: date
    gioi_tinh: str
    dien_thoai: str = Field(min_length=9, max_length=15)
    email: str = Field(min_length=5, max_length=150)
    ten_tk: str = Field(min_length=3, max_length=50)
    mat_khau: str = Field(min_length=8, max_length=128)


class NguoiDungLogin(BaseModel):
    ten_tk: str
    mat_khau: str


class NguoiDungResponse(BaseModel):
    ho_ten: str
    nam_sinh: date
    gioi_tinh: str
    dien_thoai: str
    email: str
    ten_tk: str


class NguoiDungUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    ho_ten: str | None = Field(default=None, min_length=2, max_length=100)
    nam_sinh: date | None = None
    gioi_tinh: str | None = None
    dien_thoai: str | None = Field(default=None, min_length=9, max_length=15)
    email: str | None = Field(default=None, min_length=5, max_length=150)


class DoiMatKhauRequest(BaseModel):
    mat_khau_cu: str
    mat_khau_moi: str = Field(min_length=8, max_length=128)


# ---- Quên mật khẩu (3 bước, collection quen_mat_khau) ----

class QuenMatKhauRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=5, max_length=150)


class XacMinhMaRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=5, max_length=150)
    ma_xac_thuc: str = Field(min_length=4, max_length=10)


class DatLaiMatKhauRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=5, max_length=150)
    ma_xac_thuc: str = Field(min_length=4, max_length=10)
    mat_khau_moi: str = Field(min_length=8, max_length=128)
