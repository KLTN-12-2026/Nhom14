
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import FooterTrangChu from "../../components/Home/FooterTrangChu";
import PhanTrang from "../../components/Common/PhanTrang";
import {
  getWallet,
  dongBoViTuBe,
} from "../../services/walletService";
import { getSession } from "../../services/authService";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// Nhãn hiển thị + màu cho từng loại giao dịch (collection giao_dich)
const LOAI_GIAO_DICH = {
  Nap_Tien: { nhan: "Nạp tiền", tang: true },
  Gop_Von: { nhan: "Góp vốn", tang: false },
  Quyen_Gop: { nhan: "Quyên góp", tang: false },
  Hoan_Tra: { nhan: "Hoàn trả", tang: true },
};

const TRANG_THAI_NHAN = {
  Thanh_cong: "Thành công",
  That_bai: "Thất bại",
  Cho_Xu_Ly: "Chờ xử lý",
};

const SO_MOI_TRANG = 10;

// US16 - Lịch sử số dư: dòng giao dịch ví (nạp/góp/quyên), mới nhất trước.
// Dữ liệu ưu tiên cache BE (tải qua dongBoViTuBe); BE tắt đọc bản demo cục bộ.
export default function LichSuSoDu() {
  const session = getSession();

  const [vi, setVi] = useState(() => getWallet());
  const [trang, setTrang] = useState(1);

  useEffect(() => {
    dongBoViTuBe()
      .then(() => setVi(getWallet()))
      .catch(() => {});
  }, []);

  const giaoDich = vi.giaoDich;

  // Phân trang (mới nhất trước)
  const soTrang = Math.max(1, Math.ceil(giaoDich.length / SO_MOI_TRANG));
  const trangChot = Math.min(trang, soTrang);
  const giaoDichTrang = useMemo(
    () =>
      giaoDich.slice(
        (trangChot - 1) * SO_MOI_TRANG,
        trangChot * SO_MOI_TRANG
      ),
    [giaoDich, trangChot]
  );

  const thoiGian = (gia_tri) =>
    gia_tri ? new Date(gia_tri).toLocaleString("vi-VN") : "—";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        {/* Banner ví */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Lịch sử số dư · @{session?.ten_tk || "bạn"}
              </p>
              <p className="mt-2 font-inknut text-3xl font-extrabold text-amber-300">
                {VND.format(vi.soDu || 0)}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {giaoDich.length} giao dịch ·{" "}
                {vi.tu_be ? "đồng bộ từ hệ thống" : "dữ liệu cục bộ"}
              </p>
            </div>

            <Link
              to="/nap-so-du"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-gray-900 shadow-md transition hover:bg-amber-300"
            >
              💳 Nạp thêm tiền
            </Link>
          </div>
        </div>

        {/* Bảng lịch sử giao dịch */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-4">Thời điểm</th>
                <th className="p-4">Loại giao dịch</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {giaoDichTrang.map((g) => {
                const loai =
                  LOAI_GIAO_DICH[g.loai_giao_dich] ||
                  { nhan: g.loai_giao_dich, tang: false };

                return (
                  <tr
                    key={g.id_giao_dich}
                    className="border-t border-slate-100 transition hover:bg-amber-50/40"
                  >
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {thoiGian(g.ngay_tao)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          loai.tang
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-violet-100 text-violet-800"
                        }`}
                      >
                        {loai.nhan}
                      </span>
                    </td>
                    <td
                      className={`p-4 font-bold ${
                        loai.tang ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {loai.tang ? "+" : "−"}
                      {VND.format(g.so_tien)}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {TRANG_THAI_NHAN[g.trang_thai] || g.trang_thai}
                      </span>
                    </td>
                    <td className="max-w-[280px] p-4 text-slate-600">
                      {g.mo_ta || "—"}
                    </td>
                  </tr>
                );
              })}

              {!giaoDichTrang.length && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500">
                    Chưa có giao dịch nào.
                    {vi.tu_be
                      ? ""
                      : " Nạp tiền thử tại trang Nạp số dư — khi BE chạy, dữ liệu sẽ tự đồng bộ."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!giaoDich.length && (
          <div className="mt-6 text-center">
            <Link
              to="/nap-so-du"
              className="inline-block rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-gray-900 shadow-md transition hover:bg-amber-300"
            >
              Nạp tiền đầu tiên
            </Link>
          </div>
        )}

        <PhanTrang trang={trangChot} soTrang={soTrang} onDoiTrang={setTrang} />

        <p className="mt-4 text-center text-xs text-slate-500">
          Mỗi giao dịch ghi vào collection giao_dich kèm biến động số dư
          (bien_dong_so_du) — nạp tiền theo US13, chi tiêu theo US13/US14.
        </p>
      </main>

      <FooterTrangChu />
    </div>
  );
}
