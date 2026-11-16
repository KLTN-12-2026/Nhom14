
import asyncio
import os

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]


async def main():
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)

    print("=== Bai dang ===")
    async for bai in db["bai_dang"].find({}, {
        "tieu_de": 1, "trang_thai": 1, "muc_tieu": 1,
        "so_tien_da_gop": 1, "thoi_gian_ket_thuc": 1, "id_nguoi_dang": 1,
    }):
        het_han = (
            bai.get("thoi_gian_ket_thuc")
            and bai["thoi_gian_ket_thuc"].replace(
                tzinfo=__import__("datetime").timezone.utc
            ) < now
        )
        print(
            f"- {bai['_id']} | {bai.get('trang_thai')} | "
            f"da_gop={float(bai.get('so_tien_da_gop') or 0):,.0f} "
            f"muc={float(bai.get('muc_tieu') or 0):,.0f} | "
            f"het_han={bool(het_han)} | {bai.get('tieu_de', '')[:40]}"
        )

    print("\n=== vi_bai_dang ===")
    async for vi in db["vi_bai_dang"].find({}):
        print(
            f"- {vi['_id']} | bai={vi.get('id_bai_dang')} | "
            f"tam_giu={vi.get('so_tien_tam_giu')} | {vi.get('trang_thai')}"
        )

    print("\n=== Tai khoan (ten_tk, vai_tro qua nguoi_dung_cv) ===")
    async for nd in db["nguoi_dung"].find({}, {"ten_tk": 1}).limit(8):
        print(" -", nd["_id"], nd.get("ten_tk"))

    await client.close()


asyncio.run(main())
