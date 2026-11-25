import asyncio
import base64
import binascii
from datetime import datetime, timezone

from bson import ObjectId

from app.config.database import database
from app.config import ai as cau_hinh_ai


# loai_nguoi_gui theo collection tin_nhan_chatbot
NGUOI_DUNG = "Nguoi_Dung"
CHATBOT = "Chatbot"

# Số tin nhắn gần nhất gửi cho AI làm ngữ cảnh (tránh tốn quota)
SO_TIN_BOI_CANH = 12

# Ảnh gửi kèm chat: tối đa 3 MB sau khi giải mã base64.
# FE đã nén về ~100–500 KB trước khi gửi.
ANH_TOI_DA_BYTES = 3 * 1024 * 1024
ANH_MIME_HOP_LE = ("image/jpeg", "image/png", "image/webp")

# Trả lời dự phòng khi AI chưa cấu hình / gặp sự cố
TRANG_AI_CHUA_CAU_HINH = (
    "Mình là Rising Bot 🤖 — AI của mình chưa được cấu hình (thiếu "
    "GEMINI_API_KEY). Admin vui lòng thêm key vào backend/.env rồi khởi "
    "động lại BE nhé!"
)


class KhongTimThayHoiThoaiError(Exception):
    pass


class TinNhanKhongHopLeError(Exception):
    """Tin nhắn/ảnh không hợp lệ (router trả 400)."""
    pass


class AnhKhongHopLeError(TinNhanKhongHopLeError):
    """Ảnh sai định dạng / quá lớn."""
    pass


def _so(gia_tri) -> float:
    if gia_tri is None:
        return 0.0
    if hasattr(gia_tri, "to_decimal"):  # Decimal128
        return float(gia_tri.to_decimal())
    try:
        return float(gia_tri)
    except (TypeError, ValueError):
        return 0.0


def _tien(so_tien) -> str:
    return f"{_so(so_tien):,.0f}".replace(",", ".") + " VND"


def _ngay(gia_tri) -> str:
    return gia_tri.strftime("%d/%m/%Y") if hasattr(gia_tri, "strftime") else "—"


def _kiem_tra_anh(data_url: str | None) -> str | None:
    """Kiểm tra data URL ảnh trước khi lưu DB / gửi Gemini."""
    if not data_url:
        return None

    if not data_url.startswith("data:") or "," not in data_url:
        raise AnhKhongHopLeError("Dữ liệu ảnh không hợp lệ.")

    header, du_lieu = data_url.split(",", 1)
    if ";base64" not in header:
        raise AnhKhongHopLeError("Ảnh phải được gửi dạng base64.")

    mime = header[5:].split(";", 1)[0].strip().lower()
    if mime not in ANH_MIME_HOP_LE:
        raise AnhKhongHopLeError("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.")

    try:
        raw = base64.b64decode(du_lieu, validate=True)
    except (binascii.Error, ValueError):
        raise AnhKhongHopLeError("Dữ liệu ảnh bị lỗi, vui lòng chọn ảnh khác.")

    if not raw:
        raise AnhKhongHopLeError("Ảnh rỗng, vui lòng chọn ảnh khác.")

    if len(raw) > ANH_TOI_DA_BYTES:
        raise AnhKhongHopLeError(
            f"Ảnh tối đa {ANH_TOI_DA_BYTES // (1024 * 1024)} MB."
        )

    return data_url


async def _boi_canh_du_an(id_bai_dang: str | None) -> str:
    """Khối thông tin dự án đang xem — chỉ đưa cho AI, không lưu vào DB.

    Nhờ vậy khi người dùng gửi ảnh, AI đánh giá ảnh theo đúng mục tiêu,
    tiến độ và trạng thái tiền của dự án thay vì nhận xét chung chung.
    """
    if not id_bai_dang or not ObjectId.is_valid(id_bai_dang):
        return ""

    id_object = ObjectId(id_bai_dang)
    bai = await database["bai_dang"].find_one({"_id": id_object})
    if not bai:
        return ""

    muc_tieu = _so(bai.get("muc_tieu"))
    da_gop = _so(bai.get("so_tien_da_gop"))
    tien_do = round((da_gop / muc_tieu) * 100, 1) if muc_tieu > 0 else 0

    dong = [
        "BỐI CẢNH DỰ ÁN ĐANG XEM (dùng để đánh giá ảnh/câu hỏi):",
        f"- Tên dự án: {bai.get('tieu_de', '(không có)')}",
        f"- Loại hình: {bai.get('loai_bai_dang', '(không rõ)')}",
        f"- Trạng thái bài đăng: {bai.get('trang_thai', '(không rõ)')}",
        f"- Mục tiêu: {_tien(muc_tieu)}; đã huy động: {_tien(da_gop)} "
        f"({tien_do}%)",
        f"- Thời gian: {_ngay(bai.get('thoi_gian_bat_dau'))} → "
        f"{_ngay(bai.get('thoi_gian_ket_thuc'))}",
        f"- Mô tả: {str(bai.get('noi_dung') or '(không có)')[:1200]}",
    ]

    vi = await database["vi_bai_dang"].find_one({"id_bai_dang": id_object})
    if vi:
        dong.append(
            "- Ví dự án: tạm giữ "
            f"{_tien(vi.get('so_tien_tam_giu'))}; đã giải ngân "
            f"{_tien(vi.get('so_tien_da_giai_ngan'))}; đã hoàn trả "
            f"{_tien(vi.get('so_tien_da_hoan_tra'))}; trạng thái "
            f"{vi.get('trang_thai', '(không rõ)')}."
        )

    return "\n".join(dong)


def _iso(thoi_gian):
    return thoi_gian.isoformat() if thoi_gian else None


def _chuan_hoa_hoi_thoai(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_nguoi_dung": str(doc["id_nguoi_dung"]),
        "tieu_de": doc.get("tieu_de") or "Hội thoại mới",
        "ngay_tao": _iso(doc.get("ngay_tao")),
        "ngay_cap_nhat": _iso(doc.get("ngay_cap_nhat")),
    }


def _chuan_hoa_tin(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "id_cuoc_hoi_thoai": str(doc["id_cuoc_hoi_thoai"]),
        "loai_nguoi_gui": doc.get("loai_nguoi_gui", NGUOI_DUNG),
        "noi_dung": doc.get("noi_dung", ""),
        # Ảnh người dùng gửi kèm (data URL) — chỉ tin người dùng mới có
        "hinh_anh": doc.get("hinh_anh"),
        "ngay_tao": _iso(doc.get("ngay_tao")),
    }


async def lay_danh_sach_hoi_thoai(id_nguoi_dung: ObjectId) -> list:
    """Các cuộc hội thoại của tôi — mới cập nhật nhất lên đầu."""
    cursor = database["cuoc_hoi_thoai"].find(
        {"id_nguoi_dung": id_nguoi_dung}
    ).sort("ngay_cap_nhat", -1).limit(50)

    return [_chuan_hoa_hoi_thoai(doc) async for doc in cursor]


async def tao_hoi_thoai(
    id_nguoi_dung: ObjectId,
    tieu_de: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "id_nguoi_dung": id_nguoi_dung,
        "tieu_de": (tieu_de or "Hội thoại mới").strip()[:80] or "Hội thoại mới",
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    }
    result = await database["cuoc_hoi_thoai"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _chuan_hoa_hoi_thoai(doc)


async def _lay_hoi_thoai_so_huu(id_hoi_thoai: str, id_nguoi_dung: ObjectId):
    """Chỉ đọc được hội thoại của chính mình."""
    if not id_hoi_thoai or not ObjectId.is_valid(id_hoi_thoai):
        raise KhongTimThayHoiThoaiError("Mã hội thoại không hợp lệ.")

    doc = await database["cuoc_hoi_thoai"].find_one({
        "_id": ObjectId(id_hoi_thoai),
        "id_nguoi_dung": id_nguoi_dung,
    })

    if not doc:
        raise KhongTimThayHoiThoaiError("Không tìm thấy hội thoại.")

    return doc


async def lay_tin_nhan(id_hoi_thoai: str, id_nguoi_dung: ObjectId) -> list:
    """Lịch sử tin nhắn theo thời gian tăng dần (dùng vẽ khung chat)."""
    hoi_thoai = await _lay_hoi_thoai_so_huu(id_hoi_thoai, id_nguoi_dung)

    cursor = database["tin_nhan_chatbot"].find(
        {"id_cuoc_hoi_thoai": hoi_thoai["_id"]}
    ).sort("ngay_tao", 1).limit(200)

    return [_chuan_hoa_tin(doc) async for doc in cursor]


async def _luu_tin(
    id_hoi_thoai: ObjectId,
    loai_nguoi_gui: str,
    noi_dung: str,
    hinh_anh: str | None = None,
):
    now = datetime.now(timezone.utc)
    doc = {
        "id_cuoc_hoi_thoai": id_hoi_thoai,
        "loai_nguoi_gui": loai_nguoi_gui,
        "noi_dung": (noi_dung or "").strip(),
        "ngay_tao": now,
    }
    if hinh_anh:
        doc["hinh_anh"] = hinh_anh

    result = await database["tin_nhan_chatbot"].insert_one(doc)
    doc["_id"] = result.inserted_id

    await database["cuoc_hoi_thoai"].update_one(
        {"_id": id_hoi_thoai},
        {"$set": {"ngay_cap_nhat": now}},
    )

    return _chuan_hoa_tin(doc)


async def gui_tin_nhan(
    id_nguoi_dung: ObjectId,
    id_hoi_thoai: str | None,
    noi_dung: str,
    hinh_anh: str | None = None,
    id_bai_dang: str | None = None,
) -> dict:
    """Lưu tin người dùng -> hỏi AI (kèm ngữ cảnh hội thoại) -> lưu tin AI.

    - hinh_anh: data URL (JPEG/PNG/WEBP, tối đa 3 MB) — AI đánh giá ảnh.
    - id_bai_dang: dự án đang xem — nạp bối cảnh để AI đánh giá ảnh theo
      đúng tình hình dự án (mục tiêu, tiến độ, ví).
    AI gặp sự cố cũng KHÔNG làm mất tin người dùng: trả về tin_chatbot
    mang lời xin lỗi + canh_bao để FE hiển thị trung thực.
    """
    hinh_anh = _kiem_tra_anh(hinh_anh)
    noi_dung = (noi_dung or "").strip()

    if not noi_dung and not hinh_anh:
        raise TinNhanKhongHopLeError(
            "Vui lòng nhập nội dung hoặc chọn ảnh trước khi gửi."
        )

    if id_hoi_thoai:
        hoi_thoai = await _lay_hoi_thoai_so_huu(id_hoi_thoai, id_nguoi_dung)
        ma_hoi_thoai = hoi_thoai["_id"]
        tieu_de = hoi_thoai.get("tieu_de") or "Hội thoại mới"
    else:
        # Tự đặt tiêu đề theo tin nhắn đầu tiên (chỉ gửi ảnh -> tiêu đề ảnh)
        ma_hoi_thoai_doc = await tao_hoi_thoai(
            id_nguoi_dung,
            (noi_dung or "Đánh giá ảnh dự án")[:60],
        )
        ma_hoi_thoai = ObjectId(ma_hoi_thoai_doc["id"])
        tieu_de = ma_hoi_thoai_doc["tieu_de"]

    tin_nguoi = await _luu_tin(
        ma_hoi_thoai, NGUOI_DUNG, noi_dung, hinh_anh=hinh_anh
    )

    # Ngữ cảnh: tin nhắn gần nhất của hội thoại (đủ cặp user/model)
    boi_canh_docs = await database["tin_nhan_chatbot"].find(
        {"id_cuoc_hoi_thoai": ma_hoi_thoai},
        {"loai_nguoi_gui": 1, "noi_dung": 1, "hinh_anh": 1},
    ).sort("ngay_tao", -1).limit(SO_TIN_BOI_CANH).to_list(SO_TIN_BOI_CANH)

    lich_su = [
        {
            "vai": doc["loai_nguoi_gui"],
            "noi_dung": doc.get("noi_dung", ""),
            "hinh_anh": doc.get("hinh_anh"),
        }
        for doc in reversed(boi_canh_docs)
    ]

    # Bối cảnh dự án đang xem — chỉ gửi cho AI, không lưu vào tin nhắn
    boi_canh_du_an = await _boi_canh_du_an(id_bai_dang)

    # Gọi AI trong thread riêng (urllib đồng bộ). AI gặp sự cố cũng KHÔNG
    # làm mất tin người dùng — trả lời xin lỗi + canh_bao cho FE hiển thị.
    canh_bao = None
    try:
        if not cau_hinh_ai.da_cau_hinh():
            raise cau_hinh_ai.SaiKhoaAIError("Chưa cấu hình GEMINI_API_KEY")

        tra_loi = await asyncio.to_thread(
            cau_hinh_ai.hoi_gemini, lich_su, boi_canh_du_an
        )
    except cau_hinh_ai.SaiKhoaAIError as error:
        tra_loi = TRANG_AI_CHUA_CAU_HINH
        canh_bao = str(error)
    except cau_hinh_ai.AITaiError as error:
        tra_loi = (
            "AI đang quá tải hoặc hết hạn mức miễn phí 😥 "
            "— thử lại sau ít phút nhé!"
        )
        canh_bao = str(error)
    except cau_hinh_ai.AILoi as error:
        tra_loi = (
            "Xin lỗi, mình gặp sự cố khi tạo câu trả lời 😥 "
            "— thử gửi lại giúp mình nhé!"
        )
        canh_bao = str(error)
    except Exception as error:  # mạng lỗi / JSON lỗi...
        tra_loi = (
            "Xin lỗi, mình gặp sự cố khi tạo câu trả lời 😥 "
            "— thử gửi lại giúp mình nhé!"
        )
        canh_bao = repr(error)

    tin_bot = await _luu_tin(ma_hoi_thoai, CHATBOT, tra_loi)

    return {
        "id_hoi_thoai": str(ma_hoi_thoai),
        "tieu_de": tieu_de,
        "tin_nguoi_dung": tin_nguoi,
        "tin_chatbot": tin_bot,
        "canh_bao": canh_bao,
    }
