
from bson import ObjectId
from bson.decimal128 import Decimal128
from datetime import datetime, timezone

from app.config.database import database


# Tiền lưu theo tài liệu database: Decimal128 (tránh sai hao float).
# FE nhận float (JSON) sau khi chuẩn hóa ở _so().
money_max = 500_000_000_000.0


class SoDuKhongDuError(Exception):
    """Ném khi giao dịch trừ tiền vượt số dư hiện tại."""
    pass


class GiaTriKhongHopLeError(Exception):
    """Số tiền giao dịch không hợp lệ (<= 0 hoặc vượt trần)."""
    pass


def _tien(gia_tri) -> Decimal128:
    # Làm tròn về 2 chữ số thập phân (VND thường nguyên nhưng để an toàn)
    lam_tron = round(float(gia_tri), 2)
    return Decimal128(f"{lam_tron:.2f}")


def _so(gia_tri, mac_dinh: float = 0.0) -> float:
    # Decimal128(datetime...) -> float; số seen từ Mongo kiểu Decimal128
    if isinstance(gia_tri, Decimal128):
        return float(gia_tri.to_decimal())
    if isinstance(gia_tri, (int, float)):
        return float(gia_tri)
    return mac_dinh


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


def _chuan_hoa_vi(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_nguoi_dung": str(doc["id_nguoi_dung"]),
        "so_du": _so(doc.get("so_du")),
        "don_vi_tien_te": doc.get("don_vi_tien_te", "VND"),
        "trang_thai": doc.get("trang_thai", "Hoat_Dong"),
        "ngay_tao": _iso(doc.get("ngay_tao")),
        "ngay_cap_nhat": _iso(doc.get("ngay_cap_nhat")),
    }


def _chuan_hoa_giao_dich(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_nguoi_dung": str(doc["id_nguoi_dung"]),
        "id_so_du": str(doc["id_so_du"]) if doc.get("id_so_du") else None,
        "loai_giao_dich": doc["loai_giao_dich"],
        "so_tien": _so(doc["so_tien"]),
        "don_vi_tien_te": doc.get("don_vi_tien_te", "VND"),
        "trang_thai": doc.get("trang_thai", "Thanh_cong"),
        "mo_ta": doc.get("mo_ta", ""),
        "id_bai_dang": str(doc["id_bai_dang"]) if doc.get("id_bai_dang") else None,
        "ngay_tao": _iso(doc.get("ngay_tao")),
        "thoi_gian_hoan_tat": _iso(doc.get("thoi_gian_hoan_tat")),
    }


def _validate_so_tien(so_tien: float) -> float:
    so_tien = round(float(so_tien), 2)

    if so_tien <= 0:
        raise GiaTriKhongHopLeError("Số tiền phải lớn hơn 0.")

    if so_tien > money_max:
        raise GiaTriKhongHopLeError(
            f"Số tiền không được vượt quá {money_max:.0f} VND."
        )

    return so_tien


async def _lay_so_du(id_nguoi_dung: ObjectId) -> dict | None:
    return await database["so_du"].find_one({
        "id_nguoi_dung": id_nguoi_dung
    })


async def _dam_bao_so_du(id_nguoi_dung: ObjectId) -> dict:
    """Mỗi người dùng có đúng 1 ví: thiếu thì tạo mới số dư 0."""
    vi = await _lay_so_du(id_nguoi_dung)

    if not vi:
        now = datetime.now(timezone.utc)
        vi = {
            "id_nguoi_dung": id_nguoi_dung,
            "so_du": _tien(0),
            "don_vi_tien_te": "VND",
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
            "ngay_cap_nhat": now,
        }
        result = await database["so_du"].insert_one(vi)
        vi["_id"] = result.inserted_id

    return vi


async def lay_vi(id_nguoi_dung: ObjectId) -> dict:
    """Xem ví: số dư + lịch sử giao dịch (mới nhất trước) - US13/US16."""
    vi = await _dam_bao_so_du(id_nguoi_dung)
    ket_qua_vi = _chuan_hoa_vi(vi)

    giao_dich = await lay_lich_su_giao_dich(id_nguoi_dung)

    return {
        "so_du": ket_qua_vi["so_du"],
        "don_vi_tien_te": ket_qua_vi["don_vi_tien_te"],
        "trang_thai": ket_qua_vi["trang_thai"],
        "ngay_tao": ket_qua_vi["ngay_tao"],
        "ngay_cap_nhat": ket_qua_vi["ngay_cap_nhat"],
        "giao_dich": giao_dich,
    }


async def lay_lich_su_giao_dich(id_nguoi_dung: ObjectId) -> list:
    """Danh sách giao dịch mới nhất trước - US16 (Lịch sử số dư)."""
    cursor = database["giao_dich"].find({
        "id_nguoi_dung": id_nguoi_dung
    }).sort("ngay_tao", -1)

    return [
        _chuan_hoa_giao_dich(giao_dich)
        async for giao_dich in cursor
    ]


async def _thuc_hien_giao_dich(
    id_nguoi_dung: ObjectId,
    *,  # các tham số sau phải gọi theo tên (khóa từ khóa, tránh nhầm lẫn chiều tiền)
    loai_giao_dich: str,
    so_tien: float,
    la_tang: bool,
    mo_ta: str = "",
    id_bai_dang: str | None = None,
) -> dict:
    """Core chuyển tiền của ví: ghi giao_dich + cập nhật so_du + ghi bien_dong.

    la_tang=True (nạp tiền) | False (trừ tiền - góp vốn/quyên góp).
    Tập hợp 3 ghi chép cho 3 collection theo tài liệu database.
    """
    so_tien = _validate_so_tien(so_tien)

    if id_bai_dang and ObjectId.is_valid(id_bai_dang):
        id_bai_dang = ObjectId(id_bai_dang)
    else:
        id_bai_dang = None

    vi = await _dam_bao_so_du(id_nguoi_dung)
    so_du_dang_co = _so(vi["so_du"])

    if not la_tang and so_tien > so_du_dang_co:
        raise SoDuKhongDuError(
            "Số dư tài khoản không đủ. Vui lòng nạp thêm số dư."
        )

    so_du_sau = so_du_dang_co + so_tien if la_tang else so_du_dang_co - so_tien
    now = datetime.now(timezone.utc)

    giao_dich = {
        "id_nguoi_dung": id_nguoi_dung,
        "id_so_du": vi["_id"],
        "loai_giao_dich": loai_giao_dich,
        "so_tien": _tien(so_tien),
        "don_vi_tien_te": vi.get("don_vi_tien_te", "VND"),
        "trang_thai": "Thanh_cong",
        "mo_ta": mo_ta,
        "id_bai_dang": id_bai_dang,
        "ngay_tao": now,
        "thoi_gian_hoan_tat": now,
    }

    result = await database["giao_dich"].insert_one(giao_dich)
    id_giao_dich_moi = result.inserted_id

    await database["so_du"].update_one(
        {"_id": vi["_id"]},
        {"$set": {"so_du": _tien(so_du_sau), "ngay_cap_nhat": now}}
    )

    # bien_dong_so_du: lịch sử biến động, mỗi giao dịch 1 dòng
    await database["bien_dong_so_du"].insert_one({
        "id_giao_dich": id_giao_dich_moi,
        "id_so_du": vi["_id"],
        "loai_bien_dong": "Tang" if la_tang else "Giam",
        "so_tien": _tien(so_tien),
        "so_du": _tien(so_du_sau),
        "ngay_tao": now,
    })

    giao_dich["_id"] = id_giao_dich_moi

    return {
        "giao_dich": _chuan_hoa_giao_dich(giao_dich),
        "vi": {"so_du": so_du_sau, "don_vi_tien_te": "VND"},
    }


async def nap_tien(
    id_nguoi_dung: ObjectId,
    so_tien: float,
    mo_ta: str = "Nạp tiền vào ví",
    id_bai_dang: str | None = None,
) -> dict:
    """Nạp tiền vào ví - giao dịch loai_giao_dich = Nap_Tien (US13)."""
    if not mo_ta.strip():
        mo_ta = "Nạp tiền vào ví"

    return await _thuc_hien_giao_dich(
        id_nguoi_dung,
        loai_giao_dich="Nap_Tien",
        so_tien=so_tien,
        la_tang=True,
        mo_ta=mo_ta.strip(),
        id_bai_dang=id_bai_dang,
    )


async def tru_tien(
    id_nguoi_dung: ObjectId,
    so_tien: float,
    loai_giao_dich: str,
    mo_ta: str = "",
    id_bai_dang: str | None = None,
) -> dict:
    """Trừ tiền từ ví (Góp_Von / Quyen_Gop).

    Module khoan_gop_von / khoan_quyen_gop sẽ gọi hàm này để chốt giao
    dịch trước khi tạo khoản góp, giữ nhất quán ví - khoản - bài đăng.
    """
    if not mo_ta.strip():
        mo_ta = f"{loai_giao_dich} qua ví"

    return await _thuc_hien_giao_dich(
        id_nguoi_dung,
        loai_giao_dich=loai_giao_dich,
        so_tien=so_tien,
        la_tang=False,
        mo_ta=mo_ta.strip(),
        id_bai_dang=id_bai_dang,
    )
