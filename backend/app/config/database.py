
import os
from urllib.parse import urlparse

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "crowdfunding_db")

if not MONGODB_URI:
    raise RuntimeError("Chưa cấu hình MONGODB_URI trong file .env")

# Chỉ in hostname, không in username/password
parsed_uri = urlparse(MONGODB_URI)
print("MongoDB Host đang kết nối:", parsed_uri.hostname)

client = AsyncMongoClient(MONGODB_URI)
database = client[DATABASE_NAME]


async def connect_to_mongodb():
    await client.admin.command("ping")

    print("MongoDB Atlas connected successfully!")
    print("Database đang sử dụng:", database.name)

    collections = await database.list_collection_names()
    print("Collections hiện có:", collections)

    user_count = await database["nguoi_dung"].count_documents({})
    print("Số tài khoản trong nguoi_dung:", user_count)


async def close_mongodb_connection():
    await client.close()
    print("MongoDB connection closed.")
