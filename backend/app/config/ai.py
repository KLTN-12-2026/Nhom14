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


def da_cau_hinh() -> bool:
    return bool(GEMINI_API_KEY.strip())


def hoi_gemini(lich_su: list) -> str:
    """Gọi Gemini REST API — hàm đồng bộ, gọi trong thread riêng.

    lich_su: [{vai: 'Nguoi_Dung'|'Chatbot', noi_dung: str}, ...]
    Trả về chuỗi trả lời của AI.
    """
    noi_dung_yeu_cau = json.dumps({
        "system_instruction": {
            "parts": [{"text": HUONG_DAN_HE_THONG}],
        },
        "contents": [
            {
                "role": "user" if tin["vai"] == "Nguoi_Dung" else "model",
                "parts": [{"text": tin["noi_dung"]}],
            }
            for tin in lich_su
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 500,
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
