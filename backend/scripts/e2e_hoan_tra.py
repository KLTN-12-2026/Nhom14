
# Kiểm thử E2E HOÀN TRẢ ví dự án + hoàn nguyên dữ liệu để test tay.
# 1) Đưa bài "New Bài Đăng Test" (6af1dd5ce456a200bf0c9daa, 200k/10tr)
#    về quá hạn (thoi_gian_ket_thuc = hôm qua).
# 2) Gọi hoan_tra (service) -> xác minh quy tắc tài chính:
#    mỗi khoản góp hoàn 95%, nền tảng giữ 5% phí xử lý hoàn trả;
#    khoản góp sang Da_Hoan_Tra (lưu phi_hoan_tra + so_tien_hoan),
#    ví dự án Da_hoan_tra, gọi lần 2 bị chặn.
# 3) Hoàn nguyên trong finally (kể cả khi assert lỗi): cộng/trừ đúng
#    số NET đã hoàn, xóa giao dịch Hoan_Tra + biến động, đưa khoản góp
#    về Thanh_cong, ví dự án về Tam_giu đủ số GROSS — BẢO TOÀN thời gian
#    kết thúc đã quá hạn để admin bấm nút Hoàn trả thật trên trình duyệt.
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

from app.config.tai_chinh import (  # noqa: E402
    TY_LE_PHI_HOAN_TRA,
    tinh_phi,
)
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
    if not bai:
        raise SystemExit(
            f"!!! Không tìm thấy bài test {ID_BAI} trong DB — "
            "hãy tạo bài demo hoặc sửa ID_BAI trong script."
        )
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
    admin = await db["nguoi_dung"].find_one({"vai_tro": "Quan_Tri_Vien"})
    if not admin:
        raise SystemExit("!!! Không có tài khoản Quan_Tri_Vien để test.")
    id_admin = admin["_id"]
    print(f"- dùng admin: {admin.get('ten_tk')}")

    vi_truoc = await dich_vu_vi.xem_vi(str(ID_BAI))
    print("Trước:", {
        k: vi_truoc[k] for k in
        ("so_du_con_lai", "trang_thai", "tong_tien_nhan")
    })

    # Số dư người góp TRƯỚC khi hoàn + tổng GROSS từng người đã góp
    gop_theo_nguoi = {}
    for col in COL_GOP:
        async for khoan in db[col].find({
            "id_bai_dang": ID_BAI, "trang_thai": "Thanh_cong",
        }):
            ma = str(khoan["id_nguoi_gop"])
            gop_theo_nguoi[ma] = gop_theo_nguoi.get(ma, 0.0) + _so(
                khoan.get("so_tien")
            )
    so_du_truoc = {}
    for chuoi in gop_theo_nguoi:
        vi = await db["so_du"].find_one(
            {"id_nguoi_dung": ObjectId(chuoi)}
        )
        so_du_truoc[chuoi] = _so(vi.get("so_du")) if vi else 0.0
    print("Số dư người góp trước:", so_du_truoc)

    ket_qua = await dich_vu_vi.hoan_tra(str(ID_BAI), id_admin)
    print("Kết quả hoàn trả:", {
        "so_nguoi_hoan": ket_qua["so_nguoi_hoan"],
        "so_tien_gop_da_hoan": ket_qua["so_tien_gop_da_hoan"],
        "phi_hoan_tra": ket_qua["phi_hoan_tra"],
        "so_tien_hoan": ket_qua["so_tien_hoan"],
        "trang_thai_vi": ket_qua["vi"]["trang_thai"],
    })

    # Xác minh số dư người góp ĐÃ TĂNG đúng 95% gross (nền tảng giữ 5%)
    for chuoi, truoc in so_du_truoc.items():
        gross = gop_theo_nguoi[chuoi]
        phi = tinh_phi(gross, TY_LE_PHI_HOAN_TRA)
        net = round(gross - phi, 2)
        vi = await db["so_du"].find_one({"id_nguoi_dung": ObjectId(chuoi)})
        sau = _so(vi.get("so_du")) if vi else 0.0
        tang = round(sau - truoc, 2)
        print(f"- người góp {chuoi[:8]}...: {truoc:,.0f} -> {sau:,.0f} "
              f"(+{tang:,.0f}; gross {gross:,.0f}; phí {phi:,.0f}; "
              f"kỳ vọng +{net:,.0f})")
        assert tang == net, "LỖI: số dư người góp không tăng đúng 95%!"

    # Giao dịch Hoan_Tra đã ghi — mỗi KHOẢN góp 1 giao dịch (một người góp
    # nhiều lần vẫn có nhiều giao dịch, khác với so_nguoi_hoan đếm người).
    dem = 0
    async for _ in db["giao_dich"].find({
        "id_bai_dang": ID_BAI, "loai_giao_dich": "Hoan_Tra",
    }):
        dem += 1
    dem_khoan = 0
    for col in COL_GOP:
        dem_khoan += await db[col].count_documents({
            "id_bai_dang": ID_BAI, "trang_thai": "Da_Hoan_Tra",
        })
    print(f"- giao dịch Hoan_Tra đã ghi: {dem} (khoản đã hoàn: {dem_khoan})")
    assert dem == dem_khoan, "LỖI: thiếu giao dịch Hoan_Tra!"

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

    # Khoản góp về Thanh_cong + xóa dấu vết hoàn trả (kể cả khoản đang
    # Dang_Hoan_Tra nếu lần chạy trước crash giữa chừng)
    for col in COL_GOP:
        kq = await db[col].update_many(
            {
                "id_bai_dang": ID_BAI,
                "trang_thai": {"$in": ["Da_Hoan_Tra", "Dang_Hoan_Tra"]},
            },
            {
                "$set": {"trang_thai": "Thanh_cong"},
                "$unset": {
                    "phi_hoan_tra": "",
                    "so_tien_hoan": "",
                    "id_giao_dich_hoan_tra": "",
                },
            },
        )
        if kq.modified_count:
            print(f"- {col}: phục hồi {kq.modified_count} khoản về Thanh_cong")

    # Đồng bộ lại tiến độ huy động = tổng GROSS các khoản đang Thanh_cong
    tong_gop = 0.0
    for col in COL_GOP:
        chuoi = [
            doc async for doc in db[col].aggregate([
                {"$match": {
                    "id_bai_dang": ID_BAI,
                    "trang_thai": "Thanh_cong",
                }},
                {"$group": {"_id": None, "tong": {"$sum": "$so_tien"}}},
            ])
        ]
        if chuoi:
            tong_gop += _so(chuoi[0].get("tong"))
    await db["bai_dang"].update_one(
        {"_id": ID_BAI},
        {"$set": {
            "so_tien_da_gop": round(tong_gop, 2),
            "ngay_cap_nhat": datetime.now(timezone.utc),
        }},
    )
    print(f"- tiến độ bài về tổng gross {tong_gop:,.0f} đ")

    # Ví dự án về Tam_giu, tiền tạm giữ = tổng GROSS đã hoàn trước đó
    # (nền tảng đã giữ 5% phí, không hoàn lại ví dự án).
    vi_bai = await db["vi_bai_dang"].find_one({"id_bai_dang": ID_BAI})
    if vi_bai:
        da_hoan = _so(vi_bai.get("so_tien_da_hoan_tra"))
        if da_hoan > 0:
            await db["vi_bai_dang"].update_one(
                {"_id": vi_bai["_id"]},
                {
                    "$set": {
                        "so_tien_tam_giu": round(da_hoan, 2),
                        "so_tien_da_hoan_tra": 0.0,
                        "trang_thai": "Tam_giu",
                        "ngay_cap_nhat": datetime.now(timezone.utc),
                    },
                    "$unset": {
                        "ngay_hoan_tra": "",
                        "phi_hoan_tra": "",
                        "so_tien_hoan_nguoi_gop": "",
                    },
                },
            )
            print(f"- ví dự án về Tam_giu, tam giu = {da_hoan:,.0f} đ")
        else:
            print("- ví dự án không có tiền hoàn trả — giữ nguyên")


async def main():
    try:
        await quahan_bai()
        await test_hoan_tra()
        print("\n=== XONG — bài đã quá hạn + ví chờ admin bấm Hoàn trả ===")
    finally:
        # Luôn hoàn nguyên tiền/ví kể cả khi assert hoặc mạng lỗi giữa chừng
        await hoan_nguyen()
        await client.close()


asyncio.run(main())
