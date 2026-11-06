
from datetime import date, datetime, time, timezone

from bson import ObjectId
from pymongo.errors import InvalidDocument

from app.config.database import database


# Trạng thái bài đăng dùng chuẩn snake_case không dấu (đúng tài liệu database)
TRANG_THAI_MO_TA = {
    "Cho_Duyet": "Chờ duyệt",
    "Da_Duyet": "Đang diễn ra",
    "Tu_Choi": "Đã từ chối",
    "Da_An": "Đã ẩn",
}

LOAI_BAI_DANG_HOP_LE = ("Gọi Vốn", "Quyên Góp", "Đầu Tư")


class KhongTimThayBaiDangError(Exception):
    pass


class KhongCoQuyenBaiDangError(Exception):
    pass


def _date_to_datetime(ngay: date | None):
    # Chuyển date -> datetime UTC (bai_dang lưu kiểu BSON date)
    if ngay is None:
        return None

    return datetime.combine(ngay, time.min, tzinfo=timezone.utc)


def _chuan_hoa(doc: dict, hinh_anh: list | None = None) -> dict:
    # Đưa tài liệu MongoDB về dạng JSON thân thiện FE:
    # ObjectId -> str, datetime -> ISO, kèm hinh_anh[] theo hinh_anh_bai_dang
    return {
        "id": str(doc["_id"]),
        "loai_bai_dang": doc["loai_bai_dang"],
        "tieu_de": doc["tieu_de"],
        "noi_dung": doc["noi_dung"],
        "trang_thai": doc["trang_thai"],
        "muc_tieu": doc["muc_tieu"],
        "don_vi_tien_te": doc.get("don_vi_tien_te", "VND"),
        "thoi_gian_bat_dau": doc["thoi_gian_bat_dau"].isoformat()
        if doc.get("thoi_gian_bat_dau")
        else None,
        "thoi_gian_ket_thuc": doc["thoi_gian_ket_thuc"].isoformat()
        if doc.get("thoi_gian_ket_thuc")
        else None,
        "id_nguoi_dang": str(doc["id_nguoi_dang"]),
        "id_nguoi_duyet": str(doc["id_nguoi_duyet"]) if doc.get("id_nguoi_duyet") else None,
        "ngay_tao": doc["ngay_tao"].isoformat(),
        "ngay_cap_nhat": doc["ngay_cap_nhat"].isoformat(),
        "hinh_anh": hinh_anh or [],
    }


async def doc_hinh_anh(id_bai_dang: ObjectId) -> list:
    cursor = database["hinh_anh_bai_dang"].find(
        {"id_bai_dang": id_bai_dang}
    ).sort("thu_tu_hien_thi", 1)

    return [
        {
            "id": str(anh["_id"]),
            "duong_dan_hinh_anh": anh["duong_dan_hinh_anh"],
            "thu_tu_hien_thi": anh["thu_tu_hien_thi"],
        }
        async for anh in cursor
    ]


async def _luu_hinh_anh(id_bai_dang: ObjectId, hinh_anh: list[str]):
    # Xóa ảnh cũ rồi ghi lại theo thứ tự mới (dạng giản tiện - đủ dùng)
    await database["hinh_anh_bai_dang"].delete_many({
        "id_bai_dang": id_bai_dang
    })

    if not hinh_anh:
        return

    tai_lieu = [
        {
            "id_bai_dang": id_bai_dang,
            "duong_dan_hinh_anh": duong_dan,
            "thu_tu_hien_thi": ngay_tu + 1,
        }
        for ngay_tu, duong_dan in enumerate(hinh_anh)
    ]

    await database["hinh_anh_bai_dang"].insert_many(tai_lieu)


async def tao_bai_dang(du_lieu: dict, id_nguoi_dang: ObjectId) -> dict:
    collection = database["bai_dang"]
    now = datetime.now(timezone.utc)

    bai_dang = {
        "loai_bai_dang": du_lieu["loai_bai_dang"],
        "tieu_de": du_lieu["tieu_de"],
        "noi_dung": du_lieu["noi_dung"],
        # Bài mới luôn chờ duyệt (PB19: admin kiểm tra trước khi công khai)
        "trang_thai": "Cho_Duyet",
        "muc_tieu": float(du_lieu["muc_tieu"]),
        "don_vi_tien_te": du_lieu.get("don_vi_tien_te", "VND"),
        "thoi_gian_bat_dau": _date_to_datetime(du_lieu.get("thoi_gian_bat_dau")) or now,
        "thoi_gian_ket_thuc": _date_to_datetime(du_lieu["thoi_gian_ket_thuc"]),
        "id_nguoi_dang": id_nguoi_dang,
        "id_nguoi_duyet": None,
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    }

    # Mốc kết thúc phải sau mốc bắt đầu
    if bai_dang["thoi_gian_bat_dau"] >= bai_dang["thoi_gian_ket_thuc"]:
        raise ValueError(
            "Thời gian kết thúc phải sau thời gian bắt đầu."
        )

    try:
        result = await collection.insert_one(bai_dang)
        bai_dang["_id"] = result.inserted_id
    except InvalidDocument as error:
        raise ValueError(f"Dữ liệu bài đăng không hợp lệ: {error}")

    await _luu_hinh_anh(bai_dang["_id"], du_lieu.get("hinh_anh") or [])

    return _chuan_hoa(
        bai_dang,
        await doc_hinh_anh(bai_dang["_id"])
    )


async def doc_bai_dang(id_bai_dang: str) -> dict | None:
    if not ObjectId.is_valid(id_bai_dang):
        return None

    return await database["bai_dang"].find_one({
        "_id": ObjectId(id_bai_dang)
    })


async def lay_bai_dang_theo_id(id_bai_dang: str) -> dict:
    bai_dang = await doc_bai_dang(id_bai_dang)

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    return _chuan_hoa(
        bai_dang,
        await doc_hinh_anh(bai_dang["_id"])
    )


async def lay_bai_dang_cong_khai(
    loai: str | None = None,
    tim_kiem: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list:
    # Chỉ bài đã duyệt mới hiển thị công khai (PB10)
    dieu_kien: dict = {"trang_thai": "Da_Duyet"}

    if loai:
        dieu_kien["loai_bai_dang"] = loai

    if tim_kiem:
        dieu_kien["tieu_de"] = {"$regex": tim_kiem, "$options": "i"}

    cursor = database["bai_dang"].find(dieu_kien).sort(
        "ngay_tao", -1
    ).skip(max(0, skip)).limit(max(1, min(100, limit)))

    ket_qua = []
    async for bai_dang in cursor:
        ket_qua.append(
            _chuan_hoa(bai_dang, await doc_hinh_anh(bai_dang["_id"]))
        )

    return ket_qua


async def lay_bai_dang_cua_toi(id_nguoi_dang: ObjectId) -> list:
    # Tất cả trạng thái - phục vụ trang "Bài đăng của tôi" (PB09)
    cursor = database["bai_dang"].find({
        "id_nguoi_dang": id_nguoi_dang
    }).sort("ngay_tao", -1)

    ket_qua = []
    async for bai_dang in cursor:
        ket_qua.append(
            _chuan_hoa(bai_dang, await doc_hinh_anh(bai_dang["_id"]))
        )

    return ket_qua


async def cap_nhat_bai_dang(id_bai_dang: str, du_lieu: dict,
                            id_nguoi_dang: ObjectId) -> dict:
    bai_dang = await doc_bai_dang(id_bai_dang)

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    if str(bai_dang["id_nguoi_dang"]) != str(id_nguoi_dang):
        raise KhongCoQuyenBaiDangError(
            "Chỉ chủ sở hữu mới được cập nhật bài đăng."
        )

    du_lieu_moi = {
        key: value for key, value in du_lieu.items() if value is not None
    }

    if not du_lieu_moi:
        return lay_bai_dang_theo_id(id_bai_dang)

    if "thoi_gian_bat_dau" in du_lieu_moi:
        du_lieu_moi["thoi_gian_bat_dau"] = _date_to_datetime(
            du_lieu_moi["thoi_gian_bat_dau"]
        )

    if "thoi_gian_ket_thuc" in du_lieu_moi:
        du_lieu_moi["thoi_gian_ket_thuc"] = _date_to_datetime(
            du_lieu_moi["thoi_gian_ket_thuc"]
        )

    if "muc_tieu" in du_lieu_moi:
        du_lieu_moi["muc_tieu"] = float(du_lieu_moi["muc_tieu"])

    bat_dau = du_lieu_moi.get(
        "thoi_gian_bat_dau", bai_dang.get("thoi_gian_bat_dau")
    )
    ket_thuc = du_lieu_moi.get(
        "thoi_gian_ket_thuc", bai_dang.get("thoi_gian_ket_thuc")
    )

    if bat_dau and ket_thuc and bat_dau >= ket_thuc:
        raise ValueError("Thời gian kết thúc phải sau thời gian bắt đầu.")

    du_lieu_moi["ngay_cap_nhat"] = datetime.now(timezone.utc)

    # Sửa bài sau khi duyệt -> phải duyệt lại (PB08 ràng buộc)
    if bai_dang["trang_thai"] == "Da_Duyet":
        du_lieu_moi["trang_thai"] = "Cho_Duyet"
        du_lieu_moi["id_nguoi_duyet"] = None

    await database["bai_dang"].update_one(
        {"_id": bai_dang["_id"]},
        {"$set": du_lieu_moi}
    )

    if "hinh_anh" in du_lieu:
        await _luu_hinh_anh(
            bai_dang["_id"],
            du_lieu["hinh_anh"] or []
        )

    return lay_bai_dang_theo_id(id_bai_dang)


async def xoa_bai_dang(id_bai_dang: str, id_nguoi_dang: ObjectId) -> None:
    bai_dang = await doc_bai_dang(id_bai_dang)

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    if str(bai_dang["id_nguoi_dang"]) != str(id_nguoi_dang):
        raise KhongCoQuyenBaiDangError(
            "Chỉ chủ sở hữu mới được xóa bài đăng."
        )

    await database["bai_dang"].delete_one({"_id": bai_dang["_id"]})
    await database["hinh_anh_bai_dang"].delete_many({
        "id_bai_dang": bai_dang["_id"]
    })


# ---------- Quản trị viên (PB18, PB19) ----------


async def lay_bai_dang_quan_tri(trang_thai: str | None = None) -> list:
    dieu_kien: dict = {}

    if trang_thai:
        dieu_kien["trang_thai"] = trang_thai

    cursor = database["bai_dang"].find(dieu_kien).sort("ngay_tao", -1)

    ket_qua = []
    async for bai_dang in cursor:
        ket_qua.append(
            _chuan_hoa(bai_dang, await doc_hinh_anh(bai_dang["_id"]))
        )

    return ket_qua


async def duyet_bai_dang(id_bai_dang: str, hanh_dong: str,
                         ly_do: str, id_nguoi_duyet: ObjectId) -> dict:
    bai_dang = await doc_bai_dang(id_bai_dang)

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    if bai_dang["trang_thai"] != "Cho_Duyet":
        raise ValueError("Chỉ được duyệt bài đăng đang chờ duyệt.")

    if hanh_dong == "Tu_Choi" and not ly_do.strip():
        raise ValueError("Vui lòng nhập lý do từ chối.")

    trang_thai_moi = "Da_Duyet" if hanh_dong == "Duyet" else "Tu_Choi"
    now = datetime.now(timezone.utc)

    await database["bai_dang"].update_one(
        {"_id": bai_dang["_id"]},
        {
            "$set": {
                "trang_thai": trang_thai_moi,
                "id_nguoi_duyet": id_nguoi_duyet,
                "ngay_cap_nhat": now,
            }
        }
    )

    # Ghi lịch sử duyệt (collection lich_su_duyet_bai theo tài liệu database)
    await database["lich_su_duyet_bai"].insert_one({
        "id_bai_dang": bai_dang["_id"],
        "id_nguoi_duyet": id_nguoi_duyet,
        "hanh_dong": hanh_dong,
        "ly_do": ly_do.strip(),
        "ngay_tao": now,
    })

    return lay_bai_dang_theo_id(id_bai_dang)


async def doc_lich_su_duyet(id_bai_dang: str) -> list:
    cursor = database["lich_su_duyet_bai"].find({
        "id_bai_dang": ObjectId(id_bai_dang)
    }).sort("ngay_tao", -1)

    return [
        {
            "id": str(duyet["_id"]),
            "id_bai_dang": str(duyet["id_bai_dang"]),
            "id_nguoi_duyet": str(duyet["id_nguoi_duyet"]),
            "hanh_dong": duyet["hanh_dong"],
            "ly_do": duyet.get("ly_do", ""),
            "ngay_tao": duyet["ngay_tao"].isoformat(),
        }
        async for duyet in cursor
    ]
