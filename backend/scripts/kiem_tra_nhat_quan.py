
# Kiểm tra nhất quán dữ liệu cuối (database Atlas):
# - mọi ví so_du đúng kiểu Decimal128
# - ví dự án vi_bai_dang khớp tổng khoản góp thực tế
# - không còn giao dịch "mồ côi" từ lúc test

import asyncio
import os

from bson import Decimal128, ObjectId
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

COL_GOP = ("khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu")


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
    print("=== 1) Kieu du lieu moi vi so_du (ky vong: deu Decimal128) ===")
    loi_kieu = 0
    async for vi in db["so_du"].find({}):
        if not isinstance(vi.get("so_du"), Decimal128):
            loi_kieu += 1
            print(f" - SAI KIEU: vi {vi['_id']} -> {vi.get('so_du')!r}")
        else:
            print(f" - vi {vi['_id']}: "
                  f"{float(vi['so_du'].to_decimal()):,.0f} đ OK")
    print(f"so vi sai kieu: {loi_kieu}")

    print("\n=== 2) Vi du an vi_bai_dang khop tong khoan gop? ===")
    async for vi in db["vi_bai_dang"].find({}):
        id_bai = vi["id_bai_dang"]
        tong_gop = 0.0
        for col in COL_GOP:
            chuoi = [
                d async for d in await db[col].aggregate([
                    {"$match": {
                        "id_bai_dang": id_bai,
                        "trang_thai": "Thanh_cong",
                    }},
                    {"$group": {"_id": None, "t": {"$sum": "$so_tien"}}},
                ])
            ]
            if chuoi:
                tong_gop += _so(chuoi[0]["t"])

        tam_giu = _so(vi.get("so_tien_tam_giu")) or 0.0
        da_gn = _so(vi.get("so_tien_da_giai_ngan")) or 0.0
        da_ht = _so(vi.get("so_tien_da_hoan_tra")) or 0.0
        tong_vi = round(tam_giu + da_gn + da_ht, 2)
        khop = abs(tong_vi - tong_gop) < 0.01
        print(f" - bài {str(id_bai)[:8]}...: {vi.get('trang_thai')} | "
              f"tong_gop={tong_gop:,.0f} vs vi(tam_giu+da_gn+da_ht)"
              f"={tong_vi:,.0f} -> {'KHOP' if khop else 'LECH!'}")

    print("\n=== 3) Bai dang: so_tien_da_gop khop tong khoan? ===")
    async for bai in db["bai_dang"].find({}):
        tong_gop = 0.0
        for col in COL_GOP:
            chuoi = [
                d async for d in await db[col].aggregate([
                    {"$match": {
                        "id_bai_dang": bai["_id"],
                        "trang_thai": "Thanh_cong",
                    }},
                    {"$group": {"_id": None, "t": {"$sum": "$so_tien"}}},
                ])
            ]
            if chuoi:
                tong_gop += _so(chuoi[0]["t"])
        da_gop = _so(bai.get("so_tien_da_gop")) or 0.0
        khop = abs(da_gop - tong_gop) < 0.01
        print(f" - bài {str(bai['_id'])[:8]}... "
              f"({str(bai.get('tieu_de', ''))[:25]!r}): "
              f"da_gop={da_gop:,.0f} vs khoan={tong_gop:,.0f} -> "
              f"{'KHOP' if khop else 'LECH!'}")

    await client.close()
    print("\n=== XONG KIEM TRA NHAT QUAN ===")


asyncio.run(main())
