from fastapi import APIRouter, Depends, HTTPException

from app.schemas.to_cao import ToCaoCreate, XuLyToCaoRequest
from app.services import to_cao as dich_vu
from app.services.bai_dang import KhongTimThayBaiDangError, an_hien_bai_dang
from app.services.to_cao import (
    KhongTimThayToCaoError,
    ToCaoTrungError,
    TrangThaiToCaoError,
)
from app.utils.auth import get_current_admin_user, get_current_user


router = APIRouter(tags=["To Cao"])


@router.post("/api/to-cao", status_code=201)
async def tao_to_cao(
    yeu_cau: ToCaoCreate,
    current_user: dict = Depends(get_current_user),
):
    """Tố cáo bài đăng - PB11 (collection to_cao_bai_dang)."""
    try:
        return await dich_vu.tao_to_cao(
            current_user["_id"],
            yeu_cau.model_dump(),
        )
    except ToCaoTrungError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/api/admin/to-cao")
async def danh_sach_to_cao(
    current_user: dict = Depends(get_current_admin_user),
):
    """Danh sách tố cáo cho admin - PB20 (chưa xử lý nổi lên đầu)."""
    return await dich_vu.lay_danh_sach_to_cao()


@router.put("/api/admin/to-cao/{ma_to_cao}/xu-ly")
async def xu_ly_to_cao(
    ma_to_cao: str,
    yeu_cau: XuLyToCaoRequest,
    current_user: dict = Depends(get_current_admin_user),
):
    """Kết luận tố cáo: trạng thái + ghi chú + người xử lý + thời điểm.

    Tuỳ chọn an_bai=True: ẩn luôn bài vi phạm khỏi danh sách công khai
    (trạng thái Da_An) — ghi lịch sử duyệt + thông báo cho người đăng.
    """
    try:
        ket_qua = await dich_vu.xu_ly_to_cao(
            ma_to_cao,
            yeu_cau.trang_thai,
            yeu_cau.ghi_chu,
            id_nguoi_xu_ly=current_user["_id"],
        )

        # Ẩn bài vi phạm (nếu admin chọn) — bài Da_An biến mất khỏi
        # GET /api/bai-dang danh sách công khai
        if yeu_cau.an_bai:
            ket_qua["bai_dang_da_an"] = await an_hien_bai_dang(
                ket_qua["id_bai_dang"],
                "An",
                f"Ẩn theo tố cáo: {ket_qua.get('ly_do', '')}",
                id_nguoi_duyet=current_user["_id"],
            )

        return ket_qua
    except KhongTimThayToCaoError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except TrangThaiToCaoError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
