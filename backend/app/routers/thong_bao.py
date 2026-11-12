from fastapi import APIRouter, Depends, HTTPException

from app.services import thong_bao as dich_vu
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/api/thong-bao",
    tags=["Thong Bao"]
)


@router.get("")
async def hop_thu(current_user: dict = Depends(get_current_user)):
    """Hộp thông báo của tôi, mới nhất trước (chuông FE)."""
    return await dich_vu.lay_thong_bao(current_user["_id"])


@router.put("/{ma_thong_bao}/doc")
async def doc_mot(
    ma_thong_bao: str,
    current_user: dict = Depends(get_current_user),
):
    """Đánh dấu 1 thông báo đã đọc (bấm vào dòng trong chuông)."""
    try:
        return await dich_vu.danh_dau_da_doc(
            ma_thong_bao,
            current_user["_id"],
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.put("/doc-tat-ca")
async def doc_tat_ca(current_user: dict = Depends(get_current_user)):
    """Nút Đọc tất cả — trả số thông báo vừa chuyển sang đã đọc."""
    so_da_doc = await dich_vu.danh_dau_tat_ca_da_doc(current_user["_id"])
    return {"da_doc": so_da_doc}
