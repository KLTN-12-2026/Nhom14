
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import FooterTrangChu from "../../components/Home/FooterTrangChu";
import Button from "../../components/Button/Button";
import { tb } from "../../services/thongBaoService";
import {
  getWallet,
  napTien,
  dongBoViTuBe,
} from "../../services/walletService";
import { LOI_KHONG_KET_NOI } from "../../services/apiClient";
import { getSession } from "../../services/authService";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// Mức nạp nhanh (click chọn thay vì gõ) — theo nghiệp vụ nạp 10k trở lên
const MUC_NHANH = [
  { so_tien: 50000, nhan: "50.000" },
  { so_tien: 100000, nhan: "100.000" },
  { so_tien: 200000, nhan: "200.000" },
  { so_tien: 500000, nhan: "500.000" },
  { so_tien: 1000000, nhan: "1.000.000" },
  { so_tien: 2000000, nhan: "2.000.000" },
];

// US13 - Nạp tiền vào ví: BE-first (POST /api/so-du/nap-tien),
// BE tắt tự rơi về lưu cục bộ, giao dịch nào cũng có lịch sử.
export default function NapSoDu() {
  const session = getSession();

  const [vi, setVi] = useState(() => getWallet());
  const [so_tien, setSoTien] = useState("");
  const [mo_ta, setMoTa] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  // Mở trang: khớp ví thật từ BE (nếu BE chạy) vào cache + số dư
  useEffect(() => {
    dongBoViTuBe()
      .then(() => setVi(getWallet()))
      .catch(() => {});
  }, []);

  const lamMoiVi = useCallback(() => setVi(getWallet()), []);

  const nhapNhanh = (gia_tri) => {
    setSoTien(String(gia_tri));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (dang_gui) return;

    const amount = Number(so_tien);

    if (!amount || amount <= 0) {
      tb.loi("Vui lòng nhập số tiền cần nạp.");
      return;
    }

    if (!Number.isInteger(amount)) {
      tb.loi("Số tiền phải là số nguyên (VND).");
      return;
    }

    setDangGui(true);

    try {
      const ket_qua = await napTien({
        soTien: amount,
        moTa: mo_ta,
      });

      if (!ket_qua.thanhCong) {
        tb.loi(ket_qua.loi);
        return;
      }

      tb.thanhCong(
        ket_qua.tu_be
          ? `Nạp ${VND.format(amount)} vào ví thành công!`
          : `Nạp thành công (lưu tạm trình duyệt)! Số tiền sẽ được đồng bộ khi BE kết nối.`
      );

      setSoTien("");
      setMoTa("");
      lamMoiVi();
    } catch (error) {
      // Lỗi bất ngờ không lọt qua napTien (mismatch dữ liệu...) — phải hiện ra
      // để người dùng biết, không im lặng trên nút "Đang xử lý...".
      tb.loi(
        error?.message === LOI_KHONG_KET_NOI
          ? "Không kết nối được hệ thống BE. Đang kiểm tra..."
          : `Nạp tiền thất bại: ${error?.message || "lỗi không xác định"}`
      );
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {/* Banner ví: số dư hiện tại */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Ví của @{session?.ten_tk || "bạn"}
            </p>
            <p className="mt-2 font-inknut text-4xl font-extrabold text-amber-300">
              {VND.format(vi.soDu || 0)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Số dư khả dụng · {vi.tu_be ? "đồng bộ từ hệ thống" : "dữ liệu cục bộ"}
            </p>
          </div>
        </div>

        {/* Form nạp tiền */}
        <form
          className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <h1 className="font-inknut text-2xl font-extrabold text-gray-900">
            Nạp số dư
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Số tiền tối thiểu 10.000 VNĐ. Tiền nạp dùng cho Góp vốn / Quyên góp
            (US13, US14).
          </p>

          {/* Mức nạp nhanh */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {MUC_NHANH.map((muc) => (
              <button
                type="button"
                key={muc.so_tien}
                onClick={() => nhapNhanh(muc.so_tien)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${
                  Number(so_tien) === muc.so_tien
                    ? "border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-200"
                    : "border-gray-200 bg-slate-50 text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                {muc.nhan}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label
              className="mb-1.5 block text-sm font-semibold text-gray-700"
              htmlFor="so_tien"
            >
              Số tiền (VND)
            </label>
            <input
              id="so_tien"
              type="number"
              min="10000"
              step="1000"
              placeholder="Ví dụ: 500000"
              value={so_tien}
              onChange={(e) => setSoTien(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="mt-4">
            <label
              className="mb-1.5 block text-sm font-semibold text-gray-700"
              htmlFor="mo_ta"
            >
              Ghi chú (tùy chọn)
            </label>
            <input
              id="mo_ta"
              type="text"
              maxLength={200}
              placeholder="Ví dụ: Nạp tiền chuẩn bị góp vốn cho dự án..."
              value={mo_ta}
              onChange={(e) => setMoTa(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full">
            {dang_gui ? "Đang xử lý..." : "💳 Nạp tiền"}
          </Button>
        </form>

        {/* Liên kết phụ */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 pb-8 text-sm">
          <Link
            to="/lich-su-so-du"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            📜 Lịch sử số dư
          </Link>

          <Link
            to="/thong-tin-ca-nhan"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            Thông tin cá nhân
          </Link>
        </div>
      </main>

      <FooterTrangChu />
    </div>
  );
}
