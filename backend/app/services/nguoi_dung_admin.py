
from bson import ObjectId
from datetime import datetime, timezone

from app.config.database import database
from app.utils.auth import TEN_CHUC_VU_ADMIN


class KhongTimThayNguoiDungError(Exception):
    pass


class ThaoTacKhongHopLeError(Exception):
    """Ví dụ: khóa chính mình, thiếu vai trò, thao tác trên chính mình."""
    pass


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


async def _ghi_nhat_ky(
    id_quan_tri_vien: ObjectId,
    hanh_dong: str,
    loai_doi_tuong: str,
    ly_do: str = "",
):
    # Collection nhat_ky_quan_tri theo tài liệu database
    await database["nhat_ky_quan_tri"].insert_one({
        "id_quan_tri_vien": id_quan_tri_vien,
        "hanh_dong": hanh_dong,
        "loai_doi_tuong": loai_doi_tuong,
        "ly_do": ly_do.strip(),
        "ngay_tao": datetime.now(timezone.utc),
    })


async def _vai_tro_cua(id_nguoi_dung: ObjectId) -> str:
    """Đọc vai trò qua nguoi_dung_cv + chuc_vu; không có nhiệm -> Nguoi_Dung."""
    phan_quyen = await database["nguoi_dung_cv"].find_one({
        "id_nguoi_dung": id_nguoi_dung
    })

    if not phan_quyen:
        return "Nguoi_Dung"

    id_chuc_vu = phan_quyen.get("id_chuc_vu")
    if isinstance(id_chuc_vu, str) and ObjectId.is_valid(id_chuc_vu):
        id_chuc_vu = ObjectId(id_chuc_vu)

    chuc_vu = await database["chuc_vu"].find_one({"_id": id_chuc_vu})

    if chuc_vu and chuc_vu.get("ten_cv") in TEN_CHUC_VU_ADMIN:
        return "Quan_Tri_Vien"

    return "Nguoi_Dung"


def _chuan_hoa(nguoi_dung: dict, vai_tro: str) -> dict:
    nam_sinh = nguoi_dung.get("nam_sinh")
    # BSON date -> "YYYY-MM-DD" cho FE hiển thị
    if hasattr(nam_sinh, "date"):
        nam_sinh = nam_sinh.date().isoformat()

    return {
        "id": str(nguoi_dung["_id"]),
        "ten_tk": nguoi_dung["ten_tk"],
        "ho_ten": nguoi_dung.get("ho_ten", ""),
        "email": nguoi_dung.get("email", ""),
        "nam_sinh": nam_sinh,
        "gioi_tinh": nguoi_dung.get("gioi_tinh", ""),
        "dien_thoai": nguoi_dung.get("dien_thoai", ""),
        "vai_tro": vai_tro,
        # Tài khoản cũ chưa có trường trang_thai -> mặc định Hoat_Dong
        "trang_thai": nguoi_dung.get("trang_thai", "Hoat_Dong"),
        "ngay_tao": _iso(nguoi_dung.get("ngay_tao")),
        "ngay_cap_nhat": _iso(nguoi_dung.get("ngay_cap_nhat")),
    }


async def _tim_theo_ten(ten_tk: str) -> dict:
    nguoi_dung = await database["nguoi_dung"].find_one({
        "ten_tk": ten_tk
    })

    if not nguoi_dung:
        raise KhongTimThayNguoiDungError("Không tìm thấy tài khoản.")

    return nguoi_dung


async def lay_danh_sach_nguoi_dung(tim_kiem: str | None = None) -> list:
    """Danh sách người dùng cho trang Quản trị - PB17 (mới nhất trước)."""
    dieu_kien: dict = {}

    if tim_kiem:
        regex = {"$regex": tim_kiem, "$options": "i"}
        dieu_kien = {
            "$or": [
                {"ten_tk": regex},
                {"ho_ten": regex},
                {"email": regex},
            ]
        }

    cursor = database["nguoi_dung"].find(dieu_kien, {
        "mat_khau": 0
    }).sort("ngay_tao", -1)

    ket_qua = []
    async for nguoi_dung in cursor:
        vai_tro = await _vai_tro_cua(nguoi_dung["_id"])
        ket_qua.append(_chuan_hoa(nguoi_dung, vai_tro))

    return ket_qua


async def doi_vai_tro(
    ten_tk: str,
    vai_tro_moi: str,
    id_quan_tri_vien: ObjectId,
) -> dict:
    """Đổi vai trò người dùng: cập nhật/ghi mới nguoi_dung_cv - PB17."""
    nguoi_dung = await _tim_theo_ten(ten_tk)

    if nguoi_dung["_id"] == id_quan_tri_vien:
        raise ThaoTacKhongHopLeError(
            "Không thể thay đổi quyền của chính tài khoản đang đăng nhập."
        )

    ten_cv_muc_tieu = "Quan_Tri_Vien" if vai_tro_moi == "Quan_Tri_Vien" else "Nguoi_Dung"

    chuc_vu = await database["chuc_vu"].find_one({
        "ten_cv": ten_cv_muc_tieu
    })

    if not chuc_vu:
        # Tự tạo nếu dữ liệu seed thiếu (bản demo dùng được mọi lúc)
        result = await database["chuc_vu"].insert_one({
            "ten_cv": ten_cv_muc_tieu,
            "mo_ta_cv": (
                "Quản trị hệ thống"
                if vai_tro_moi == "Quan_Tri_Vien"
                else "Người dùng thông thường"
            ),
        })
        id_chuc_vu_muc_tieu = result.inserted_id
    else:
        id_chuc_vu_muc_tieu = chuc_vu["_id"]

    now = datetime.now(timezone.utc)

    await database["nguoi_dung_cv"].update_one(
        {"id_nguoi_dung": nguoi_dung["_id"]},
        {
            "$set": {
                "id_chuc_vu": id_chuc_vu_muc_tieu,
                "ngay_phan_quyen": now,
            }
        },
        upsert=True,
    )

    await _ghi_nhat_ky(
        id_quan_tri_vien,
        "Cap_Nhat_Vai_Tro",
        f"nguoi_dung:{ten_tk}",
        ten_cv_muc_tieu,
    )

    return _chuan_hoa(nguoi_dung, vai_tro_moi)


async def _doi_trang_thai(
    ten_tk: str,
    trang_thai_moi: str,
    ly_do: str,
    id_quan_tri_vien: ObjectId,
    hanh_dong: str,
) -> dict:
    nguoi_dung = await _tim_theo_ten(ten_tk)

    if nguoi_dung["_id"] == id_quan_tri_vien:
        raise ThaoTacKhongHopLeError(
            "Không thể thao tác trên chính tài khoản đang đăng nhập."
        )

    await database["nguoi_dung"].update_one(
        {"_id": nguoi_dung["_id"]},
        {
            "$set": {
                "trang_thai": trang_thai_moi,
                "ngay_cap_nhat": datetime.now(timezone.utc),
            }
        }
    )

    await _ghi_nhat_ky(
        id_quan_tri_vien,
        hanh_dong,
        f"nguoi_dung:{ten_tk}",
        ly_do,
    )

    return {"ten_tk": ten_tk, "trang_thai": trang_thai_moi}


async def khoa_tai_khoan(
    ten_tk: str,
    ly_do: str,
    id_quan_tri_vien: ObjectId,
) -> dict:
    """Khóa tài khoản (trang_thai Bi_Khoa; đăng nhập bị chặn) - PB17."""
    return await _doi_trang_thai(
        ten_tk,
        "Bi_Khoa",
        ly_do,
        id_quan_tri_vien,
        "Khoa_Tai_Khoan",
    )


async def mo_khoa_tai_khoan(
    ten_tk: str,
    id_quan_tri_vien: ObjectId,
) -> dict:
    """Mở khóa tài khoản (trang_thai về Hoat_Dong)."""
    return await _doi_trang_thai(
        ten_tk,
        "Hoat_Dong",
        "",
        id_quan_tri_vien,
        "Mo_Khoa_Tai_Khoan",
    )


async def doc_nhat_ky() -> list:
    """Nhật ký quản trị (nhat_ky_quan_tri) mới nhất trước."""
    cursor = database["nhat_ky_quan_tri"].find({}).sort("ngay_tao", -1)

    ket_qua = []
    async for dong in cursor:
        ket_qua.append({
            "id": str(dong["_id"]),
            "id_quan_tri_vien": str(dong["id_quan_tri_vien"])
            if dong.get("id_quan_tri_vien")
            else None,
            "hanh_dong": dong["hanh_dong"],
            "loai_doi_tuong": dong.get("loai_doi_tuong", ""),
            "ly_do": dong.get("ly_do", ""),
            "ngay_tao": _iso(dong.get("ngay_tao")),
        })

    return ket_qua
