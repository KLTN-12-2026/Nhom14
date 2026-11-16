
# SỬA CHỮA ví so_du bị ghi nhầm kiểu (dict {"$numberDecimal": ...} thay vì
# Decimal128) do script test trước đó, và khôi phục số dư đúng theo sổ
# biến động (bien_dong_so_du — nguồn sự thật).
#
# Sổ cho thấy: giao dịch Giai_Ngan 11,000,000 (admin tự bấm trên trình
# duyệt 16:10) là lần biến động hợp lệ CUỐI cùng -> số dư đúng = 11,000,000.
# Các khoản hoàn trả test (+200k) đã được hoàn nguyên hết (giao dịch đã xóa).
#
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/sua_chua_so_du.py

import asyncio
import os
from datetime import datetime, timezone

from bson import Decimal128
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

# Ví cần khôi phục số dư theo sổ (dict bug ghi đè thành 0)
KHU_PHUC = {
    # ví admin1 (người nhận giải ngân Test 123)
    "6af06304649da445424a45bd": 11000000.0,
}


def _tien(gia_tri: float) -> Decimal128:
    return Decimal128(f"{round(gia_tri, 2):.2f}")


async def main():
    print("=== 1) Sửa kiểu dữ liệu mọi ví so_du (dict -> Decimal128) ===")
    da_sua = 0
    async for vi in db["so_du"].find({}):
        gt = vi.get("so_du")
        if isinstance(gt, Decimal128):
            continue

        gia_tri = 0.0
        if isinstance(gt, dict) and "$numberDecimal" in gt:
            try:
                gia_tri = float(gt["$numberDecimal"])
            except (TypeError, ValueError):
                gia_tri = 0.0

        await db["so_du"].update_one(
            {"_id": vi["_id"]},
            {"$set": {
                "so_du": _tien(gia_tri),
                "ngay_cap_nhat": datetime.now(timezone.utc),
            }},
        )
        da_sua += 1
        print(f" - vi {vi['_id']}: {gt!r} -> Decimal128({gia_tri:,.2f})")
    print(f"đã sửa {da_sua} ví")

    print("\n=== 2) Khôi phục số dư đúng theo sổ biến động ===")
    for id_vi, so_du_dung in KHU_PHUC.items():
        from bson import ObjectId
        vi = await db["so_du"].find_one({"_id": ObjectId(id_vi)})
        hien_tai = vi.get("so_du")
        gia_tri_hien_tai = (
            float(hien_tai.to_decimal())
            if hasattr(hien_tai, "to_decimal") else float(hien_tai or 0)
        )
        await db["so_du"].update_one(
            {"_id": ObjectId(id_vi)},
            {"$set": {
                "so_du": _tien(so_du_dung),
                "ngay_cap_nhat": datetime.now(timezone.utc),
            }},
        )
        print(f" - vi {id_vi}: {gia_tri_hien_tai:,.0f} -> "
              f"{so_du_dung:,.0f} (theo sổ bien_dong)")

    print("\n=== 3) Xác minh lại toàn bộ ===")
    async for vi in db["so_du"].find({}):
        gt = vi.get("so_du")
        ok = isinstance(gt, Decimal128)
        print(f" - vi {vi['_id']}: {float(gt.to_decimal()):,.0f} đ "
              f"({'Decimal128 OK' if ok else 'VẪN SAI KIỂU!'})")

    await client.close()
    print("\n=== XONG ===")


asyncio.run(main())
