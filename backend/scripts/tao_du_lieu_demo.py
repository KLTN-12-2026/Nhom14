
# Tao du lieu demo cho MongoDB Atlas:
#   - 3 tai khoan nguoi dang demo + 1 tai khoan quan tri vien (mk: Admin123456)
#   - 3 bai dang demo (Goi Von / Quyen Gop / Dau Tu) + hinh anh + lich su duyet
# Chay nhieu lan khong tao trung lap (idempotent):
#   python scripts/tao_du_lieu_demo.py  (tu thu muc backend/)

import asyncio
from datetime import datetime, time, timezone

from bson import ObjectId

from app.config.database import database
from app.utils.security import hash_password


def iso(ngay_iso: str):
    return datetime.strptime(ngay_iso, "%Y-%m-%dT%H:%M:%S.%fZ").replace(
        tzinfo=timezone.utc
    )


def nm(ngay_iso: str):
    # Nam sinh demo (ngay cuoi thang la dung)
    return datetime.combine(
        datetime.strptime(ngay_iso, "%Y-%m-%d").date(),
        time.min,
        tzinfo=timezone.utc,
    )


NGUOI_DUNG_DEMO = [
    {
        "ten_tk": "van_a_demo",
        "ho_ten": "Nguyễn Văn A",
        "email": "nguyenvana.demo@risingidea.vn",
        "dien_thoai": "0900000001",
        "nam_sinh": nm("1990-01-01"),
        "gioi_tinh": "Nam",
        "mat_khau": "Demo123456",
    },
    {
        "ten_tk": "tran_b_demo",
        "ho_ten": "Trần Thị B",
        "email": "tranthib.demo@risingidea.vn",
        "dien_thoai": "0900000002",
        "nam_sinh": nm("1992-05-05"),
        "gioi_tinh": "Nữ",
        "mat_khau": "Demo123456",
    },
    {
        "ten_tk": "nongsach_demo",
        "ho_ten": "Startup Nông Sạch Việt",
        "email": "nongsach.demo@risingidea.vn",
        "dien_thoai": "0900000003",
        "nam_sinh": nm("1995-08-08"),
        "gioi_tinh": "Khác",
        "mat_khau": "Demo123456",
    },
    {
        # Tai khoan kiem duyet bai dang (phan quyen qua chuc_vu)
        "ten_tk": "admin_demo",
        "ho_ten": "Quản Trị Viên Demo",
        "email": "admin.demo@risingidea.vn",
        "dien_thoai": "0900000000",
        "nam_sinh": nm("1988-12-12"),
        "gioi_tinh": "Khác",
        "mat_khau": "Admin123456",
    },
]

BAI_DANG_DEMO = [
    {
        "tieu_de": "Gọi vốn sản xuất phim ngắn về môi trường",
        "loai_bai_dang": "Gọi Vốn",
        "nguoi_goc": "van_a_demo",
        "noi_dung": (
            "Chúng tôi là một nhóm nhà sản xuất phim trẻ đang thực hiện dự án phim ngắn "
            "về bảo vệ môi trường. Dự án mong muốn "
            "truyền tải thông điệp về việc giảm thiểu rác thải nhựa và nâng cao ý thức "
            "bảo vệ thiên nhiên. Chúng tôi cần nguồn vốn để hoàn thiện quá trình "
            "sản xuất, hậu kỳ và phát hành bộ phim."
        ),
        "muc_tieu": 100_000_000,
        "thoi_gian_bat_dau": iso("2026-10-01T00:00:00.000Z"),
        "thoi_gian_ket_thuc": iso("2026-12-31T23:59:59.000Z"),
        "ngay_tao": iso("2026-09-25T08:00:00.000Z"),
        "ngay_cap_nhat": iso("2026-10-20T08:00:00.000Z"),
        "hinh_anh": [
            "https://placehold.co/800x600/e5e7eb/9ca3af?text=Du+an+phim+ngan",
            "https://placehold.co/800x600/dbeafe/64748b?text=Hau+truong+san+xuat",
        ],
    },
    {
        "tieu_de": "Quyên góp xây dựng thư viện cho trẻ em vùng cao",
        "loai_bai_dang": "Quyên Góp",
        "nguoi_goc": "tran_b_demo",
        "noi_dung": (
            "Dự án được thực hiện với mong muốn mang thêm sách và không gian đọc đến "
            "với trẻ em ở những khu vực còn nhiều khó khăn. Toàn bộ khoản đóng góp sẽ "
            "được sử dụng để mua sách, trang thiết bị và xây dựng không gian thư viện."
        ),
        "muc_tieu": 50_000_000,
        "thoi_gian_bat_dau": iso("2026-10-15T00:00:00.000Z"),
        "thoi_gian_ket_thuc": iso("2027-01-15T23:59:59.000Z"),
        "ngay_tao": iso("2026-10-10T08:00:00.000Z"),
        "ngay_cap_nhat": iso("2026-10-25T08:00:00.000Z"),
        "hinh_anh": [
            "https://placehold.co/800x600/fef3c7/92400e?text=Thu+vien+vung+cao",
        ],
    },
    {
        "tieu_de": "Gọi đầu tư chuỗi cửa hàng nông sản sạch",
        "loai_bai_dang": "Đầu Tư",
        "nguoi_goc": "nongsach_demo",
        "noi_dung": (
            "Kế hoạch kết nối trực tiếp vùng trồng với người tiêu dùng thành phố: thu "
            "mua theo chuẩn rõ ràng, đóng gói đạt quy định và phân phối qua các điểm "
            "bán đầu mối. Quỹ đầu tư dùng cho nhà sơ chế, kho tối giản, phương tiện "
            "vận chuyển và bước đầu phát triển ứng dụng đặt hàng.\n\nNhà đầu tư nhận "
            "phần trăm lợi nhuận theo thỏa thuận ký kết trong vòng 24 tháng đầu tiên, "
            "cập nhật báo cáo kinh doanh mỗi quý."
        ),
        "muc_tieu": 300_000_000,
        "thoi_gian_bat_dau": iso("2026-10-05T00:00:00.000Z"),
        "thoi_gian_ket_thuc": iso("2027-02-28T23:59:59.000Z"),
        "ngay_tao": iso("2026-09-30T09:00:00.000Z"),
        "ngay_cap_nhat": iso("2026-10-22T08:00:00.000Z"),
        "hinh_anh": [
            "https://placehold.co/800x600/d1fae5/065f46?text=Nong+san+sach",
        ],
    },
]


async def tao_nguoi_dung():
    bang_map = {}

    for nguoi in NGUOI_DUNG_DEMO:
        ten_tk = nguoi["ten_tk"]
        da_co = await database["nguoi_dung"].find_one({"ten_tk": ten_tk})

        if da_co:
            bang_map[ten_tk] = da_co["_id"]
            print(f"nguoi dung '{ten_tk}': da ton tai, bo qua")
            continue

        tim = {
            "ho_ten": nguoi["ho_ten"],
            "nam_sinh": nguoi["nam_sinh"],
            "gioi_tinh": nguoi["gioi_tinh"],
            "dien_thoai": nguoi["dien_thoai"],
            "email": nguoi["email"],
            "ten_tk": ten_tk,
            "mat_khau": hash_password(nguoi["mat_khau"]),
            "ngay_tao": datetime.now(timezone.utc),
            "ngay_cap_nhat": datetime.now(timezone.utc),
        }

        ket_qua = await database["nguoi_dung"].insert_one(tim)
        bang_map[ten_tk] = ket_qua.inserted_id
        print(f"nguoi dung '{ten_tk}': da tao ({ket_qua.inserted_id})")

    return bang_map


async def dam_bao_admin(bang_map, id_admin_demo):
    # Chuc vu quan tri: chuc_vu (ten_cv) + nguoi_dung_cv (id_nguoi_dung, id_chuc_vu)
    chuc_vu = await database["chuc_vu"].find_one({"ten_cv": "Quan_Tri_Vien"})

    if not chuc_vu:
        ket_qua = await database["chuc_vu"].insert_one({
            "ten_cv": "Quan_Tri_Vien",
            "mo_ta_cv": "Quyền quản trị hệ thống: duyệt bài, xử lý tố cáo, quản lý người dùng",
        })
        id_chuc_vu = ket_qua.inserted_id
        print("chuc_vu 'Quan_Tri_Vien': da tao")
    else:
        id_chuc_vu = chuc_vu["_id"]
        print("chuc_vu 'Quan_Tri_Vien': da ton tai")

    phan_quyen = await database["nguoi_dung_cv"].find_one({
        "id_nguoi_dung": id_admin_demo
    })

    if not phan_quyen:
        await database["nguoi_dung_cv"].insert_one({
            "id_nguoi_dung": id_admin_demo,
            "id_chuc_vu": id_chuc_vu,
            "ngay_phan_quyen": datetime.now(timezone.utc),
        })
        print("'admin_demo': da phan quan tri")
    else:
        print("'admin_demo': da co phan quan tri")


async def tao_bai_dang_demo(bang_map, id_admin):
    for bai in BAI_DANG_DEMO:
        ton_tai = await database["bai_dang"].find_one({
            "tieu_de": bai["tieu_de"]
        })

        if ton_tai:
            print(f"bai dang '{bai['tieu_de']}': da ton tai, bo qua")
            continue

        # Bai demo chuyen trang thai Vie optional Da_Duyet la san cho trang cong khai
        tai_lieu = {
            "loai_bai_dang": bai["loai_bai_dang"],
            "tieu_de": bai["tieu_de"],
            "noi_dung": bai["noi_dung"],
            "trang_thai": "Da_Duyet",
            "muc_tieu": float(bai["muc_tieu"]),
            "don_vi_tien_te": "VND",
            "thoi_gian_bat_dau": bai["thoi_gian_bat_dau"],
            "thoi_gian_ket_thuc": bai["thoi_gian_ket_thuc"],
            "id_nguoi_dang": bang_map[bai["nguoi_goc"]],
            "id_nguoi_duyet": id_admin,
            "ngay_tao": bai["ngay_tao"],
            "ngay_cap_nhat": bai["ngay_cap_nhat"],
        }

        ket_qua = await database["bai_dang"].insert_one(tai_lieu)
        id_bai = ket_qua.inserted_id

        await database["hinh_anh_bai_dang"].insert_many([
            {
                "id_bai_dang": id_bai,
                "duong_dan_hinh_anh": duong_dan,
                "thu_tu_hien_thi": thu_tu,
            }
            for thu_tu, duong_dan in enumerate(bai["hinh_anh"], start=1)
        ])

        # Ghi lich su duyet theo collection lich_su_duyet_bai
        await database["lich_su_duyet_bai"].insert_one({
            "id_bai_dang": id_bai,
            "id_nguoi_duyet": id_admin,
            "hanh_dong": "Duyet",
            "ly_do": "",
            "ngay_tao": bai["ngay_cap_nhat"],
        })

        print(f"bai dang '{bai['tieu_de']}': da tao ({id_bai})")


async def main():
    print("=== Seed du lieu demo ===")
    bang_map = await tao_nguoi_dung()
    await dam_bao_admin(bang_map, bang_map["admin_demo"])
    await tao_bai_dang_demo(bang_map, bang_map["admin_demo"])

    so_bai = await database["bai_dang"].count_documents({})
    so_da_duyet = await database["bai_dang"].count_documents({
        "trang_thai": "Da_Duyet"
    })
    print(f"=== Xong: {so_bai} bai dang tong ({so_da_duyet} cong khai) ===")


if __name__ == "__main__":
    asyncio.run(main())
