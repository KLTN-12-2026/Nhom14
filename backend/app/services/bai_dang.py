
from datetime import date, datetime, time, timezone
import base64
import binascii
import uuid
from pathlib import Path

from bson import ObjectId
from pymongo.errors import InvalidDocument

from app.config.database import database

# Ảnh người dùng upload dạng base64 (data URL) được GIẢI MÃ ra file trong
# thư mục media và DB chỉ giữ đường dẫn /api/media/... — không lưu chuỗi
# base64 (1 ảnh có thể >1.5MB, làm response + cache FE vượt quota localStorage).
MEDIA_DIR = Path(__file__).resolve().parents[2] / "media"

# data:image/<kiểu>;base64,<dữ liệu>
_TIEN_TO_DATA_URL = "data:image/"


def _tinh_duong_dan_luu(gia_tri: str) -> str:
    """Ảnh data URL -> lưu file, trả về đường dẫn công khai /api/media/....
    Ảnh đã là URL (http... hoặc /api/media/...) giữ nguyên."""
    if not gia_tri.startswith(_TIEN_TO_DATA_URL):
        return gia_tri

    # Tách phần header (xác định đuôi file) và dữ liệu base64
    dau_phan, _, du_lieu = gia_tri.partition(",")
    if not du_lieu:
        return gia_tri

    kieu = dau_phan[len(_TIEN_TO_DATA_URL):].split(";", 1)[0] or "jpeg"
    duoi = kieu if kieu in ("png", "gif", "webp") else "jpg"

    try:
        noi_dung = base64.b64decode(du_lieu)
    except (binascii.Error, ValueError):
        return gia_tri

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    ten_file = f"{uuid.uuid4().hex}.{duoi}"
    (MEDIA_DIR / ten_file).write_bytes(noi_dung)

    return f"/api/media/{ten_file}"


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


def _utc_aware(thoi_gian: datetime):
    # MongoDB trả datetime "naive" (mất timezone) khi đọc từ DB, còn dữ liệu
    # guest mới từ FE luôn có tzinfo UTC -> so sánh >= giữa 2 kiểu văng
    # TypeError (can't compare offset-naive and offset-aware datetimes).
    if thoi_gian is None or thoi_gian.tzinfo is not None:
        return thoi_gian

    return thoi_gian.replace(tzinfo=timezone.utc)


def _tien(gia_tri) -> float:
    """Số tiền -> float an toàn: chấp nhận float/int/str/Decimal128."""
    if gia_tri is None:
        return 0.0
    try:
        return float(str(gia_tri))
    except (TypeError, ValueError):
        return 0.0


def _chuan_hoa(
    doc: dict,
    hinh_anh: list | None = None,
    ten_nguoi_dang: str | None = None,
) -> dict:
    # Đưa tài liệu MongoDB về dạng JSON thân thiện FE:
    # ObjectId -> str, datetime -> ISO, kèm hinh_anh[] theo hinh_anh_bai_dang.
    # Phòng thủ: dùng .get() cho mọi trường — bản ghi cũ thiếu trường
    # (tạo từ phiên trước/seed khác) vẫn trả JSON, không crash endpoint
    # (crash ngoài ExceptionMiddleware sẽ mất CORS header -> FE tưởng BE tắt).
    thoi_gian_bat_dau = doc.get("thoi_gian_bat_dau")
    thoi_gian_ket_thuc = doc.get("thoi_gian_ket_thuc")
    ngay_tao = doc.get("ngay_tao")
    ngay_cap_nhat = doc.get("ngay_cap_nhat") or ngay_tao

    return {
        "id": str(doc["_id"]),
        "loai_bai_dang": doc.get("loai_bai_dang", ""),
        "tieu_de": doc.get("tieu_de", ""),
        # Ghép tên tại thời điểm đọc (bai_dang vẫn chỉ lưu id_nguoi_dang):
        # truy vấn trang chi tiết/danh sách thêm bảng tên người dùng theo id,
        # ai xem (kể cả tài khoản thường) cũng thấy tên người đăng.
        "ten_nguoi_dang": ten_nguoi_dang or None,
        "noi_dung": doc.get("noi_dung", ""),
        "trang_thai": doc.get("trang_thai", "Cho_Duyet"),
        "muc_tieu": _tien(doc.get("muc_tieu")),
        # Tổng đã huy động (khoan_gop_von/khoan_quyen_gop/khoan_dau_tu
        # cộng dồn vào bai_dang sau mỗi lần góp) — FE đọc trực tiếp
        # cho thanh tiến độ, không cần gọi thêm API danh sách người góp.
        "so_tien_da_gop": _tien(doc.get("so_tien_da_gop")),
        "don_vi_tien_te": doc.get("don_vi_tien_te", "VND"),
        "thoi_gian_bat_dau": thoi_gian_bat_dau.isoformat()
        if thoi_gian_bat_dau
        else None,
        "thoi_gian_ket_thuc": thoi_gian_ket_thuc.isoformat()
        if thoi_gian_ket_thuc
        else None,
        "id_nguoi_dang": str(doc["id_nguoi_dang"])
        if doc.get("id_nguoi_dang")
        else None,
        "id_nguoi_duyet": str(doc["id_nguoi_duyet"])
        if doc.get("id_nguoi_duyet")
        else None,
        "ngay_tao": ngay_tao.isoformat() if ngay_tao else None,
        "ngay_cap_nhat": ngay_cap_nhat.isoformat() if ngay_cap_nhat else None,
        "hinh_anh": hinh_anh or [],
    }


async def lay_ban_do_ten_nguoi_dang(danh_sach_id: list) -> dict:
    # Ghép tên hiển thị theo id người dùng tại thời điểm đọc — collection
    # bai_dang vẫn chỉ lưu id_nguoi_dang (không đổi schema DB). Một truy vấn
    # duy nhất với $in cho cả danh sách nên chi phí thấp.
    id_hop_le = [
        ObjectId(ma) for ma in danh_sach_id if ma and ObjectId.is_valid(ma)
    ]
    if not id_hop_le:
        return {}

    cursor = database["nguoi_dung"].find({"_id": {"$in": id_hop_le}})

    return {
        str(nguoi_dung["_id"]): (
            nguoi_dung.get("ho_ten") or nguoi_dung.get("ten_tk") or ""
        )
        async for nguoi_dung in cursor
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
            "duong_dan_hinh_anh": _tinh_duong_dan_luu(duong_dan),
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
        await doc_hinh_anh(bai_dang["_id"]),
        (await lay_ban_do_ten_nguoi_dang([str(id_nguoi_dang)])).get(
            str(id_nguoi_dang)
        ),
    )


async def doc_bai_dang(id_bai_dang: str) -> dict | None:
    if not ObjectId.is_valid(id_bai_dang):
        return None

    return await database["bai_dang"].find_one({
        "_id": ObjectId(id_bai_dang)
    })


async def lay_bai_dang_theo_id(
    id_bai_dang: str,
    id_nguoi_hien_tai: ObjectId | None = None,
    la_quan_tri: bool = False,
) -> dict:
    """Chi tiết 1 bài — PB10.

    Bài CÔNG KHAI (Da_Duyet) ai cũng xem được; bài Chờ duyệt / Từ chối /
    Bị ẩn chỉ CHỦ BÀI hoặc QUẢN TRỊ VIÊN xem được (người lạ coi như 404).
    """
    bai_dang = await doc_bai_dang(id_bai_dang)

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    if (
        bai_dang.get("trang_thai") != "Da_Duyet"
        and not la_quan_tri
        and id_nguoi_hien_tai != bai_dang.get("id_nguoi_dang")
    ):
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    return _chuan_hoa(
        bai_dang,
        await doc_hinh_anh(bai_dang["_id"]),
        (await lay_ban_do_ten_nguoi_dang([str(bai_dang.get("id_nguoi_dang"))])).get(
            str(bai_dang.get("id_nguoi_dang"))
        ),
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

    danh_sach = []
    async for bai_dang in cursor:
        danh_sach.append(bai_dang)

    # Ghép tên người đăng một truy vấn cho cả danh sách
    ban_do_ten = await lay_ban_do_ten_nguoi_dang(
        [str(bai_dang.get("id_nguoi_dang")) for bai_dang in danh_sach]
    )

    return [
        _chuan_hoa(
            bai_dang,
            await doc_hinh_anh(bai_dang["_id"]),
            ban_do_ten.get(str(bai_dang.get("id_nguoi_dang"))),
        )
        for bai_dang in danh_sach
    ]


async def lay_bai_dang_cua_toi(id_nguoi_dang: ObjectId) -> list:
    # Tất cả trạng thái - phục vụ trang "Bài đăng của tôi" (PB09)
    cursor = database["bai_dang"].find({
        "id_nguoi_dang": id_nguoi_dang
    }).sort("ngay_tao", -1)

    danh_sach = []
    async for bai_dang in cursor:
        danh_sach.append(bai_dang)

    ban_do_ten = await lay_ban_do_ten_nguoi_dang(
        [str(bai_dang.get("id_nguoi_dang")) for bai_dang in danh_sach]
    )

    return [
        _chuan_hoa(
            bai_dang,
            await doc_hinh_anh(bai_dang["_id"]),
            ban_do_ten.get(str(bai_dang.get("id_nguoi_dang"))),
        )
        for bai_dang in danh_sach
    ]


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
        return await lay_bai_dang_theo_id(id_bai_dang)

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

    if bat_dau and ket_thuc:
        # Mọi phép so sánh đều dùng chuẩn UTC-aware (Mongo trả naive)
        bat_dau = _utc_aware(bat_dau)
        ket_thuc = _utc_aware(ket_thuc)

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

    return await lay_bai_dang_theo_id(id_bai_dang)


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

    danh_sach = []
    async for bai_dang in cursor:
        danh_sach.append(bai_dang)

    ban_do_ten = await lay_ban_do_ten_nguoi_dang(
        [str(bai_dang.get("id_nguoi_dang")) for bai_dang in danh_sach]
    )

    return [
        _chuan_hoa(
            bai_dang,
            await doc_hinh_anh(bai_dang["_id"]),
            ban_do_ten.get(str(bai_dang.get("id_nguoi_dang"))),
        )
        for bai_dang in danh_sach
    ]


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

    # Ghi nhật ký quản trị (nhat_ky_quan_tri)
    await database["nhat_ky_quan_tri"].insert_one({
        "id_quan_tri_vien": id_nguoi_duyet,
        "hanh_dong": f"Duyet_Bai_{hanh_dong}",
        "loai_doi_tuong": f"bai_dang:{id_bai_dang}",
        "ly_do": ly_do.strip(),
        "ngay_tao": now,
    })

    # Thông báo cho người đăng kết quả duyệt (module thong_bao)
    try:
        from app.services.thong_bao import tao_thong_bao

        if trang_thai_moi == "Da_Duyet":
            await tao_thong_bao(
                bai_dang["id_nguoi_dang"],
                loai_thong_bao="Ket_Qua_Duyet",
                tieu_de=f'Bài "{bai_dang.get("tieu_de", "")}" đã được duyệt ✅',
                noi_dung=(
                    "Chúc mừng! Bài đăng của bạn đã được quản trị viên phê "
                    "duyệt và đang hiển thị công khai trên danh mục dự án."
                ),
                loai_doi_tuong=f"bai_dang:{id_bai_dang}",
            )
        else:
            await tao_thong_bao(
                bai_dang["id_nguoi_dang"],
                loai_thong_bao="Ket_Qua_Duyet",
                tieu_de=f'Bài "{bai_dang.get("tieu_de", "")}" đã bị từ chối 🚫',
                noi_dung=(
                    f"Lý do: {ly_do.strip()}. Bạn có thể chỉnh sửa nội dung "
                    "và gửi duyệt lại bất cứ lúc nào."
                ),
                loai_doi_tuong=f"bai_dang:{id_bai_dang}",
            )
    except Exception:
        # Thông báo là phụ trợ — lỗi không được làm sập duyệt bài
        pass

    return await lay_bai_dang_theo_id(id_bai_dang)


async def an_hien_bai_dang(
    id_bai_dang: str,
    hanh_dong: str,
    ly_do: str,
    id_nguoi_duyet: ObjectId,
) -> dict:
    """Ẩn / Hiện bài đã duyệt - PB18 (trạng thái Da_An / Da_Duyet).

    Bài bị ẩn biến mất khỏi danh sách công khai (lay_bai_dang_cong_khai
    chỉ trả Da_Duyet) và hiển thị rõ trong trang quản lý. Mỗi lần ẩn/hiện
    đều ghi lich_su_duyet_bai để truy vết như duyệt/từ chối.
    """
    bai_dang = await doc_bai_dang(id_bai_dang)

    if not bai_dang:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")

    if hanh_dong == "An":
        if bai_dang["trang_thai"] == "Da_An":
            raise ValueError("Bài đăng đã ở trạng thái ẩn.")
        trang_thai_moi = "Da_An"
    elif hanh_dong == "Hien":
        if bai_dang["trang_thai"] != "Da_An":
            raise ValueError("Chỉ hiện lại bài đang bị ẩn.")
        trang_thai_moi = "Da_Duyet"
    else:
        raise ValueError("Hành động không hợp lệ. Nhận 'An' hoặc 'Hien'.")

    now = datetime.now(timezone.utc)

    await database["bai_dang"].update_one(
        {"_id": bai_dang["_id"]},
        {"$set": {"trang_thai": trang_thai_moi, "ngay_cap_nhat": now}},
    )

    await database["lich_su_duyet_bai"].insert_one({
        "id_bai_dang": bai_dang["_id"],
        "id_nguoi_duyet": id_nguoi_duyet,
        "hanh_dong": "An_Bai" if hanh_dong == "An" else "Hien_Bai",
        "ly_do": ly_do.strip(),
        "ngay_tao": now,
    })

    # Ghi nhật ký quản trị (nhat_ky_quan_tri)
    await database["nhat_ky_quan_tri"].insert_one({
        "id_quan_tri_vien": id_nguoi_duyet,
        "hanh_dong": "An_Bai" if hanh_dong == "An" else "Hien_Bai",
        "loai_doi_tuong": f"bai_dang:{id_bai_dang}",
        "ly_do": ly_do.strip(),
        "ngay_tao": now,
    })

    # Thông báo cho người đăng khi bài bị ẩn (khi hiện lại không cần báo)
    if hanh_dong == "An":
        try:
            from app.services.thong_bao import tao_thong_bao

            await tao_thong_bao(
                bai_dang["id_nguoi_dang"],
                loai_thong_bao="He_Thong",
                tieu_de=f'Bài "{bai_dang.get("tieu_de", "")}" đã bị ẩn 🙈',
                noi_dung=(
                    f"Lý do: {ly_do.strip() or 'vi phạm quy định nội dung'}. "
                    "Liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn."
                ),
                loai_doi_tuong=f"bai_dang:{id_bai_dang}",
            )
        except Exception:
            pass

    return await lay_bai_dang_theo_id(id_bai_dang)


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
