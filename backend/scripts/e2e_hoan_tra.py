
# Kiểm thử E2E HOÀN TRẢ ví dự án + hoàn nguyên dữ liệu để test tay.
# 1) Đưa bài "New Bài Đăng Test" (6af1dd5ce456a200bf0c9daa, 200k/10tr)
#    về quá hạn (thoi_gian_ket_thuc = hôm qua).
# 2) Gọi hoan_tra (service) -> xác minh: hoàn 200k cho người góp, khoản
#    góp sang Da_Hoan_Tra, ví dự án Da_hoan_tra, gọi lần 2 bị chặn.
# 3) Hoàn nguyên: khoản góp về Thanh_cong, xóa giao dịch Hoan_Tra + trừ
#    lại ví người góp, ví dự án về Tam_giu 200k — BẢO TOÀN thời gian kết
#    thúc đã quá hạn để admin bấm nút Hoàn trả thật trên trình duyệt.
#
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/e2e_hoan_tra.py

import asyncio
import os
from bson.decimal128 import Decimal128
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import vi_bai_dang as dich_vu_vi  # noqa: E402

ID_BAI = ObjectId("6af1dd5ce456a200bf0c9daa")
COL_GOP = ("khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu")


def _so(gia_tri) -> float:
    if hasattr(gia_tri, "to_decimal"):
        return float(gia_tri.to_decimal())
    try:
        return float(gia_tri)
    except (TypeError, ValueError):
        return 0.0


async def quahan_bai():
    print("=== 1) Đưa bài về quá hạn ===")
    bai = await db["bai_dang"].find_one({"_id": ID_BAI})
    ket_thuc = bai.get("thoi_gian_ket_thuc")
    print(f"- thoi_gian_ket_thuc hiện tại: {ket_thuc}")

    hom_qua = datetime.now(timezone.utc) - timedelta(days=1)
    await db["bai_dang"].update_one(
        {"_id": ID_BAI},
        {"$set": {"thoi_gian_ket_thuc": hom_qua}},
    )
    print(f"- đã đặt về: {hom_qua.isoformat()}")


async def test_hoan_tra():
    print("\n=== 2) Test hoan_tra (service) ===")
    id_admin = (await db["nguoi_dung"].find_one(
        {"ten_tk": "admin_demo"}
    ))["_id"]

    vi_truoc = await dich_vu_vi.xem_vi(str(ID_BAI))
    print("Trước:", {
        k: vi_truoc[k] for k in
        ("so_du_con_lai", "trang_thai", "tong_tien_nhan")
    })

    # Số dư người góp TRƯỚC khi hoàn
    id_nhom = {}
    for col in COL_GOP:
        async for khoan in db[col].find({
            "id_bai_dang": ID_BAI, "trang_thai": "Thanh_cong",
        }):
            id_nhom[str(khoan["id_nguoi_gop"])] = True
    so_du_truoc = {}
    for chuoi in id_nhom:
        vi = await db["so_du"].find_one(
            {"id_nguoi_dung": ObjectId(chuoi)}
        )
        so_du_truoc[chuoi] = _so(vi.get("so_du")) if vi else 0.0
    print("Số dư người góp trước:", so_du_truoc)

    ket_qua = await dich_vu_vi.hoan_tra(str(ID_BAI), id_admin)
    print("Kết quả hoàn trả:", {
        "so_nguoi_hoan": ket_qua["so_nguoi_hoan"],
        "so_tien_hoan": ket_qua["so_tien_hoan"],
        "trang_thai_vi": ket_qua["vi"]["trang_thai"],
    })

    # Xác minh số dư người góp ĐÃ TĂNG đúng bằng số hoàn
    for chuoi, truoc in so_du_truoc.items():
        vi = await db["so_du"].find_one({"id_nguoi_dung": ObjectId(chuoi)})
        sau = _so(vi.get("so_du")) if vi else 0.0
        tang = round(sau - truoc, 2)
        print(f"- người góp {chuoi[:8]}...: {truoc:,.0f} -> {sau:,.0f} "
              f"(+{tang:,.0f})")
        assert tang > 0, "LỖI: số dư người góp không tăng!"

    # Giao dịch Hoan_Tra đã ghi
    dem = 0
    async for _ in db["giao_dich"].find({
        "id_bai_dang": ID_BAI, "loai_giao_dich": "Hoan_Tra",
    }):
        dem += 1
    print(f"- giao dịch Hoan_Tra đã ghi: {dem}")
    assert dem == ket_qua["so_nguoi_hoan"], "LỖI: thiếu giao dịch Hoan_Tra!"

    # Gọi lần 2 -> bị chặn (ví đã Da_hoan_tra)
    try:
        await dich_vu_vi.hoan_tra(str(ID_BAI), id_admin)
        raise SystemExit("!!! LỖI: hoàn trả lần 2 vẫn thành công")
    except Exception as error:
        print(f"- hoàn trả lần 2 bị chặn đúng: {type(error).__name__}: {error}")


async def hoan_nguyen():
    print("\n=== 3) Hoàn nguyên (giữ bài QUÁ HẠN để admin bấm tay) ===")

    # Trừ lại tiền đã hoàn + xóa giao dịch Hoan_Tra
    async for gd in db["giao_dich"].find({
        "id_bai_dang": ID_BAI, "loai_giao_dich": "Hoan_Tra",
    }):
        so_tien = _so(gd["so_tien"])
        vi = await db["so_du"].find_one({"_id": gd["id_so_du"]})
        if vi:
            hien_tai = _so(vi.get("so_du"))
            moi = max(hien_tai - so_tien, 0.0)
            await db["so_du"].update_one(
                {"_id": vi["_id"]},
                {"$set": {
                    "so_du": Decimal128(f"{moi:.2f}"),
                    "ngay_cap_nhat": datetime.now(timezone.utc),
                }},
            )
            print(f"- trừ lại {so_tien:,.0f} đ từ ví người góp "
                  f"({hien_tai:,.0f} -> {moi:,.0f})")

        await db["bien_dong_so_du"].delete_many({"id_giao_dich": gd["_id"]})
        await db["giao_dich"].delete_one({"_id": gd["_id"]})
        print(f"- xóa giao dịch Hoan_Tra {gd['_id']}")

    # Khoản góp về Thanh_cong
    for col in COL_GOP:
        kq = await db[col].update_many(
            {"id_bai_dang": ID_BAI, "trang_thai": "Da_Hoan_Tra"},
            {"$set": {"trang_thai": "Thanh_cong"}},
        )
        if kq.modified_count:
            print(f"- {col}: phục hồi {kq.modified_count} khoản về Thanh_cong")

    # Ví dự án về Tam_giu, tiền tạm giữ = tổng đã hoàn trước đó
    vi_bai = await db["vi_bai_dang"].find_one({"id_bai_dang": ID_BAI})
    da_hoan = _so(vi_bai.get("so_tien_da_hoan_tra")) if vi_bai else 0.0
    await db["vi_bai_dang"].update_one(
        {"_id": vi_bai["_id"]},
        {
            "$set": {
                "so_tien_tam_giu": round(da_hoan, 2),
                "so_tien_da_hoan_tra": 0.0,
                "trang_thai": "Tam_giu",
                "ngay_cap_nhat": datetime.now(timezone.utc),
            },
            "$unset": {"ngay_hoan_tra": ""},
        },
    )
    print(f"- ví dự án về Tam_giu, tam giu = {da_hoan:,.0f} đ")


async def main():
    await quahan_bai()
    await test_hoan_tra()
    await hoan_nguyen()
    await client.close()
    print("\n=== XONG — bài đã quá hạn + ví 200k chờ admin bấm Hoàn trả ===")


asyncio.run(main())
