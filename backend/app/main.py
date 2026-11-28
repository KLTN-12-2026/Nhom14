
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import (
    connect_to_mongodb,
    close_mongodb_connection
)

from app.routers.nguoi_dung import router as nguoi_dung_router
from app.routers.bai_dang import router as bai_dang_router
from app.routers.admin import router as admin_bai_dang_router
from app.routers.so_du import router as so_du_router
from app.routers.admin_nguoi_dung import router as admin_nguoi_dung_router
from app.routers.admin_nap_tien import router as admin_nap_tien_router
from app.routers.khoan_gop import router as khoan_gop_router
from app.routers.to_cao import router as to_cao_router
from app.routers.thong_bao import router as thong_bao_router
from app.routers.quen_mat_khau import router as quen_mat_khau_router
from app.routers.chatbot import router as chatbot_router
from app.routers.tai_lieu import router as tai_lieu_router
from app.routers.vi_bai_dang import (
    router_admin as vi_bai_dang_admin_router,
    router_cong_khai as vi_bai_dang_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()

    yield

    await close_mongodb_connection()


app = FastAPI(
    title="Crowdfunding API",
    description="Backend API for Crowdfunding Project",
    version="1.0.0",
    lifespan=lifespan
)

# FE chạy cổng riêng (Vite: 5173) nhưng gọi BE cổng 8000 => khác origin,
# trình duyệt bắt buộc trả header "Access-Control-Allow-Origin" hoặc sẽ
# chặn request (preflight OPTIONS) -> FE tưởng BE tắt. Cho phép mọi origin
# với môi trường học; khi triển khai thật nên thay bằng domain cụ thể.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # FE phát triển: http://localhost:5173, ...
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(nguoi_dung_router)
app.include_router(bai_dang_router)
app.include_router(admin_bai_dang_router)
app.include_router(so_du_router)
app.include_router(admin_nguoi_dung_router)
app.include_router(admin_nap_tien_router)
app.include_router(khoan_gop_router)
app.include_router(to_cao_router)
app.include_router(thong_bao_router)
app.include_router(quen_mat_khau_router)
app.include_router(chatbot_router)
app.include_router(tai_lieu_router)
app.include_router(vi_bai_dang_router)
app.include_router(vi_bai_dang_admin_router)

# Ảnh bài đăng: lưu mới trong GridFS (MongoDB Atlas) để máy nào cũng xem được.
# Vẫn hỗ trợ đọc file cũ trong backend/media/ để không gãy ảnh đã upload trước đó.
from app.services.bai_dang import doc_anh_media


@app.get("/api/media/{ten_file}")
async def phuc_vu_anh_media(ten_file: str):
    ket_qua = await doc_anh_media(ten_file)
    if not ket_qua:
        return Response(status_code=404)
    du_lieu, content_type = ket_qua
    return Response(
        content=du_lieu,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@app.get("/")
async def root():
    return {
        "message": "Crowdfunding API is running!"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }
