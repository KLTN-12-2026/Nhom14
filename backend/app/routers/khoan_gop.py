from fastapi import APIRouter, Depends, HTTPException

from app.schemas.khoan_gop import KhoanGopCreate
from app.services import khoan_gop as dich_vu
from app.services.bai_dang import KhongTimThayBaiDangError
from app.services.so_du import GiaTriKhongHopLeError, SoDuKhongDuError
from app.services.khoan_gop import BaiDangChuaDuyetError
from app.utils.auth import get_current_user


router = APIRouter(tags=["Khoan Gop"])


@router.post("/api/bai-dang/{id_bai_dang}/gop", status_code=201)
async def tao_khoan_gop(
    id_bai_dang: str,
    yeu_cau: KhoanGopCreate,
    current_user: dict = Depends(get_current_user),
):
    """Ghi nhận góp vốn/quyên góp cho bài đăng đã duyệt - US14.

    BE tự suy loại hình từ loai_bai_dang: Gọi Vốn -> khoan_gop_von,
    Quyên Góp -> khoan_quyen_gop, Đầu Tư -> khoan_dau_tu. Tiền trừ qua
    ví (tru_tien) trước khi ghi khoản — nếu ghi khoản lỗi hoàn lại ví.
    """
    try:
        return await dich_vu.tao_khoan_gop(
            current_user["_id"],
            id_bai_dang,
            so_tien=yeu_cau.so_tien,
            an_danh=yeu_cau.an_danh,
            loi_nhac=yeu_cau.loi_nhac,
            so_huu_phan_tram=yeu_cau.so_huu_phan_tram,
        )
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except BaiDangChuaDuyetError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except SoDuKhongDuError as error:
        raise HTTPException(status_code=402, detail=str(error))
    except GiaTriKhongHopLeError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/api/bai-dang/{id_bai_dang}/nguoi-gop")
async def danh_sach_nguoi_gop(id_bai_dang: str):
    """Danh sách người góp của bài đăng — công khai, ẩn danh theo khoản."""
    try:
        return await dich_vu.lay_nguoi_gop(id_bai_dang)
    except KhongTimThayBaiDangError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("/api/gop/cua-toi")
async def khoan_gop_cua_toi(
    current_user: dict = Depends(get_current_user),
):
    """Danh sách khoản tôi đã góp/quyên góp/đầu tư, mới nhất trước."""
    return await dich_vu.khoan_gop_cua_toi(current_user["_id"])
