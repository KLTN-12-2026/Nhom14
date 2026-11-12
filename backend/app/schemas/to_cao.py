from pydantic import BaseModel, Field


class ToCaoCreate(BaseModel):
    id_bai_dang: str = Field(min_length=1, description="ObjectId bài đăng bị tố cáo")
    ly_do: str = Field(min_length=1, max_length=200, description="Lý do tố cáo")
    mo_ta: str | None = Field(default=None, max_length=1000)


class XuLyToCaoRequest(BaseModel):
    trang_thai: str = Field(description="Chua_Xu_Ly | Da_Xu_Ly")
    ghi_chu: str | None = Field(default=None, max_length=1000)
    an_bai: bool = Field(
        default=False,
        description="Đúng: ẩn luôn bài vi phạm khỏi danh sách công khai",
    )
