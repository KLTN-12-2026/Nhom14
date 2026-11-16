
# Đối soát sau khi hoàn nguyên: ví ai còn giao dịch Hoan_Tra sót,
# số dư các ví của người góp bài 6af1dd5c có khớp kỳ vọng không.

import asyncio
import os

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

ID_BAI = ObjectId("6af1dd5ce456a200bf0c9daa")


def _so(g):
    if hasattr(g, "to_decimal"):
        return float(g.to_decimal())
    try:
        return float(g)
    except (TypeError, ValueError):
        return 0.0


async def main():
    print("=== Giao dich Hoan_Tra con sot (ky vong: 0) ===")
    dem = 0
    async for gd in db["giao_dich"].find(
        {"id_bai_dang": ID_BAI, "loai_giao_dich": "Hoan_Tra"}
    ):
        dem += 1
        print(" -", gd["_id"], "id_nguoi_dung:", gd["id_nguoi_dung"],
              "so_tien:", _so(gd["so_tien"]), "id_so_du:", gd["id_so_du"])
    print("tong:", dem)

    print("\n=== Khoan gop cua bai (ky vong: deu Thanh_cong) ===")
    for col in ("khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu"):
        async for k in db[col].find({"id_bai_dang": ID_BAI}):
            print(f" - {col}: {k['_id']} nguoi_gop={k.get('id_nguoi_gop')} "
                  f"so_tien={_so(k.get('so_tien'))} "
                  f"trang_thai={k.get('trang_thai')}")

    print("\n=== Vi so_du cua tung nguoi gop ===")
    nguoi_gop = set()
    for col in ("khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu"):
        async for k in db[col].find({"id_bai_dang": ID_BAI}):
            nguoi_gop.add(k.get("id_nguoi_gop"))

    for id_nd in nguoi_gop:
        async for vi in db["so_du"].find({"id_nguoi_dung": id_nd}):
            print(f" - nguoi {id_nd}: vi {vi['_id']} "
                  f"so_du={_so(vi.get('so_du'))}")

    print("\n=== Vi du an cua bai ===")
    async for vi in db["vi_bai_dang"].find({"id_bai_dang": ID_BAI}):
        print(f" - tam_giu={_so(vi.get('so_tien_tam_giu'))} "
              f"da_hoan={_so(vi.get('so_tien_da_hoan_tra'))} "
              f"trang_thai={vi.get('trang_thai')}")

    await client.close()


asyncio.run(main())
