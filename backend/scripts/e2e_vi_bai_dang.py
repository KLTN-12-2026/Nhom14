# Entry point cũ của bài kiểm thử ví dự án (vi_bai_dang).
#
# Trước đây script này backfill toàn bộ collection vi_bai_dang rồi giải
# ngân vĩnh viễn một bài demo thật — vừa phá dữ liệu vừa không dọn dẹp.
# Nay toàn bộ kiểm thử (giới hạn góp, phí nền tảng 3%, phí hoàn trả 5%,
# khóa góp sau giải ngân, chatbot ảnh) đã gộp vào:
#
#     scripts/e2e_quy_tac_tai_chinh.py
#
# Script đó tự tạo user/bài/ví riêng và DỌN SẠCH trong finally kể cả khi
# crash. Giữ file này làm entry point tương thích cho lệnh cũ.
#
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/e2e_vi_bai_dang.py

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from e2e_quy_tac_tai_chinh import main  # noqa: E402


if __name__ == "__main__":
    asyncio.run(main())
