
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config.database import (
    connect_to_mongodb,
    close_mongodb_connection
)

from app.routers.nguoi_dung import router as nguoi_dung_router


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


app.include_router(nguoi_dung_router)


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
