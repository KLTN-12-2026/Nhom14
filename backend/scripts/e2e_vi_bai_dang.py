
# Script backfill + kiểm thử E2E ví dự án (vi_bai_dang).
# 1) Backfill: đồng bộ so_tien_tam_giu của mỗi ví = tổng khoản góp thật
#    (các khoản góp cũ ghi TRƯỚC khi có escrow chưa được cộng vào ví).
# 2) E2E: giải ngân bài đã đủ vốn, chặn hoàn trả bài chưa hết hạn,
#    chặn góp thêm vào bài đã chốt tiền.
#
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/e2e_vi_bai_dang.py

import asyncio
import os
from datetime import datetime, timezone

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

# Import sau khi load_dotenv để database.py đọc được URI
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import vi_bai_dang as dich_vu_vi  # noqa: E402
from app.services import khoan_gop as dich_vu_gop  # noqa: E402


def _so(gia_tri) -> float:
    try:
        return float(str(gia_tri))
    except (TypeError, ValueError):
        return 0.0


async def backfill_vu():
    print("=== BACKFILL vi_bai_dang ===")
    async for vi in db["vi_bai_dang"].find({}):
        id_bai = vi["id_bai_dang"]
        trang_thai = str(vi.get("trang_thai", "")).replace(" ", "_")

        if trang_thai != "Tam_giu":
            print(f"- bỏ qua {id_bai} ({trang_thai})")
            continue

        if _so(vi.get("so_tien_tam_giu")) > 0:
            print(f"- bỏ qua {id_bai} (đã có tiền, không ghi đè)")
            continue

        tong = 0.0
        for ten_col in ("khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu"):
            chuoi = [
                doc async for doc in await db[ten_col].aggregate([
                    {"$match": {
                        "id_bai_dang": id_bai,
                        "trang_thai": "Thanh_cong",
                    }},
                    {"$group": {"_id": None, "tong": {"$sum": "$so_tien"}}},
                ])
            ]
            if chuoi:
                tong += _so(chuoi[0].get("tong"))

        await db["vi_bai_dang"].update_one(
            {"_id": vi["_id"]},
            {
                "$set": {
                    "so_tien_tam_giu": round(tong, 2),
                    "ngay_cap_nhat": datetime.now(timezone.utc),
                }
            },
        )
        print(f"- {id_bai}: so_tien_tam_giu = {tong:,.0f} đ")


async def tim_admin_id():
    doc = await db["nguoi_dung"].find_one({"ten_tk": "admin1"})
    return doc["_id"] if doc else None


async def main():
    await backfill_vu()

    id_admin = await tim_admin_id()
    print(f"\nadmin id = {id_admin}")

    # ---- 1) Giải ngân bài "Test 123" (đã đủ vốn) ----
    id_bai_du_von = "6af9565f0fd342e9bb69c7bc"
    print("\n=== TEST giai_ngan (bài đủ vốn) ===")
    vi_truoc = await dich_vu_vi.xem_vi(id_bai_du_von)
    print("Trước:", vi_truoc)

    ket_qua = await dich_vu_vi.giai_ngan(id_bai_du_von, id_admin)
    print("Sau :", ket_qua["vi"])
    print("Giao dịch:", ket_qua["giao_dich"]["loai_giao_dich"],
          ket_qua["giao_dich"]["so_tien"])

    # Gọi lần 2 phải bị chặn (idempotent)
    try:
        await dich_vu_vi.giai_ngan(id_bai_du_von, id_admin)
        print("!!! LỖI: giải ngân 2 lần vẫn thành công")
    except Exception as error:
        print(f"Giải ngân lần 2 bị chặn đúng: {error}")

    # ---- 2) Hoàn trả bài chưa hết hạn -> phải bị chặn ----
    print("\n=== TEST hoan_tra (bài CHƯA hết hạn) ===")
    try:
        await dich_vu_vi.hoan_tra("6af1dd5ce456a200bf0c9daa", id_admin)
        print("!!! LỖI: hoàn trả bài chưa hết hạn vẫn thành công")
    except Exception as error:
        print(f"Chặn đúng: {type(error).__name__}: {error}")

    # ---- 3) Góp thêm vào bài đã giải ngân -> phải bị chặn ----
    print("\n=== TEST tao_khoan_gop (bài đã chốt tiền) ===")
    id_nguoi_gop = (await db["nguoi_dung"].find_one(
        {"ten_tk": "van_a_demo"}
    ))["_id"]
    try:
        await dich_vu_gop.tao_khoan_gop(
            id_nguoi_gop,
            id_bai_du_von,
            so_tien=10000,
        )
        print("!!! LỖI: góp vào bài đã giải ngân vẫn thành công")
    except Exception as error:
        print(f"Chặn đúng: {type(error).__name__}: {error}")

    await client.close()
    print("\n=== XONG E2E ===")


asyncio.run(main())
