# Kiểm thử tự động 3 quy tắc tài chính + khóa góp + AI đánh giá ảnh.
#
# Script tự tạo người dùng / bài đăng / ví riêng, chạy SERVICE THẬT trên
# MongoDB rồi DỌN SẠCH toàn bộ dữ liệu trong finally — kể cả khi assert
# lỗi giữa chừng. Không đụng dữ liệu demo của nhóm.
#
# Nội dung kiểm tra:
#   1) Giới hạn góp 10.000 – 500.000.000 VND mỗi giao dịch.
#   2) Giải ngân: phí nền tảng 3% -> chủ dự án nhận 97%.
#   3) Hoàn trả: phí xử lý 5% -> người góp nhận 95%.
#   4) Đã giải ngân/hoàn trả -> chặn góp thêm (nút FE cũng disable).
#   5) Chatbot: kiểm tra ảnh + nạp bối cảnh dự án (KHÔNG gọi Gemini).
#
# Chạy: PYTHONUTF8=1 .venv/Scripts/python.exe scripts/e2e_quy_tac_tai_chinh.py

import asyncio
import base64
import os
import sys
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.decimal128 import Decimal128
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.database import client, database  # noqa: E402
from app.config.tai_chinh import (  # noqa: E402
    MONEY_MAX_GOP,
    MONEY_MIN_GOP,
    TY_LE_PHI_HOAN_TRA,
    TY_LE_PHI_NEN_TANG,
    tinh_phi,
)
from app.services import chatbot as dich_vu_chat  # noqa: E402
from app.services import khoan_gop as dich_vu_gop  # noqa: E402
from app.services import vi_bai_dang as dich_vu_vi  # noqa: E402
from app.services.so_du import GiaTriKhongHopLeError  # noqa: E402
from app.services.vi_bai_dang import ViBaiDangError, ViDaXuLyError  # noqa: E402

MA_TAG = f"e2e-tai-chinh-{int(datetime.now().timestamp())}"

ID_CHU = ObjectId()
ID_NGUOI_GOP = ObjectId()
ID_ADMIN = ObjectId()
ID_BAI_GIAI_NGAN = ObjectId()
ID_BAI_HOAN_TRA = ObjectId()
ID_BAI_CRASH = ObjectId()
ID_NGUOI_DUNG = [ID_CHU, ID_NGUOI_GOP, ID_ADMIN]
ID_BAI_DANG = [ID_BAI_GIAI_NGAN, ID_BAI_HOAN_TRA, ID_BAI_CRASH]

# 1x1 PNG trong suốt — đủ để kiểm tra bộ lọc ảnh của chatbot
ANH_PNG_1X1 = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
    "z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def _so(gia_tri) -> float:
    if isinstance(gia_tri, Decimal128):
        return float(gia_tri.to_decimal())
    try:
        return float(gia_tri)
    except (TypeError, ValueError):
        return 0.0


def _tien(gia_tri) -> Decimal128:
    return Decimal128(f"{round(float(gia_tri), 2):.2f}")


async def _tao_du_lieu():
    """Tạo user + 2 bài đăng + ví tối thiểu để chạy service."""
    now = datetime.now(timezone.utc)
    hom_qua = now - timedelta(days=1)
    ngay_mai = now + timedelta(days=7)
    # Collection nguoi_dung có unique index trên dien_thoai -> mỗi user test
    # phải có số riêng, không để null (null thứ 2 sẽ vi phạm unique).
    goc_dien_thoai = int(now.timestamp() * 1000) % 10_000_000

    await database["nguoi_dung"].insert_many([
        {
            "_id": ID_CHU,
            "ten_tk": f"e2e_chu_{MA_TAG}",
            "email": f"e2e_chu_{MA_TAG}@example.test",
            "dien_thoai": f"09{goc_dien_thoai:08d}",
            "ho_ten": "E2E Chủ dự án",
            "mat_khau": "khong-dung",
            "vai_tro": "Nguoi_Dung",
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
        },
        {
            "_id": ID_NGUOI_GOP,
            "ten_tk": f"e2e_gop_{MA_TAG}",
            "email": f"e2e_gop_{MA_TAG}@example.test",
            "dien_thoai": f"09{(goc_dien_thoai + 1) % 10_000_000:08d}",
            "ho_ten": "E2E Người góp",
            "mat_khau": "khong-dung",
            "vai_tro": "Nguoi_Dung",
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
        },
        {
            "_id": ID_ADMIN,
            "ten_tk": f"e2e_admin_{MA_TAG}",
            "email": f"e2e_admin_{MA_TAG}@example.test",
            "dien_thoai": f"09{(goc_dien_thoai + 2) % 10_000_000:08d}",
            "ho_ten": "E2E Quản trị",
            "mat_khau": "khong-dung",
            "vai_tro": "Quan_Tri_Vien",
            "trang_thai": "Hoat_Dong",
            "ngay_tao": now,
        },
    ])

    # Ví người góp: 1.000.000 đ để thử góp + hoàn
    await database["so_du"].insert_one({
        "id_nguoi_dung": ID_NGUOI_GOP,
        "so_du": _tien(1_000_000),
        "don_vi_tien_te": "VND",
        "trang_thai": "Hoat_Dong",
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    })

    # Bài 1: đủ vốn (mục tiêu 50.000) -> test giải ngân 97%
    await database["bai_dang"].insert_one({
        "_id": ID_BAI_GIAI_NGAN,
        "tieu_de": f"[E2E] Dự án giải ngân {MA_TAG}",
        "noi_dung": "Bài kiểm thử quy tắc phí nền tảng 3%.",
        "loai_bai_dang": "Gọi Vốn",
        "muc_tieu": _tien(50_000),
        "so_tien_da_gop": _tien(0),
        "id_nguoi_dang": ID_CHU,
        "trang_thai": "Da_Duyet",
        "thoi_gian_bat_dau": now,
        "thoi_gian_ket_thuc": ngay_mai,
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    })
    await database["vi_bai_dang"].insert_one({
        "id_bai_dang": ID_BAI_GIAI_NGAN,
        "so_tien_tam_giu": 0.0,
        "so_tien_da_giai_ngan": 0.0,
        "so_tien_da_hoan_tra": 0.0,
        "trang_thai": "Tam_giu",
        "id_nguoi_nhan": ID_CHU,
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    })

    # Bài 2: quá hạn, chưa đủ vốn -> test hoàn trả 95%
    await database["bai_dang"].insert_one({
        "_id": ID_BAI_HOAN_TRA,
        "tieu_de": f"[E2E] Dự án hoàn trả {MA_TAG}",
        "noi_dung": "Bài kiểm thử quy tắc phí hoàn trả 5%.",
        "loai_bai_dang": "Quyên Góp",
        "muc_tieu": _tien(1_000_000),
        "so_tien_da_gop": _tien(0),
        "id_nguoi_dang": ID_CHU,
        "trang_thai": "Da_Duyet",
        "thoi_gian_bat_dau": now - timedelta(days=10),
        "thoi_gian_ket_thuc": hom_qua,
        "ngay_tao": now - timedelta(days=10),
        "ngay_cap_nhat": now,
    })
    await database["vi_bai_dang"].insert_one({
        "id_bai_dang": ID_BAI_HOAN_TRA,
        "so_tien_tam_giu": 0.0,
        "so_tien_da_giai_ngan": 0.0,
        "so_tien_da_hoan_tra": 0.0,
        "trang_thai": "Tam_giu",
        "id_nguoi_nhan": ID_CHU,
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    })

    # Bài 3: giả lập lần chạy hoàn trả trước đã chuyển tiền nhưng crash
    # trước khi chốt khoản góp -> retry không được hoàn tiền lần 2.
    await database["bai_dang"].insert_one({
        "_id": ID_BAI_CRASH,
        "tieu_de": f"[E2E] Dự án retry crash {MA_TAG}",
        "noi_dung": "Bài kiểm thử retry hoàn trả sau crash.",
        "loai_bai_dang": "Quyên Góp",
        "muc_tieu": _tien(1_000_000),
        "so_tien_da_gop": _tien(100_000),
        "id_nguoi_dang": ID_CHU,
        "trang_thai": "Da_Duyet",
        "thoi_gian_bat_dau": now - timedelta(days=10),
        "thoi_gian_ket_thuc": hom_qua,
        "ngay_tao": now - timedelta(days=10),
        "ngay_cap_nhat": now,
    })
    await database["vi_bai_dang"].insert_one({
        "id_bai_dang": ID_BAI_CRASH,
        "so_tien_tam_giu": 100_000.0,
        "so_tien_da_giai_ngan": 0.0,
        "so_tien_da_hoan_tra": 0.0,
        "trang_thai": "Tam_giu",
        "id_nguoi_nhan": ID_CHU,
        "ngay_tao": now,
        "ngay_cap_nhat": now,
    })
    await database["khoan_quyen_gop"].insert_one({
        "id_bai_dang": ID_BAI_CRASH,
        "id_nguoi_gop": ID_NGUOI_GOP,
        "ma_loai": "quyen_gop",
        "loai": "Quyên Góp",
        "so_tien": _tien(100_000),
        "trang_thai": "Dang_Hoan_Tra",
        "an_danh": False,
        "loi_nhac": "",
        "so_huu_phan_tram": None,
        "ngay_tao": now - timedelta(days=5),
        "thoi_gian_hoan_tat": now - timedelta(days=5),
        "ngay_cap_nhat": now,
    })

    print(f"- Đã tạo user/bài/ví tạm (tag {MA_TAG})")


async def _so_du_nguoi_gop() -> float:
    vi = await database["so_du"].find_one({"id_nguoi_dung": ID_NGUOI_GOP})
    return _so(vi.get("so_du")) if vi else 0.0


async def _so_du_chu() -> float:
    vi = await database["so_du"].find_one({"id_nguoi_dung": ID_CHU})
    return _so(vi.get("so_du")) if vi else 0.0


async def _vi(id_bai: ObjectId) -> dict:
    return await database["vi_bai_dang"].find_one({"id_bai_dang": id_bai})


async def test_gioi_han_gop():
    print("\n=== 1) Giới hạn góp 10.000 – 500.000.000 ===")

    for so_tien in (MONEY_MIN_GOP - 1, MONEY_MAX_GOP + 1):
        try:
            await dich_vu_gop.tao_khoan_gop(
                ID_NGUOI_GOP, str(ID_BAI_GIAI_NGAN), so_tien=so_tien
            )
            raise SystemExit(f"!!! LỖI: góp {so_tien:,.0f} vẫn thành công")
        except GiaTriKhongHopLeError as error:
            print(f"- chặn đúng {so_tien:,.0f} đ: {error}")

    # Số dư không đổi sau 2 lần bị chặn
    assert await _so_du_nguoi_gop() == 1_000_000, "LỖI: ví bị trừ khi validate!"


async def test_giai_ngan_phi_3():
    print("\n=== 2) Giải ngân: phí nền tảng 3% -> chủ dự án nhận 97% ===")

    truoc = await _so_du_nguoi_gop()
    ket_qua = await dich_vu_gop.tao_khoan_gop(
        ID_NGUOI_GOP, str(ID_BAI_GIAI_NGAN), so_tien=50_000
    )
    print(f"- đã góp 50.000 đ; số dư {truoc:,.0f} -> "
          f"{await _so_du_nguoi_gop():,.0f}")

    assert await _so_du_nguoi_gop() == 950_000, "LỖI: trừ ví sai!"
    assert ket_qua["gop"]["so_tien"] == 50_000, "LỖI: khoản góp sai!"

    vi = await _vi(ID_BAI_GIAI_NGAN)
    assert _so(vi.get("so_tien_tam_giu")) == 50_000, "LỖI: escrow sai!"

    ket_qua_gn = await dich_vu_vi.giai_ngan(
        str(ID_BAI_GIAI_NGAN), ID_ADMIN
    )

    phi_mong_doi = tinh_phi(50_000, TY_LE_PHI_NEN_TANG)  # 1.500
    thuc_nhan_mong_doi = 50_000 - phi_mong_doi  # 48.500

    print(f"- phí nền tảng: {ket_qua_gn['phi_nen_tang']:,.0f} đ "
          f"(kỳ vọng {phi_mong_doi:,.0f})")
    print(f"- chủ dự án thực nhận: {ket_qua_gn['so_tien_thuc_nhan']:,.0f} đ "
          f"(kỳ vọng {thuc_nhan_mong_doi:,.0f})")
    print(f"- ví chủ dự án: {await _so_du_chu():,.0f} đ")

    assert ket_qua_gn["phi_nen_tang"] == phi_mong_doi, "LỖI: phí nền tảng!"
    assert ket_qua_gn["so_tien_thuc_nhan"] == thuc_nhan_mong_doi, \
        "LỖI: thực nhận!"
    assert await _so_du_chu() == thuc_nhan_mong_doi, \
        "LỖI: ví chủ dự án không nhận đúng 97%!"
    assert ket_qua_gn["giao_dich"]["loai_giao_dich"] == "Giai_Ngan", \
        "LỖI: loại giao dịch giải ngân!"

    # Gọi lần 2 phải bị chặn (idempotent — có thể báo hết tiền tạm giữ)
    try:
        await dich_vu_vi.giai_ngan(str(ID_BAI_GIAI_NGAN), ID_ADMIN)
        raise SystemExit("!!! LỖI: giải ngân lần 2 vẫn thành công")
    except ViBaiDangError as error:
        print(f"- giải ngân lần 2 bị chặn đúng: {type(error).__name__}: {error}")

    # Đã giải ngân -> góp thêm bị chặn
    try:
        await dich_vu_gop.tao_khoan_gop(
            ID_NGUOI_GOP, str(ID_BAI_GIAI_NGAN), so_tien=10_000
        )
        raise SystemExit("!!! LỖI: góp vào bài đã giải ngân vẫn thành công")
    except ViDaXuLyError as error:
        print(f"- góp sau giải ngân bị chặn đúng: {error}")

    # Trạng thái ví công khai phải trả đủ phí/thực nhận
    vi_cong_khai = await dich_vu_vi.xem_vi(str(ID_BAI_GIAI_NGAN))
    assert vi_cong_khai["trang_thai"] == "Da_giai_ngan", "LỖI: trạng thái ví!"
    assert vi_cong_khai["phi_nen_tang"] == phi_mong_doi, \
        "LỖI: xem_vi thiếu phí nền tảng!"
    assert vi_cong_khai["so_tien_thuc_nhan"] == thuc_nhan_mong_doi, \
        "LỖI: xem_vi thiếu thực nhận!"


async def test_hoan_tra_phi_5():
    print("\n=== 3) Hoàn trả: người góp nhận 95% (phí 5%) ===")

    # Góp 100.000 vào bài quá hạn: trước hết phải hạ mục tiêu/ngày để
    # service nhận góp — tạm mở hạn rồi đóng lại ngay sau khi góp.
    ngay_mai = datetime.now(timezone.utc) + timedelta(days=1)
    await database["bai_dang"].update_one(
        {"_id": ID_BAI_HOAN_TRA},
        {"$set": {"thoi_gian_ket_thuc": ngay_mai}},
    )

    truoc = await _so_du_nguoi_gop()
    await dich_vu_gop.tao_khoan_gop(
        ID_NGUOI_GOP, str(ID_BAI_HOAN_TRA), so_tien=100_000
    )
    assert await _so_du_nguoi_gop() == truoc - 100_000, "LỖI: trừ ví sai!"
    print(f"- đã góp 100.000 đ; số dư còn {await _so_du_nguoi_gop():,.0f} đ")

    # Đóng bài (quá hạn) để hoàn trả
    await database["bai_dang"].update_one(
        {"_id": ID_BAI_HOAN_TRA},
        {"$set": {
            "thoi_gian_ket_thuc": datetime.now(timezone.utc)
            - timedelta(days=1)
        }},
    )

    so_du_truoc_hoan = await _so_du_nguoi_gop()
    ket_qua = await dich_vu_vi.hoan_tra(str(ID_BAI_HOAN_TRA), ID_ADMIN)

    phi_mong_doi = tinh_phi(100_000, TY_LE_PHI_HOAN_TRA)  # 5.000
    hoan_mong_doi = 100_000 - phi_mong_doi  # 95.000

    print(f"- phí hoàn trả: {ket_qua['phi_hoan_tra']:,.0f} đ "
          f"(kỳ vọng {phi_mong_doi:,.0f})")
    print(f"- người góp thực nhận: {ket_qua['so_tien_hoan']:,.0f} đ "
          f"(kỳ vọng {hoan_mong_doi:,.0f})")
    print(f"- số dư người góp: {so_du_truoc_hoan:,.0f} -> "
          f"{await _so_du_nguoi_gop():,.0f}")

    assert ket_qua["so_nguoi_hoan"] == 1, "LỖI: số người hoàn!"
    assert ket_qua["phi_hoan_tra"] == phi_mong_doi, "LỖI: phí hoàn trả!"
    assert ket_qua["so_tien_hoan"] == hoan_mong_doi, "LỖI: tiền hoàn!"
    assert await _so_du_nguoi_gop() == so_du_truoc_hoan + hoan_mong_doi, \
        "LỖI: ví người góp không nhận 95%!"
    assert ket_qua["vi"]["trang_thai"] == "Da_hoan_tra", "LỖI: trạng thái ví!"
    assert ket_qua["vi"]["phi_hoan_tra"] == phi_mong_doi, \
        "LỖI: xem_vi thiếu phí hoàn trả!"
    assert ket_qua["vi"]["so_tien_hoan_nguoi_gop"] == hoan_mong_doi, \
        "LỖI: xem_vi thiếu tiền hoàn thực nhận!"

    # Khoản góp lưu lại phí + thực nhận
    khoan = await database["khoan_quyen_gop"].find_one({
        "id_bai_dang": ID_BAI_HOAN_TRA
    })
    assert khoan["trang_thai"] == "Da_Hoan_Tra", "LỖI: trạng thái khoản góp!"
    assert _so(khoan["phi_hoan_tra"]) == phi_mong_doi, \
        "LỖI: khoản góp thiếu phí hoàn trả!"
    assert _so(khoan["so_tien_hoan"]) == hoan_mong_doi, \
        "LỖI: khoản góp thiếu tiền hoàn!"

    # Tiến độ bài về 0
    bai = await database["bai_dang"].find_one({"_id": ID_BAI_HOAN_TRA})
    assert _so(bai.get("so_tien_da_gop")) == 0, "LỖI: tiến độ chưa về 0!"

    # Gọi lần 2 bị chặn
    try:
        await dich_vu_vi.hoan_tra(str(ID_BAI_HOAN_TRA), ID_ADMIN)
        raise SystemExit("!!! LỖI: hoàn trả lần 2 vẫn thành công")
    except ViDaXuLyError as error:
        print(f"- hoàn trả lần 2 bị chặn đúng: {error}")


async def test_retry_sau_crash():
    print("\n=== 4) Retry sau crash: không hoàn tiền 2 lần ===")

    khoan = await database["khoan_quyen_gop"].find_one({
        "id_bai_dang": ID_BAI_CRASH
    })
    vi = await database["so_du"].find_one({"id_nguoi_dung": ID_NGUOI_GOP})

    # Giả lập lần chạy trước: đã chuyển 95.000 đ nhưng crash trước khi
    # cập nhật khoản góp (khoản còn Dang_Hoan_Tra, ví đã +95.000).
    await database["giao_dich"].insert_one({
        "id_nguoi_dung": ID_NGUOI_GOP,
        "id_so_du": vi["_id"],
        "loai_giao_dich": "Hoan_Tra",
        "so_tien": _tien(95_000),
        "don_vi_tien_te": "VND",
        "trang_thai": "Thanh_cong",
        "mo_ta": "Giả lập hoàn trả đã chuyển trước khi crash",
        "id_bai_dang": ID_BAI_CRASH,
        "id_khoan_gop": khoan["_id"],
        "ngay_tao": datetime.now(timezone.utc),
        "thoi_gian_hoan_tat": datetime.now(timezone.utc),
    })
    await database["so_du"].update_one(
        {"_id": vi["_id"]},
        {"$set": {"so_du": _tien(995_000)}},
    )

    ket_qua = await dich_vu_vi.hoan_tra(str(ID_BAI_CRASH), ID_ADMIN)

    vi_sau = await database["so_du"].find_one({"_id": vi["_id"]})
    khoan_sau = await database["khoan_quyen_gop"].find_one({
        "_id": khoan["_id"]
    })

    print(f"- số dư sau retry: {_so(vi_sau['so_du']):,.0f} đ "
          f"(kỳ vọng 995.000 — không cộng thêm 95.000)")
    print(f"- khoản góp: {khoan_sau['trang_thai']} | "
          f"hoàn {_so(khoan_sau.get('so_tien_hoan')):,.0f} đ")

    assert _so(vi_sau["so_du"]) == 995_000, \
        "LỖI: retry đã hoàn tiền 2 lần!"
    assert ket_qua["so_tien_hoan"] == 95_000, "LỖI: tổng hoàn sai!"
    assert khoan_sau["trang_thai"] == "Da_Hoan_Tra", \
        "LỖI: khoản góp chưa được chốt!"
    assert _so(khoan_sau.get("so_tien_hoan")) == 95_000, \
        "LỖI: khoản góp thiếu tiền hoàn!"
    assert ket_qua["vi"]["trang_thai"] == "Da_hoan_tra", \
        "LỖI: ví dự án chưa chốt!"
    print("- retry chỉ chốt trạng thái, không chuyển tiền lần 2")


async def test_chatbot_anh():
    print("\n=== 5) Chatbot: kiểm tra ảnh + bối cảnh dự án ===")

    assert dich_vu_chat._kiem_tra_anh(ANH_PNG_1X1) == ANH_PNG_1X1, \
        "LỖI: ảnh PNG hợp lệ bị từ chối!"
    print("- ảnh PNG hợp lệ được chấp nhận")

    for anh_sai in (
        "khong-phai-data-url",
        "data:text/plain;base64,aGVsbG8=",
        "data:image/png;base64,@@khong-hop-le@@",
    ):
        try:
            dich_vu_chat._kiem_tra_anh(anh_sai)
            raise SystemExit(f"!!! LỖI: ảnh sai vẫn được nhận: {anh_sai[:30]}")
        except dich_vu_chat.AnhKhongHopLeError as error:
            print(f"- chặn đúng ảnh sai: {error}")

    boi_canh = await dich_vu_chat._boi_canh_du_an(str(ID_BAI_GIAI_NGAN))
    assert "[E2E] Dự án giải ngân" in boi_canh, "LỖI: thiếu tên dự án!"
    assert "Ví dự án" in boi_canh, "LỖI: thiếu trạng thái ví!"
    print("- bối cảnh dự án nạp đúng tên + ví cho AI")

    # id_bai_dang sai/rỗng -> bối cảnh rỗng, không crash
    assert await dich_vu_chat._boi_canh_du_an(None) == ""
    assert await dich_vu_chat._boi_canh_du_an("khong-hop-le") == ""
    print("- id dự án không hợp lệ -> bối cảnh rỗng, không crash")


async def _don_dep():
    print("\n=== 5) Dọn dẹp dữ liệu test ===")

    # Lấy id giao dịch trước khi xóa để dọn biến động số dư
    giao_dich_ids = [
        doc["_id"]
        async for doc in database["giao_dich"].find({
            "$or": [
                {"id_nguoi_dung": {"$in": ID_NGUOI_DUNG}},
                {"id_bai_dang": {"$in": ID_BAI_DANG}},
            ]
        })
    ]

    if giao_dich_ids:
        kq = await database["bien_dong_so_du"].delete_many({
            "id_giao_dich": {"$in": giao_dich_ids}
        })
        print(f"- bien_dong_so_du: {kq.deleted_count}")

    kq = await database["giao_dich"].delete_many({
        "_id": {"$in": giao_dich_ids}
    })
    print(f"- giao_dich: {kq.deleted_count}")

    for ten, dieu_kien in (
        ("khoan_gop_von", {"id_bai_dang": {"$in": ID_BAI_DANG}}),
        ("khoan_quyen_gop", {"id_bai_dang": {"$in": ID_BAI_DANG}}),
        ("khoan_dau_tu", {"id_bai_dang": {"$in": ID_BAI_DANG}}),
        ("vi_bai_dang", {"id_bai_dang": {"$in": ID_BAI_DANG}}),
        ("thong_bao", {
            "$or": [
                {"id_nguoi_dung": {"$in": ID_NGUOI_DUNG}},
                {"loai_doi_tuong": {
                    "$in": [f"bai_dang:{ma}" for ma in ID_BAI_DANG]
                }},
            ]
        }),
        ("nhat_ky_quan_tri", {
            "$or": [
                {"id_quan_tri_vien": ID_ADMIN},
                {"loai_doi_tuong": {
                    "$in": [f"bai_dang:{ma}" for ma in ID_BAI_DANG]
                }},
            ]
        }),
        ("bai_dang", {"_id": {"$in": ID_BAI_DANG}}),
        ("so_du", {"id_nguoi_dung": {"$in": ID_NGUOI_DUNG}}),
        ("nguoi_dung", {"_id": {"$in": ID_NGUOI_DUNG}}),
    ):
        kq = await database[ten].delete_many(dieu_kien)
        print(f"- {ten}: {kq.deleted_count}")

    # Xác minh sạch
    con_lai = 0
    for ten, dieu_kien in (
        ("nguoi_dung", {"_id": {"$in": ID_NGUOI_DUNG}}),
        ("bai_dang", {"_id": {"$in": ID_BAI_DANG}}),
        ("vi_bai_dang", {"id_bai_dang": {"$in": ID_BAI_DANG}}),
    ):
        con_lai += await database[ten].count_documents(dieu_kien)

    assert con_lai == 0, f"LỖI: còn {con_lai} bản ghi test chưa xóa!"
    print("- xác minh: 0 bản ghi test còn lại")


async def main():
    loi = None
    try:
        await _tao_du_lieu()
        await test_gioi_han_gop()
        await test_giai_ngan_phi_3()
        await test_hoan_tra_phi_5()
        await test_retry_sau_crash()
        await test_chatbot_anh()
        print("\n=== TẤT CẢ KIỂM TRA ĐỀU PASS ===")
    except BaseException as error:  # kể cả SystemExit/KeyboardInterrupt
        loi = error
        print(f"\n!!! THẤT BẠI: {type(error).__name__}: {error}")
    finally:
        try:
            await _don_dep()
        except Exception as error_don:
            print(f"!!! LỖI DỌN DẸP: {error_don}")
            if loi is None:
                loi = error_don
        finally:
            await client.close()

    if loi is not None:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
