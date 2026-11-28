"""Di chuyển ảnh bài đăng cũ từ backend/media/ lên GridFS (MongoDB Atlas).

Chạy trên máy còn file ảnh cũ:
  cd Nhom14/backend
  $env:PYTHONUTF8=1; .venv\Scripts\python.exe scripts/migrate_anh_media_sang_gridfs.py

Idempotent: bỏ qua ảnh đã là ObjectId GridFS hoặc không có file cục bộ.
"""
from __future__ import annotations

import asyncio
import mimetypes
import sys
from pathlib import Path

from bson import ObjectId
from gridfs import AsyncGridFSBucket

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config.database import client, database  # noqa: E402

MEDIA_DIR = ROOT / "media"
BUCKET = AsyncGridFSBucket(database, bucket_name="hinh_anh_bai_dang")


async def chay() -> None:
    tong = 0
    da_chuyen = 0
    bo_qua = 0
    loi = 0

    cursor = database["hinh_anh_bai_dang"].find(
        {"duong_dan_hinh_anh": {"$regex": r"^/api/media/"}}
    )

    async for doc in cursor:
        tong += 1
        duong_dan = (doc.get("duong_dan_hinh_anh") or "").strip()
        ten_file = duong_dan.rsplit("/", 1)[-1]

        if ObjectId.is_valid(ten_file):
            bo_qua += 1
            continue

        tep = MEDIA_DIR / ten_file
        if not tep.is_file():
            print(f"[BO QUA] Khong co file cuc bo: {duong_dan}")
            bo_qua += 1
            continue

        try:
            du_lieu = tep.read_bytes()
            content_type = mimetypes.guess_type(tep.name)[0] or "application/octet-stream"
            id_gridfs = await BUCKET.upload_from_stream(
                tep.name,
                du_lieu,
                metadata={"content_type": content_type, "nguon": "migrate_media"},
            )
            duong_dan_moi = f"/api/media/{str(id_gridfs)}"
            await database["hinh_anh_bai_dang"].update_one(
                {"_id": doc["_id"]},
                {"$set": {"duong_dan_hinh_anh": duong_dan_moi}},
            )
            da_chuyen += 1
            print(f"[OK] {duong_dan} -> {duong_dan_moi}")
        except Exception as exc:
            loi += 1
            print(f"[LOI] {duong_dan}: {exc}")

    print(
        f"\nTong: {tong}, da chuyen: {da_chuyen}, bo qua: {bo_qua}, loi: {loi}"
    )
    await client.close()


if __name__ == "__main__":
    asyncio.run(chay())
