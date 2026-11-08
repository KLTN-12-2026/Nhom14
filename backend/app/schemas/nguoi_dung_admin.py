
from typing import Literal

from pydantic import BaseModel, Field

# Vai trò thống nhất với ten_cv trong bảng chuc_vu
VaiTro = Literal["Nguoi_Dung", "Quan_Tri_Vien"]


class DoiVaiTroRequest(BaseModel):
    vai_tro: VaiTro


class KhoaTaiKhoanRequest(BaseModel):
    ly_do: str = Field(default="", max_length=500)
