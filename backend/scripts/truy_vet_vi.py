
# Truy vết lịch sử ví admin1 (6af06304649da445424a45bd) để biết số dư đúng:
# giao_dich + bien_dong_so_du mới nhất, và liệt kê mọi doc so_du mà giá trị
# so_du KHÔNG phải Decimal128 (bị script ghi nhầm dict $numberDecimal).

import asyncio
import os

from bson.decimal128 import Decimal128
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

ID_VI = "6af06304649da445424a45bd"


def _so(g):
    if isinstance(g, Decimal128):
        return float(g.to_decimal())
    if hasattr(g, "to_decimal"):
        return float(g.to_decimal())
    try:
        return float(g)
    except (TypeError, ValueError):
        return None


async def main():
    print("=== Giao dich moi nhat cua vi admin1 ===")
    async for gd in db["giao_dich"].find(
        {"id_so_du": __import__("bson").ObjectId(ID_VI)}
    ).sort("ngay_tao", -1).limit(10):
        print(f" - {gd['ngay_tao']:%m-%d %H:%M} {gd['loai_giao_dich']:12} "
              f"{_so(gd['so_tien']):>14,.0f} | {gd.get('mo_ta', '')[:50]}")

    print("\n=== Bien dong moi nhat (so_du sau moi lan bien dong) ===")
    async for bd in db["bien_dong_so_du"].find(
        {"id_so_du": __import__("bson").ObjectId(ID_VI)}
    ).sort("ngay_tao", -1).limit(10):
        print(f" - {bd['ngay_tao']:%m-%d %H:%M} {bd['loai_bien_dong']:5} "
              f"{_so(bd['so_tien']):>14,.0f} -> "
              f"sau: {_so(bd['so_du']):,.0f}")

    print("\n=== Doc so_du HONG (so_du khong phai Decimal128) ===")
    async for vi in db["so_du"].find({}):
        gt = vi.get("so_du")
        if not isinstance(gt, Decimal128):
            print(f" - vi {vi['_id']} nguoi {vi.get('id_nguoi_dung')} "
                  f"so_du RAW = {gt!r}")

    print("\n=== Trang thai raw vi admin1 ===")
    vi = await db["so_du"].find_one({"_id": __import__("bson").ObjectId(ID_VI)})
    print(" -", vi)

    await client.close()


asyncio.run(main())
