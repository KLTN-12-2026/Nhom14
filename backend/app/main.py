
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import (
    connect_to_mongodb,
    close_mongodb_connection
)

from app.routers.nguoi_dung import router as nguoi_dung_router
from app.routers.bai_dang import router as bai_dang_router
from app.routers.admin import router as admin_bai_dang_router


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
