
# Chuẩn bị dữ liệu test tính năng Ví dự án (chạy 1 lần, có thể chạy lại):
# 1) Tạo/repair tài khoản admin_demo (mật khẩu Admin123456) + phân quyền
#    Quan_Tri_Vien — để đăng nhập admin test nút Giải ngân / Hoàn trả.
# 2) Hoàn nguyên ví dự án bài "Test 123" về trạng thái Tam_giu (undo lần
#    giải ngân E2E trước: trừ lại ví người nhận, xóa giao dịch Giai_Ngan)
#    để admin bấm Giải ngân thật trên trình duyệt.
#
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/chen_sua_vi_test.py

import asyncio
import os
from bson.decimal128 import Decimal128
from datetime import datetime, timezone

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.security import hash_password  # noqa: E402

ID_BAI_TEST = ObjectId("6af9565f0fd342e9bb69c7bc")  # "Test 123"


async def tao_admin_demo():
    print("=== 1) Tài khoản admin_demo ===")
    doc = await db["nguoi_dung"].find_one({"ten_tk": "admin_demo"})

    if not doc:
        now = datetime.now(timezone.utc)
        result = await db["nguoi_dung"].insert_one({
            "ho_ten": "Quản Trị Viên Demo",
            "nam_sinh": datetime(1995, 1, 1, tzinfo=timezone.utc),
            "gioi_tinh": "Khác",
            "dien_thoai": "0900000000",
            "email": "admin.demo@risingidea.vn",
            "ten_tk": "admin_demo",
            "mat_khau": hash_password("Admin123456"),
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
            "ngay_cap_nhat": now,
        })
        doc = {"_id": result.inserted_id, "ten_tk": "admin_demo"}
        print("- da tao nguoi_dung admin_demo:", doc["_id"])
    else:
        print("- admin_demo da ton tai:", doc["_id"])

    id_admin = doc["_id"]

    # Chức vụ Quan_Tri_Vien (thiếu thì tạo)
    cv = await db["chuc_vu"].find_one({"ten_cv": "Quan_Tri_Vien"})
    if not cv:
        r = await db["chuc_vu"].insert_one({
            "ten_cv": "Quan_Tri_Vien",
            "mo_ta_cv": "Quản trị hệ thống",
        })
        cv = {"_id": r.inserted_id}
        print("- da tao chuc_vu Quan_Tri_Vien")
    else:
        print("- chuc_vu Quan_Tri_Vien:", cv["_id"])

    # Phân quyền qua nguoi_dung_cv (thiếu thì tạo)
    phan_quyen = await db["nguoi_dung_cv"].find_one(
        {"id_nguoi_dung": id_admin}
    )
    if not phan_quyen:
        await db["nguoi_dung_cv"].insert_one({
            "id_nguoi_dung": id_admin,
            "id_chuc_vu": cv["_id"],
            "ngay_phan_quyen": datetime.now(timezone.utc),
        })
        print("- da phan quan tri cho admin_demo")
    else:
        print("- admin_demo da co phan quyen")

    # Ví số dư (tránh lỗi khi trang Ví đọc BE)
    vi = await db["so_du"].find_one({"id_nguoi_dung": id_admin})
    if not vi:
        now = datetime.now(timezone.utc)
        await db["so_du"].insert_one({
            "id_nguoi_dung": id_admin,
            "so_du": Decimal128("0.00"),
            "don_vi_tien_te": "VND",
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
            "ngay_cap_nhat": now,
        })
        print("- da tao so_du 0 cho admin_demo")


async def reset_vi_bai_test():
    print("\n=== 2) Hoàn nguyên ví bài 'Test 123' ===")

    # Giao dịch Giai_Ngan cũ từ lần test E2E
    async for gd in db["giao_dich"].find({
        "id_bai_dang": ID_BAI_TEST,
        "loai_giao_dich": "Giai_Ngan",
    }):
        id_vi = gd["id_so_du"]
        so_tien = float(gd["so_tien"].to_decimal())

        # Trừ lại số tiền đã cộng cho người nhận (không âm)
        vi = await db["so_du"].find_one({"_id": id_vi})
        if vi:
            hien_tai = float(vi["so_du"].to_decimal())
            moi = max(hien_tai - so_tien, 0.0)
            await db["so_du"].update_one(
                {"_id": id_vi},
                {"$set": {
                    "so_du": Decimal128(f"{moi:.2f}"),
                    "ngay_cap_nhat": datetime.now(timezone.utc),
                }},
            )
            print(f"- tru lai {so_tien:,.0f} đ khoi ví "
                  f"{id_vi}: {hien_tai:,.0f} -> {moi:,.0f}")

        # Xóa giao dịch + biến động tương ứng
        await db["bien_dong_so_du"].delete_many(
            {"id_giao_dich": gd["_id"]}
        )
        await db["giao_dich"].delete_one({"_id": gd["_id"]})
        print(f"- xoa giao dich Giai_Ngan {gd['_id']}")

    # Ví về Tam_giu, tiền tạm giữ = tổng đã giải ngân trước đó
    vi_bai = await db["vi_bai_dang"].find_one(
        {"id_bai_dang": ID_BAI_TEST}
    )
    if vi_bai:
        da_giai_ngan = float(
            str(vi_bai.get("so_tien_da_giai_ngan") or 0)
        )
        now = datetime.now(timezone.utc)
        await db["vi_bai_dang"].update_one(
            {"_id": vi_bai["_id"]},
            {
                "$set": {
                    "so_tien_tam_giu": round(da_giai_ngan, 2),
                    "so_tien_da_giai_ngan": 0.0,
                    "trang_thai": "Tam_giu",
                    "ngay_cap_nhat": now,
                },
                "$unset": {"ngay_giai_ngan": ""},
            },
        )
        print(f"- vi bai test ve Tam_giu, tam giu = {da_giai_ngan:,.0f} đ")

    # Khoản góp Da_Hoan_Tra (nếu từng test hoàn trả) về Thanh_cong
    for ten_col in ("khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu"):
        kq = await db[ten_col].update_many(
            {"id_bai_dang": ID_BAI_TEST, "trang_thai": "Da_Hoan_Tra"},
            {"$set": {"trang_thai": "Thanh_cong"}},
        )
        if kq.modified_count:
            print(f"- {ten_col}: khoi phuc {kq.modified_count} khoan")


async def main():
    await tao_admin_demo()
    await reset_vi_bai_test()
    await client.close()
    print("\n=== XONG — dang nhap admin: admin_demo / Admin123456 ===")


asyncio.run(main())
