from fastapi import APIRouter, Depends, HTTPException

from pydantic import BaseModel, Field

from app.services import chatbot as dich_vu
from app.services.chatbot import (
    KhongTimThayHoiThoaiError,
    TinNhanKhongHopLeError,
)
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/api/chatbot",
    tags=["Chatbot AI"]
)


class GuiTinRequest(BaseModel):
    # null = tạo hội thoại mới; hội thoại đã có -> tiếp tục
    id_hoi_thoai: str | None = None
    # Cho phép gửi chỉ ảnh (noi_dung rỗng) — service kiểm tra ít nhất 1 nội dung
    noi_dung: str = Field(default="", max_length=2000)
    # Ảnh đính kèm dạng data URL (JPEG/PNG/WEBP, tối đa 3 MB)
    hinh_anh: str | None = Field(default=None, max_length=6_000_000)
    # Dự án đang xem — AI đánh giá ảnh theo đúng tình hình dự án
    id_bai_dang: str | None = None


@router.get("/hoi-thoai")
async def danh_sach_hoi_thoai(
    current_user: dict = Depends(get_current_user),
):
    """Các cuộc hội thoại của tôi (mới cập nhật nhất lên đầu)."""
    return await dich_vu.lay_danh_sach_hoi_thoai(current_user["_id"])


@router.post("/hoi-thoai")
async def tao_hoi_thoai(
    current_user: dict = Depends(get_current_user),
):
    """Tạo hội thoại trống (khi bấm nút Hội thoại mới)."""
    return await dich_vu.tao_hoi_thoai(current_user["_id"])


@router.get("/hoi-thoai/{id_hoi_thoai}/tin-nhan")
async def tin_nhan(
    id_hoi_thoai: str,
    current_user: dict = Depends(get_current_user),
):
    """Lịch sử tin nhắn của 1 hội thoại (chỉ chủ hội thoại đọc được)."""
    try:
        return await dich_vu.lay_tin_nhan(id_hoi_thoai, current_user["_id"])
    except KhongTimThayHoiThoaiError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.post("/tin-nhan")
async def gui_tin(
    yeu_cau: GuiTinRequest,
    current_user: dict = Depends(get_current_user),
):
    """Gửi tin nhắn + nhận trả lời AI (tự tạo hội thoại khi chưa có).

    Luôn trả 200 — AI gặp sự cố thì tin_chatbot mang lời xin lỗi và
    canh_bao mô tả lỗi, tin người dùng vẫn được lưu.
    """
    try:
        return await dich_vu.gui_tin_nhan(
            current_user["_id"],
            yeu_cau.id_hoi_thoai,
            yeu_cau.noi_dung,
            hinh_anh=yeu_cau.hinh_anh,
            id_bai_dang=yeu_cau.id_bai_dang,
        )
    except TinNhanKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except KhongTimThayHoiThoaiError as error:
        raise HTTPException(status_code=404, detail=str(error))
