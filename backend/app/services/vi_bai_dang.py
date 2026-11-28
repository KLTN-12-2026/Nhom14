
from bson import ObjectId
from bson.decimal128 import Decimal128
from datetime import datetime, timezone

from app.config.database import database
from app.config.tai_chinh import (
    TY_LE_PHI_HOAN_TRA,
    TY_LE_PHI_NEN_TANG,
    tinh_phi,
)
from app.services.bai_dang import KhongTimThayBaiDangError, lay_ban_do_ten_nguoi_dang
from app.services import so_du as dich_vu_so_du
from app.services.thong_bao import tao_thong_bao


# Ví dự án (escrow): tiền người góp bị trừ khỏi ví cá nhân được GIỮ tại
# đây, gắn theo từng bài đăng (1 bài = 1 ví). Admin là người quyết định
# giải ngân cho người gọi vốn (bài đủ vốn) hoặc hoàn trả người góp
# (bài hết hạn mà chưa đủ vốn).
#
# Schema khớp collection vi_bai_dang (tạo sẵn trong Atlas):
#   id_bai_dang        ObjectId bài đăng
#   so_tien_tam_giu    số tiền đang escrow (float VND)
#   so_tien_da_giai_ngan  tổng đã chuyển cho người gọi vốn (cộng dồn)
#   so_tien_da_hoan_tra   tổng đã hoàn lại người góp (cộng dồn)
#   trang_thai         Tam_giu | Da_giai_ngan | Da_hoan_tra
#   id_nguoi_nhan      người gọi vốn (nhận tiền khi giải ngân)
#   ngay_tao / ngay_cap_nhat / ngay_giai_ngan / ngay_hoan_tra
#
# Dữ liệu cũ tạo tay có thể ghi "Tam giu" (khoảng trắng) — đọc luôn
# chuẩn hóa, ghi mới dùng bản gạch dưới cho đồng nhất.

COLLECTION = "vi_bai_dang"

TRANG_THAI_VI = {
    "Tam_giu": "Đang tạm giữ",
    "Da_giai_ngan": "Đã giải ngân",
    "Da_hoan_tra": "Đã hoàn trả",
}

# Chấp nhận cả bản ghi cũ "Tam giu" (khoảng trắng) khi so khớp trạng thái
TRANG_THAI_TAM_GIU = ["Tam_giu", "Tam giu"]


class ViBaiDangError(Exception):
    """Lỗi nghiệp vụ chung của ví dự án (router chuyển thành 409)."""
    pass


class KhongCoTienTamGiuError(ViBaiDangError):
    """Ví dự án không còn tiền để giải ngân / hoàn trả."""
    pass


class ViDaXuLyError(ViBaiDangError):
    """Ví đã được giải ngân hoặc hoàn trả — không thao tác lần 2."""
    pass


class BaiDangChuaDuVonError(ViBaiDangError):
    """Bài chưa đạt mục tiêu — không thể giải ngân."""
    pass


class BaiDangChuaHetHanError(ViBaiDangError):
    """Bài chưa hết hạn — không thể hoàn trả."""
    pass


def _so(gia_tri, mac_dinh: float = 0.0) -> float:
    if gia_tri is None:
        return mac_dinh
    if isinstance(gia_tri, Decimal128):
        return float(gia_tri.to_decimal())
    if isinstance(gia_tri, (int, float)):
        return float(gia_tri)
    return mac_dinh


def _chuan_trang_thai(gia_tri) -> str:
    # "Tam giu" (bản cũ) -> "Tam_giu" để so sánh thống nhất trong code
    return str(gia_tri or "").strip().replace(" ", "_")


def _iso(thoi_gian):
    if not thoi_gian:
        return None
    if thoi_gian.tzinfo is None:
        thoi_gian = thoi_gian.replace(tzinfo=timezone.utc)
    return thoi_gian.isoformat()


async def _doc_bai_dang(id_bai_dang: ObjectId) -> dict:
    doc = await database["bai_dang"].find_one({"_id": id_bai_dang})
    if not doc:
        raise KhongTimThayBaiDangError("Không tìm thấy bài đăng.")
    return doc


async def _dam_bao_vi(id_bai_dang: ObjectId, id_nguoi_nhan: ObjectId | None = None) -> dict:
    """Mỗi bài đăng có đúng 1 ví: thiếu thì tạo mới số tiền tạm giữ 0."""
    vi = await database[COLLECTION].find_one({"id_bai_dang": id_bai_dang})

    if not vi:
        now = datetime.now(timezone.utc)
        vi = {
            "id_bai_dang": id_bai_dang,
            "so_tien_tam_giu": 0.0,
            "so_tien_da_giai_ngan": 0.0,
            "so_tien_da_hoan_tra": 0.0,
            "trang_thai": "Tam_giu",
            "id_nguoi_nhan": id_nguoi_nhan,
            "ngay_tao": now,
            "ngay_cap_nhat": now,
        }
        result = await database[COLLECTION].insert_one(vi)
        vi["_id"] = result.inserted_id

    return vi


async def kiem_tra_duoc_gop(id_bai_dang: ObjectId) -> None:
    """Chặn góp mới khi ví dự án đã đóng (giải ngân/hoàn trả xong).

    Ném ViDaXuLyError nếu dự án đã chốt tiền — luồng góp vốn gọi TRƯỚC
    khi trừ ví để người dùng không bị mất oan.
    """
    vi = await database[COLLECTION].find_one({"id_bai_dang": id_bai_dang})
    if not vi:
        return

    if _chuan_trang_thai(vi.get("trang_thai")) != "Tam_giu":
        raise ViDaXuLyError(
            "Dự án đã được giải ngân hoặc hoàn trả — không nhận ủng hộ thêm."
        )


async def cong_tien(id_bai_dang: ObjectId, so_tien: float) -> dict:
    """Cộng tiền ủng hộ vào ví dự án — gọi sau khi ghi khoản góp thành công.

    Ví phải đang 'Tam_giu' (đã chốt thì từ chối, luồng góp vốn tự hoàn
    tiền lại cho người góp nếu bước này lỗi).
    """
    vi = await _dam_bao_vi(id_bai_dang)

    if _chuan_trang_thai(vi.get("trang_thai")) != "Tam_giu":
        raise ViDaXuLyError(
            "Dự án đã được giải ngân hoặc hoàn trả — không nhận ủng hộ thêm."
        )

    now = datetime.now(timezone.utc)
    await database[COLLECTION].update_one(
        {"_id": vi["_id"]},
        {
            "$inc": {"so_tien_tam_giu": round(float(so_tien), 2)},
            "$set": {"ngay_cap_nhat": now},
        },
    )

    return await database[COLLECTION].find_one({"_id": vi["_id"]})


async def xem_vi(id_bai_dang: str) -> dict:
    """Thông tin ví dự án — công khai (mọi người thấy số đã giải ngân)."""
    if not id_bai_dang or not ObjectId.is_valid(id_bai_dang):
        raise KhongTimThayBaiDangError("Mã bài đăng không hợp lệ.")

    id_object = ObjectId(id_bai_dang)
    bai_dang = await _doc_bai_dang(id_object)
    vi = await _dam_bao_vi(id_object, bai_dang.get("id_nguoi_dang"))

    tam_giu = _so(vi.get("so_tien_tam_giu"))
    da_giai_ngan = _so(vi.get("so_tien_da_giai_ngan"))
    da_hoan_tra = _so(vi.get("so_tien_da_hoan_tra"))
    phi_nen_tang = _so(vi.get("phi_nen_tang"))
    so_tien_thuc_nhan = _so(vi.get("so_tien_thuc_nhan"))
    phi_hoan_tra = _so(vi.get("phi_hoan_tra"))
    so_tien_hoan_nguoi_gop = _so(vi.get("so_tien_hoan_nguoi_gop"))

    # Tên người gọi vốn (ghép theo id như trang chi tiết)
    ban_do = await lay_ban_do_ten_nguoi_dang(
        [str(bai_dang.get("id_nguoi_dang") or "")]
    )

    return {
        "id_bai_dang": str(id_object),
        "tong_tien_nhan": round(tam_giu + da_giai_ngan + da_hoan_tra, 2),
        "da_giai_ngan": round(da_giai_ngan, 2),
        "so_du_con_lai": round(tam_giu, 2),
        "trang_thai": _chuan_trang_thai(vi.get("trang_thai")),
        "mo_ta_trang_thai": TRANG_THAI_VI.get(
            _chuan_trang_thai(vi.get("trang_thai")), "Đang tạm giữ"
        ),
        "ten_nguoi_nhan": ban_do.get(str(bai_dang.get("id_nguoi_dang"))),
        "ngay_giai_ngan": _iso(vi.get("ngay_giai_ngan")),
        "ngay_hoan_tra": _iso(vi.get("ngay_hoan_tra")),
        # Quy tắc tài chính: phí nền tảng 3% khi giải ngân, phí hoàn trả
        # 5% khi dự án thất bại. da_giai_ngan / da_hoan_tra vẫn là số GỘP
        # để "Tổng tiền nhận" luôn khớp tiến độ huy động.
        "phi_nen_tang": round(phi_nen_tang, 2),
        "so_tien_thuc_nhan": round(so_tien_thuc_nhan, 2),
        "ty_le_phi_nen_tang": TY_LE_PHI_NEN_TANG,
        "phi_hoan_tra": round(phi_hoan_tra, 2),
        "so_tien_hoan_nguoi_gop": round(so_tien_hoan_nguoi_gop, 2),
        "ty_le_phi_hoan_tra": TY_LE_PHI_HOAN_TRA,
    }


async def giai_ngan(id_bai_dang: str, id_nguoi_duyet: ObjectId) -> dict:
    """Admin giải ngân: chuyển toàn bộ tiền tạm giữ vào ví người gọi vốn.

    Điều kiện: bài đã đủ vốn (so_tien_da_gop >= muc_tieu), ví đang
    'Tam_giu' và có tiền. Khóa trạng thái bằng find_one_and_update —
    bấm 2 lần không chuyển tiền 2 lần (idempotent).
    """
    if not id_bai_dang or not ObjectId.is_valid(id_bai_dang):
        raise KhongTimThayBaiDangError("Mã bài đăng không hợp lệ.")

    id_object = ObjectId(id_bai_dang)
    bai_dang = await _doc_bai_dang(id_object)

    so_da_gop = _so(bai_dang.get("so_tien_da_gop"))
    muc_tieu = _so(bai_dang.get("muc_tieu"))
    tieu_de = bai_dang.get("tieu_de", "")

    if muc_tieu <= 0 or so_da_gop < muc_tieu:
        raise BaiDangChuaDuVonError(
            f"Dự án chưa đủ vốn ({so_da_gop:,.0f}/{muc_tieu:,.0f} VND) — "
            "chỉ giải ngân sau khi đạt mục tiêu."
        )

    vi = await _dam_bao_vi(id_object, bai_dang.get("id_nguoi_dang"))
    so_tien = _so(vi.get("so_tien_tam_giu"))

    if so_tien <= 0:
        raise KhongCoTienTamGiuError(
            "Ví dự án không còn tiền tạm giữ để giải ngân."
        )

    # Phí nền tảng 3% trên tổng tiền huy động; chủ dự án nhận phần còn lại.
    phi_nen_tang = tinh_phi(so_tien, TY_LE_PHI_NEN_TANG)
    so_tien_thuc_nhan = round(so_tien - phi_nen_tang, 2)

    if so_tien_thuc_nhan <= 0:
        raise ViBaiDangError(
            "Số tiền giải ngân sau khi trừ phí nền tảng không hợp lệ."
        )

    # Khóa ví TRƯỚC (chuyển trạng thái, trừ tạm giữ) — tiền chuyển sau.
    now = datetime.now(timezone.utc)
    da_khoa = await database[COLLECTION].find_one_and_update(
        {
            "_id": vi["_id"],
            "trang_thai": {"$in": TRANG_THAI_TAM_GIU},
        },
        {
            "$set": {
                "so_tien_tam_giu": 0.0,
                "trang_thai": "Da_giai_ngan",
                "ngay_giai_ngan": now,
                "ngay_cap_nhat": now,
            },
            "$inc": {
                # da_giai_ngan giữ số GỘP để tổng tiền nhận khớp tiến độ;
                # phí nền tảng + thực nhận là hai trường theo dõi riêng.
                "so_tien_da_giai_ngan": round(so_tien, 2),
                "phi_nen_tang": phi_nen_tang,
                "so_tien_thuc_nhan": so_tien_thuc_nhan,
            },
        },
    )

    if not da_khoa:
        raise ViDaXuLyError("Ví dự án đã được xử lý trước đó.")

    id_nguoi_nhan = vi.get("id_nguoi_nhan") or bai_dang.get("id_nguoi_dang")

    try:
        ket_qua_nap = await dich_vu_so_du.nap_tien(
            id_nguoi_nhan,
            so_tien_thuc_nhan,
            loai_giao_dich="Giai_Ngan",
            mo_ta=(
                f"Giải ngân cho dự án \"{tieu_de}\" "
                f"(tổng {so_tien:,.0f} VND, phí nền tảng "
                f"{TY_LE_PHI_NEN_TANG:.0%}: {phi_nen_tang:,.0f} VND)"
            ),
            id_bai_dang=str(id_object),
        )
    except Exception:
        # Chuyển tiền lỗi -> mở khóa ví trả về trạng thái tạm giữ
        await database[COLLECTION].update_one(
            {"_id": vi["_id"]},
            {
                "$set": {
                    "so_tien_tam_giu": so_tien,
                    "trang_thai": "Tam_giu",
                    "ngay_cap_nhat": datetime.now(timezone.utc),
                },
                "$inc": {
                    "so_tien_da_giai_ngan": -round(so_tien, 2),
                    "phi_nen_tang": -phi_nen_tang,
                    "so_tien_thuc_nhan": -so_tien_thuc_nhan,
                },
                "$unset": {"ngay_giai_ngan": ""},
            },
        )
        raise

    # Thông báo cho người gọi vốn (phụ trợ — lỗi không làm sập nghiệp vụ)
    try:
        await tao_thong_bao(
            id_nguoi_nhan,
            loai_thong_bao="Vi",
            tieu_de="Giải ngân thành công",
            noi_dung=(
                f"Dự án \"{tieu_de}\" đã đạt mục tiêu. "
                f"{so_tien_thuc_nhan:,.0f} VND đã chuyển vào ví của bạn "
                f"(tổng giải ngân {so_tien:,.0f} VND, phí nền tảng "
                f"{TY_LE_PHI_NEN_TANG:.0%}: {phi_nen_tang:,.0f} VND)."
            ),
            loai_doi_tuong=f"bai_dang:{id_bai_dang}",
        )
    except Exception:
        pass

    # Nhật ký quản trị: lưu rõ tổng giải ngân / phí / thực nhận để đối soát
    try:
        await database["nhat_ky_quan_tri"].insert_one({
            "id_quan_tri_vien": id_nguoi_duyet,
            "hanh_dong": "Giai_Ngan",
            "loai_doi_tuong": f"bai_dang:{id_bai_dang}",
            "ly_do": (
                f"Giải ngân {so_tien:,.0f} VND; phí nền tảng "
                f"{TY_LE_PHI_NEN_TANG:.0%} {phi_nen_tang:,.0f} VND; "
                f"thực nhận {so_tien_thuc_nhan:,.0f} VND"
            ),
            "ngay_tao": now,
        })
    except Exception:
        pass

    return {
        "vi": await xem_vi(id_bai_dang),
        "giao_dich": ket_qua_nap["giao_dich"],
        "vi_nguoi_nhan": ket_qua_nap["vi"],
        "so_tien_gop": round(so_tien, 2),
        "phi_nen_tang": phi_nen_tang,
        "so_tien_thuc_nhan": so_tien_thuc_nhan,
        "ty_le_phi_nen_tang": TY_LE_PHI_NEN_TANG,
    }


async def hoan_tra(id_bai_dang: str, id_nguoi_duyet: ObjectId) -> dict:
    """Admin hoàn trả: bài hết hạn chưa đủ vốn -> trả tiền từng người góp.

    Hoàn theo từng khoản (Thanh_cong -> Da_Hoan_Tra); lỗi 1 người không
    chặn những người khác. Đã hoàn rồi sẽ bị bỏ qua khi admin thử lại.
    """
    if not id_bai_dang or not ObjectId.is_valid(id_bai_dang):
        raise KhongTimThayBaiDangError("Mã bài đăng không hợp lệ.")

    id_object = ObjectId(id_bai_dang)
    bai_dang = await _doc_bai_dang(id_object)

    so_da_gop = _so(bai_dang.get("so_tien_da_gop"))
    muc_tieu = _so(bai_dang.get("muc_tieu"))
    tieu_de = bai_dang.get("tieu_de", "")

    if muc_tieu > 0 and so_da_gop >= muc_tieu:
        raise BaiDangChuaHetHanError(
            "Dự án đã đạt mục tiêu — dùng GIẢI NGÂN để chuyển tiền "
            "cho người gọi vốn thay vì hoàn trả."
        )

    thoi_gian_ket_thuc = bai_dang.get("thoi_gian_ket_thuc")
    if thoi_gian_ket_thuc:
        if thoi_gian_ket_thuc.tzinfo is None:
            thoi_gian_ket_thuc = thoi_gian_ket_thuc.replace(
                tzinfo=timezone.utc
            )
        if thoi_gian_ket_thuc > datetime.now(timezone.utc):
            raise BaiDangChuaHetHanError(
                "Dự án chưa hết hạn — chỉ hoàn trả sau thời gian kết thúc."
            )

    vi = await _dam_bao_vi(id_object, bai_dang.get("id_nguoi_dang"))

    if _chuan_trang_thai(vi.get("trang_thai")) != "Tam_giu":
        raise ViDaXuLyError("Ví dự án đã được xử lý trước đó.")

    if _so(vi.get("so_tien_tam_giu")) <= 0:
        raise KhongCoTienTamGiuError(
            "Ví dự án không còn tiền tạm giữ để hoàn trả."
        )

    # Quét 3 collection khoản góp của bài, hoàn từng người.
    # Mỗi khoản: người góp nhận 95%, nền tảng giữ 5% phí xử lý hoàn trả.
    collection_gop = ["khoan_gop_von", "khoan_quyen_gop", "khoan_dau_tu"]
    loi_hoan: list = []
    so_khoan_hoan_thanh_cong = 0
    now = datetime.now(timezone.utc)

    for ten_collection in collection_gop:
        cursor = database[ten_collection].find({
            "id_bai_dang": id_object,
            "trang_thai": {"$in": ["Thanh_cong", "Dang_Hoan_Tra"]},
        })

        async for khoan in cursor:
            id_nguoi_gop = khoan.get("id_nguoi_gop")
            so_tien_gop = _so(khoan.get("so_tien"))

            if not id_nguoi_gop or so_tien_gop <= 0:
                continue

            phi_hoan_tra = tinh_phi(so_tien_gop, TY_LE_PHI_HOAN_TRA)
            so_tien_hoan = round(so_tien_gop - phi_hoan_tra, 2)

            # Khoản đang Dang_Hoan_Tra = lần chạy trước có thể đã chuyển
            # tiền nhưng crash trước khi cập nhật khoản góp. Kiểm tra
            # giao dịch gắn đúng id_khoan_gop:
            #   - có  -> chỉ chốt trạng thái, KHÔNG chuyển tiền lần 2.
            #   - không -> mở lại Thanh_cong rồi xử lý bình thường.
            if khoan.get("trang_thai") == "Dang_Hoan_Tra":
                giao_dich_cu = await database["giao_dich"].find_one({
                    "id_khoan_gop": khoan["_id"],
                    "loai_giao_dich": "Hoan_Tra",
                })

                if giao_dich_cu:
                    await database[ten_collection].update_one(
                        {"_id": khoan["_id"], "trang_thai": "Dang_Hoan_Tra"},
                        {
                            "$set": {
                                "trang_thai": "Da_Hoan_Tra",
                                "phi_hoan_tra": dich_vu_so_du._tien(
                                    phi_hoan_tra
                                ),
                                "so_tien_hoan": dich_vu_so_du._tien(
                                    so_tien_hoan
                                ),
                                "id_giao_dich_hoan_tra": giao_dich_cu["_id"],
                                "ngay_cap_nhat": now,
                            }
                        },
                    )
                    so_khoan_hoan_thanh_cong += 1
                    continue

                await database[ten_collection].update_one(
                    {"_id": khoan["_id"], "trang_thai": "Dang_Hoan_Tra"},
                    {
                        "$set": {
                            "trang_thai": "Thanh_cong",
                            "ngay_cap_nhat": now,
                        }
                    },
                )

            # Claim khoản góp trước khi chuyển tiền: bấm hoàn trả 2 lần
            # hoặc 2 admin cùng thao tác sẽ không cộng tiền 2 lần.
            da_claim = await database[ten_collection].find_one_and_update(
                {"_id": khoan["_id"], "trang_thai": "Thanh_cong"},
                {
                    "$set": {
                        "trang_thai": "Dang_Hoan_Tra",
                        "ngay_cap_nhat": now,
                    }
                },
            )
            if not da_claim:
                continue

            try:
                ket_qua_nap = await dich_vu_so_du.nap_tien(
                    id_nguoi_gop,
                    so_tien_hoan,
                    loai_giao_dich="Hoan_Tra",
                    mo_ta=(
                        f"Hoàn tiền — dự án \"{tieu_de}\" hết hạn "
                        f"chưa đủ vốn (phí hoàn trả "
                        f"{TY_LE_PHI_HOAN_TRA:.0%}: {phi_hoan_tra:,.0f} VND)"
                    ),
                    id_bai_dang=str(id_object),
                    id_khoan_gop=str(khoan["_id"]),
                )
            except Exception:
                # Chuyển tiền lỗi -> trả khoản về Thanh_cong để lần sau thử lại
                await database[ten_collection].update_one(
                    {"_id": khoan["_id"], "trang_thai": "Dang_Hoan_Tra"},
                    {
                        "$set": {
                            "trang_thai": "Thanh_cong",
                            "ngay_cap_nhat": now,
                        }
                    },
                )
                loi_hoan.append(str(id_nguoi_gop))
                continue

            so_khoan_hoan_thanh_cong += 1

            await database[ten_collection].update_one(
                {"_id": khoan["_id"]},
                {
                    "$set": {
                        "trang_thai": "Da_Hoan_Tra",
                        "phi_hoan_tra": dich_vu_so_du._tien(phi_hoan_tra),
                        "so_tien_hoan": dich_vu_so_du._tien(so_tien_hoan),
                        "id_giao_dich_hoan_tra": ObjectId(
                            ket_qua_nap["giao_dich"]["id"]
                        ),
                        "ngay_cap_nhat": now,
                    }
                },
            )

            # Thông báo cho người góp (phụ trợ — không chặn luồng chính)
            try:
                await tao_thong_bao(
                    id_nguoi_gop,
                    loai_thong_bao="Vi",
                    tieu_de="Hoàn tiền ủng hộ",
                    noi_dung=(
                        f"Dự án \"{tieu_de}\" đã hết hạn chưa đủ vốn. "
                        f"{so_tien_hoan:,.0f} VND đã hoàn lại vào ví của bạn "
                        f"(phí xử lý hoàn trả {TY_LE_PHI_HOAN_TRA:.0%}: "
                        f"{phi_hoan_tra:,.0f} VND)."
                    ),
                    loai_doi_tuong=f"bai_dang:{id_bai_dang}",
                )
            except Exception:
                pass

    if loi_hoan:
        raise ViBaiDangError(
            f"Hoàn trả được {so_khoan_hoan_thanh_cong} khoản, còn "
            f"{len(loi_hoan)} khoản lỗi. Vui lòng thử lại."
        )

    # Tổng hợp lại TOÀN BỘ khoản đã hoàn (kể cả lần chạy trước nếu retry)
    # để ví dự án và số liệu trả về luôn khớp, không cộng dồn sai.
    id_nguoi_da_hoan = set()
    tong_gop_da_hoan = 0.0
    tong_phi_hoan = 0.0
    tong_net_da_hoan = 0.0

    for ten_collection in collection_gop:
        cursor = database[ten_collection].find({
            "id_bai_dang": id_object,
            "trang_thai": "Da_Hoan_Tra",
        })
        async for khoan in cursor:
            so_gop = _so(khoan.get("so_tien"))
            phi = _so(khoan.get("phi_hoan_tra"))
            net = _so(
                khoan.get("so_tien_hoan"),
                round(so_gop - phi, 2),
            )
            id_nguoi_gop = khoan.get("id_nguoi_gop")
            if id_nguoi_gop:
                id_nguoi_da_hoan.add(str(id_nguoi_gop))
            tong_gop_da_hoan += so_gop
            tong_phi_hoan += phi
            tong_net_da_hoan += net

    # Đếm NGƯỜI được hoàn (một người góp nhiều lần vẫn là 1 người)
    so_nguoi_hoan = len(id_nguoi_da_hoan)

    await database[COLLECTION].update_one(
        {"_id": vi["_id"]},
        {
            "$set": {
                "so_tien_tam_giu": 0.0,
                "trang_thai": "Da_hoan_tra",
                "ngay_hoan_tra": now,
                "ngay_cap_nhat": now,
                # da_hoan_tra giữ số GỘP; phí + thực nhận theo dõi riêng
                "so_tien_da_hoan_tra": round(tong_gop_da_hoan, 2),
                "phi_hoan_tra": round(tong_phi_hoan, 2),
                "so_tien_hoan_nguoi_gop": round(tong_net_da_hoan, 2),
            }
        },
    )

    # Tiến độ huy động của bài về 0 — tiền đã trả lại hết cho người ủng hộ.
    await database["bai_dang"].update_one(
        {"_id": id_object},
        {
            "$set": {
                "so_tien_da_gop": 0.0,
                "ngay_cap_nhat": now,
            }
        },
    )

    # Báo người gọi vốn biết dự án đã dừng và hoàn tiền xong
    try:
        id_nguoi_dang = bai_dang.get("id_nguoi_dang")
        if id_nguoi_dang:
            await tao_thong_bao(
                id_nguoi_dang,
                loai_thong_bao="He_Thong",
                tieu_de="Dự án hết hạn — đã hoàn tiền người ủng hộ",
                noi_dung=(
                    f"Dự án \"{tieu_de}\" kết thúc chưa đạt mục tiêu. "
                    f"Tổng {tong_gop_da_hoan:,.0f} VND đã được hoàn lại "
                    f"cho người ủng hộ ({tong_net_da_hoan:,.0f} VND sau "
                    f"phí xử lý {TY_LE_PHI_HOAN_TRA:.0%}: "
                    f"{tong_phi_hoan:,.0f} VND)."
                ),
                loai_doi_tuong=f"bai_dang:{id_bai_dang}",
            )
    except Exception:
        pass

    # Nhật ký quản trị: đối soát tổng hoàn / phí / thực nhận
    try:
        await database["nhat_ky_quan_tri"].insert_one({
            "id_quan_tri_vien": id_nguoi_duyet,
            "hanh_dong": "Hoan_Tra",
            "loai_doi_tuong": f"bai_dang:{id_bai_dang}",
            "ly_do": (
                f"Hoàn trả {so_nguoi_hoan} khoản; tổng góp "
                f"{tong_gop_da_hoan:,.0f} VND; phí hoàn trả "
                f"{TY_LE_PHI_HOAN_TRA:.0%} {tong_phi_hoan:,.0f} VND; "
                f"người góp thực nhận {tong_net_da_hoan:,.0f} VND"
            ),
            "ngay_tao": now,
        })
    except Exception:
        pass

    return {
        "so_nguoi_hoan": so_nguoi_hoan,
        "so_tien_hoan": round(tong_net_da_hoan, 2),
        "so_tien_gop_da_hoan": round(tong_gop_da_hoan, 2),
        "phi_hoan_tra": round(tong_phi_hoan, 2),
        "ty_le_phi_hoan_tra": TY_LE_PHI_HOAN_TRA,
        "vi": await xem_vi(id_bai_dang),
    }
