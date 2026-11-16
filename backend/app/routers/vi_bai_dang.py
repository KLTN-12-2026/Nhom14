
from fastapi import APIRouter, Depends, HTTPException

from app.services import vi_bai_dang as dich_vu
from app.services.bai_dang import KhongTimThayBaiDangError
from app.services.vi_bai_dang import ViBaiDangError
from app.utils.auth import get_current_admin_user


# Router công khai: mọi người xem số tiền của dự án (như thẻ "Ví dự án"
# trên trang chi tiết: tổng nhận / đã giải ngân / số dư còn lại).
router_cong_khai = APIRouter(tags=["Vi Bai Dang"])


@router_cong_khai.get("/api/bai-dang/{id_bai_dang}/vi")
async def xem_vi_bai_dang(id_bai_dang: str):
    """Ví dự án của một bài — công khai, dùng cho thẻ tiến độ."""
    try:
        return await dich_vu.xem_vi(id_bai_dang)
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))


# Router quản trị: giải ngân / hoàn trả tiền của dự án
router_admin = APIRouter(
    prefix="/api/admin/bai-dang",
    tags=["Admin - Vi Bai Dang"],
)


@router_admin.post("/{id_bai_dang}/vi/giai-ngan")
async def giai_ngan_vi_bai_dang(
    id_bai_dang: str,
    current_user: dict = Depends(get_current_admin_user),
):
    """Chuyển toàn bộ tiền tạm giữ vào ví người gọi vốn (bài đủ vốn).

    Yêu cầu: bài đã đạt mục tiêu. Bấm 2 lần không chuyển 2 lần — ví
    khóa trạng thái bằng find_one_and_update.
    """
    try:
        return await dich_vu.giai_ngan(
            id_bai_dang,
            current_user["_id"],
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ViBaiDangError as error:
        raise HTTPException(status_code=409, detail=str(error))


@router_admin.post("/{id_bai_dang}/vi/hoan-tra")
async def hoan_tra_vi_bai_dang(
    id_bai_dang: str,
    current_user: dict = Depends(get_current_admin_user),
):
    """Hoàn tiền cho từng người góp (bài hết hạn chưa đủ vốn).

    Mỗi khoản góp hoàn riêng — lỗi 1 người không chặn những người khác;
    phần đã hoàn được bỏ qua khi thử lại.
    """
    try:
        return await dich_vu.hoan_tra(
            id_bai_dang,
            current_user["_id"],
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ViBaiDangError as error:
        raise HTTPException(status_code=409, detail=str(error))
