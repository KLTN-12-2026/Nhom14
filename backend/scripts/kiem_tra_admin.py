
# Kiểm tra quyền quản trị của tài khoản admin1 trong DB.
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/kiem_tra_admin.py

import asyncio
import os

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

client = AsyncMongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME", "crowdfunding_db")]


async def main():
    admin = await db["nguoi_dung"].find_one({"ten_tk": "admin1"})
    if not admin:
        print("KHONG tim thay admin1")
        return

    print("admin1 _id =", admin["_id"])

    chuc_vu = await db["chuc_vu"].find_one(
        {"id_nguoi_dung": admin["_id"]}
    )
    print("chuc_vu:", chuc_vu)

    cv_doc = await db["nguoi_dung_cv"].find_one(
        {"id_nguoi_dung": admin["_id"]}
    )
    print("nguoi_dung_cv:", cv_doc)

    # Danh sách chức vụ hệ thống (để so tên chuẩn)
    print("\nCac chuc vu trong he thong:")
    async for cv in db["chuc_vu"].find().limit(10):
        print(" -", cv)

    await client.close()


asyncio.run(main())
