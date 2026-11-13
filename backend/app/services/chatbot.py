import asyncio
from datetime import datetime, timezone

from bson import ObjectId

from app.config.database import database
from app.config import ai as cau_hinh_ai


# loai_nguoi_gui theo collection tin_nhan_chatbot
NGUOI_DUNG = "Nguoi_Dung"
CHATBOT = "Chatbot"

# Số tin nhắn gần nhất gửi cho AI làm ngữ cảnh (tránh tốn quota)
SO_TIN_BOI_CANH = 12

# Trả lời dự phòng khi AI chưa cấu hình / gặp sự cố
TRANG_AI_CHUA_CAU_HINH = (
    "Mình là Rising Bot 🤖 — AI của mình chưa được cấu hình (thiếu "
    "GEMINI_API_KEY). Admin vui lòng thêm key vào backend/.env rồi khởi "
    "động lại BE nhé!"
)


class KhongTimThayHoiThoaiError(Exception):
    pass


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


async def _luu_tin(id_hoi_thoai: ObjectId, loai_nguoi_gui: str, noi_dung: str):
    now = datetime.now(timezone.utc)
    doc = {
        "id_cuoc_hoi_thoai": id_hoi_thoai,
        "loai_nguoi_gui": loai_nguoi_gui,
        "noi_dung": noi_dung.strip(),
        "ngay_tao": now,
    }
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
) -> dict:
    """Lưu tin người dùng -> hỏi AI (kèm ngữ cảnh hội thoại) -> lưu tin AI.

    AI gặp sự cố cũng KHÔNG làm mất tin người dùng: trả về tin_chatbot
    mang lời xin lỗi + canh_bao để FE hiển thị trung thực.
    """
    if id_hoi_thoai:
        hoi_thoai = await _lay_hoi_thoai_so_huu(id_hoi_thoai, id_nguoi_dung)
        ma_hoi_thoai = hoi_thoai["_id"]
        tieu_de = hoi_thoai.get("tieu_de") or "Hội thoại mới"
    else:
        # Tự đặt tiêu đề theo tin nhắn đầu tiên
        ma_hoi_thoai_doc = await tao_hoi_thoai(
            id_nguoi_dung,
            (noi_dung or "Hội thoại mới").strip()[:60],
        )
        ma_hoi_thoai = ObjectId(ma_hoi_thoai_doc["id"])
        tieu_de = ma_hoi_thoai_doc["tieu_de"]

    tin_nguoi = await _luu_tin(ma_hoi_thoai, NGUOI_DUNG, noi_dung)

    # Ngữ cảnh: tin nhắn gần nhất của hội thoại (đủ cặp user/model)
    boi_canh_docs = await database["tin_nhan_chatbot"].find(
        {"id_cuoc_hoi_thoai": ma_hoi_thoai},
        {"loai_nguoi_gui": 1, "noi_dung": 1},
    ).sort("ngay_tao", -1).limit(SO_TIN_BOI_CANH).to_list(SO_TIN_BOI_CANH)

    lich_su = [
        {
            "vai": doc["loai_nguoi_gui"],
            "noi_dung": doc["noi_dung"],
        }
        for doc in reversed(boi_canh_docs)
    ]

    # Gọi AI trong thread riêng (urllib đồng bộ). AI gặp sự cố cũng KHÔNG
    # làm mất tin người dùng — trả lời xin lỗi + canh_bao cho FE hiển thị.
    canh_bao = None
    try:
        if not cau_hinh_ai.da_cau_hinh():
            raise cau_hinh_ai.SaiKhoaAIError("Chưa cấu hình GEMINI_API_KEY")

        tra_loi = await asyncio.to_thread(cau_hinh_ai.hoi_gemini, lich_su)
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
