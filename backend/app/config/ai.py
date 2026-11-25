import os
import json
import urllib.request
import urllib.error

from dotenv import load_dotenv

load_dotenv()

# Cấu hình Google Gemini (gói miễn phí):
#   GEMINI_API_KEY=key_tu_aistudio_google_com
#   GEMINI_MODEL=gemini-2.0-flash
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

# Nhân vật trợ lý: biết rõ hệ thống Rising Idea, trả lời tiếng Việt
HUONG_DAN_HE_THONG = (
    "Bạn là 'Rising Bot', trợ lý AI chính thức của nền tảng Rising Idea — "
    "một website gọi vốn cộng đồng (crowdfunding) cho sinh viên, có 3 loại "
    "hình: Gọi Vốn, Quyên Góp, Đầu Tư. Người dùng có ví số dư để ủng hộ các "
    "dự án; bài đăng phải qua quản trị viên duyệt trước khi hiển thị; người "
    "dùng có thể tố cáo bài vi phạm và quản trị viên sẽ xử lý, có thể ẩn bài. "
    "Nhiệm vụ của bạn: hỗ trợ người dùng tìm hiểu nền tảng, hướng dẫn cách "
    "đăng bài, nạp tiền, ủng hộ dự án, theo dõi tiến độ, và giải đáp thắc "
    "mắc chung. Trả lời TIẾNG VIỆT, ngắn gọn (tối đa ~6 dòng), thân thiện, "
    "có thể dùng emoji nhẹ nhàng. Không bịa đặt số liệu hay dữ liệu cụ thể "
    "của hệ thống khi không chắc chắn — hãy khuyên người dùng kiểm tra trên "
    "giao diện. Không trả lời các chủ đề ngoài phạm vi nền tảng."
)

# Bổ sung khi tin nhắn có ảnh: AI đánh giá ảnh theo đúng bối cảnh dự án
HUONG_DAN_ANH = (
    "Khi người dùng gửi ảnh, hãy đánh giá ảnh đó trong bối cảnh dự án được "
    "cung cấp (nếu có): mô tả ngắn gọn những gì nhìn thấy trong ảnh; mức độ "
    "liên quan với nội dung, mục tiêu và tiến độ dự án; dấu hiệu bất thường "
    "(ảnh lấy từ mạng, ảnh stock, chỉnh sửa quá mức, thông tin bị che, ảnh "
    "nhạy cảm); kết luận mức độ tin cậy cao/trung bình/thấp và khuyến nghị "
    "cho người ủng hộ. Nêu rõ đây là đánh giá tự động từ ảnh, không thay thế "
    "xác minh thực tế; không khẳng định ảnh thật/giả tuyệt đối khi thiếu "
    "căn cứ."
)


def _tach_anh(data_url: str) -> tuple[str, str]:
    """Tách data URL thành (mime_type, base64) để gửi Gemini."""
    if not data_url or not data_url.startswith("data:") or "," not in data_url:
        raise AILoi("Dữ liệu ảnh không hợp lệ.")

    header, du_lieu = data_url.split(",", 1)
    mime = header[5:].split(";", 1)[0].strip().lower()

    if mime not in ("image/jpeg", "image/png", "image/webp"):
        raise AILoi("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.")

    return mime, du_lieu


def da_cau_hinh() -> bool:
    return bool(GEMINI_API_KEY.strip())


def hoi_gemini(lich_su: list, boi_canh: str = "") -> str:
    """Gọi Gemini REST API — hàm đồng bộ, gọi trong thread riêng.

    lich_su: [{vai: 'Nguoi_Dung'|'Chatbot', noi_dung: str,
              hinh_anh: str|None}, ...]
    boi_canh: khối thông tin dự án (chỉ đưa cho AI, không lưu vào DB).
    Trả về chuỗi trả lời của AI.
    """
    he_thong = HUONG_DAN_HE_THONG
    if boi_canh.strip():
        he_thong += "\n\n" + boi_canh.strip()

    if any(tin.get("hinh_anh") for tin in lich_su):
        he_thong += "\n\n" + HUONG_DAN_ANH

    noi_dung_gui = []
    for vi_tri, tin in enumerate(lich_su):
        la_tin_cuoi = vi_tri == len(lich_su) - 1
        cac_phan = []
        van_ban = (tin.get("noi_dung") or "").strip()

        if tin.get("hinh_anh"):
            if la_tin_cuoi:
                mime, du_lieu = _tach_anh(tin["hinh_anh"])
                cac_phan.append({
                    "inline_data": {
                        "mime_type": mime,
                        "data": du_lieu,
                    }
                })
                van_ban = (
                    (van_ban + "\n\n" if van_ban else "")
                    + "Hãy đánh giá hình ảnh này theo tình hình dự án."
                )
            else:
                van_ban = (
                    (van_ban + "\n" if van_ban else "")
                    + "[Hình ảnh đã gửi trước đó]"
                )

        if van_ban:
            cac_phan.append({"text": van_ban})

        if not cac_phan:
            cac_phan.append({"text": "(không có nội dung)"})

        noi_dung_gui.append({
            "role": "user" if tin["vai"] == "Nguoi_Dung" else "model",
            "parts": cac_phan,
        })

    noi_dung_yeu_cau = json.dumps({
        "system_instruction": {
            "parts": [{"text": he_thong}],
        },
        "contents": noi_dung_gui,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        GEMINI_URL,
        data=noi_dung_yeu_cau,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            ket_qua = json.loads(response.read())
    except urllib.error.HTTPError as error:
        chi_tiet = error.read().decode("utf-8", "replace")
        if error.code == 400 and "API key not valid" in chi_tiet:
            raise SaiKhoaAIError("API key Gemini không hợp lệ.")
        if error.code == 429:
            raise AITaiError("AI đang quá tải, thử lại sau ít phút.")
        raise AILoi(f"Gemini trả lỗi HTTP {error.code}: {chi_tiet[:200]}")

    ung_vien = (ket_qua.get("candidates") or [{}])[0]
    noi_dung = "".join(
        phan.get("text", "")
        for phan in (ung_vien.get("content") or {}).get("parts") or []
    ).strip()

    if not noi_dung:
        raise AILoi("Gemini không trả lời được nội dung này.")

    return noi_dung


class AILoi(Exception):
    pass


class SaiKhoaAIError(AILoi):
    pass


class AITaiError(AILoi):
    pass
