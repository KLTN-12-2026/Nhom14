
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import FooterTrangChu from "../../components/Home/FooterTrangChu";
import Button from "../../components/Button/Button";
import { tb } from "../../services/thongBaoService";
import { themThongBao } from "../../services/chuongService";
import {
  getWallet,
  napTien,
  huyYeuCauNapTien,
  layCauHinhNap,
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

// Mẫu VietQR mặc định (BE có thể ghi đè qua VIETQR_MAU trong .env).
const MAU_QR_MAC_DINH =
  "https://img.vietqr.io/image/{ngan_hang}-{so_tai_khoan}-compact2.png" +
  "?amount={so_tien}&addInfo={noi_dung}&accountName={chu_tai_khoan}";

// Dựng link ảnh QR:
//  - Đã cấu hình ngân hàng -> VietQR thật (quét là ra đúng tài khoản + số
//    tiền + nội dung chuyển khoản là mã giao dịch).
//  - Chưa cấu hình -> QR demo chứa nội dung chuyển khoản (không phải QR
//    ngân hàng thật) để vẫn demo được luồng.
function taoLinkQR(cauHinh, { soTien, noiDung }) {
  if (!cauHinh?.da_cau_hinh) {
    const noiDungDemo = `RISING-IDEA | ${noiDung} | ${new Intl.NumberFormat(
      "vi-VN"
    ).format(soTien)} VND`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
      noiDungDemo
    )}`;
  }

  return (cauHinh.mau_qr || MAU_QR_MAC_DINH)
    .replaceAll("{ngan_hang}", encodeURIComponent(cauHinh.ngan_hang || ""))
    .replaceAll(
      "{so_tai_khoan}",
      encodeURIComponent(cauHinh.so_tai_khoan || "")
    )
    .replaceAll(
      "{chu_tai_khoan}",
      encodeURIComponent(cauHinh.chu_tai_khoan || "")
    )
    .replaceAll("{so_tien}", String(soTien))
    .replaceAll("{noi_dung}", encodeURIComponent(noiDung));
}

// Một dòng thông tin chuyển khoản + nút sao chép nhanh
function DongThongTin({ nhan, gia_tri, onChep }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-xs font-semibold text-slate-500">{nhan}</span>

      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-right text-sm font-bold text-slate-900">
          {gia_tri}
        </span>
        <button
          type="button"
          onClick={() => onChep?.(gia_tri, nhan)}
          className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-amber-400 hover:text-amber-700"
        >
          Chép
        </button>
      </span>
    </div>
  );
}

// US13 - Nạp tiền qua QR ngân hàng:
//   1. Nhập số tiền -> tạo yêu cầu nạp (BE, trạng thái Chờ xử lý)
//   2. Quét QR chuyển khoản vào tài khoản admin, nội dung = mã giao dịch
//   3. Admin đối chiếu sao kê rồi duyệt -> tiền mới được cộng vào ví
export default function NapSoDu() {
  const session = getSession();

  const [vi, setVi] = useState(() => getWallet());
  const [cau_hinh, setCauHinh] = useState(null);
  const [so_tien, setSoTien] = useState("");
  const [mo_ta, setMoTa] = useState("");
  const [dang_gui, setDangGui] = useState(false);
  const [dang_huy, setDangHuy] = useState(false);
  const [dang_lam_moi, setDangLamMoi] = useState(false);
  const [yeu_cau, setYeuCau] = useState(null); // yêu cầu vừa tạo (đang hiện QR)
  const [qr_loi, setQrLoi] = useState(false);

  // Mở trang: khớp ví thật từ BE + tải cấu hình ngân hàng nhận tiền
  useEffect(() => {
    Promise.allSettled([
      dongBoViTuBe().then(() => setVi(getWallet())),
      layCauHinhNap().then((cauHinh) => setCauHinh(cauHinh)),
    ]);
  }, []);

  const lamMoiVi = useCallback(() => setVi(getWallet()), []);

  const cho_duyet = useMemo(
    () =>
      vi.giaoDich.filter(
        (g) =>
          g.loai_giao_dich === "Nap_Tien" && g.trang_thai === "Cho_Xu_Ly"
      ),
    [vi]
  );

  const nhapNhanh = (gia_tri) => {
    setSoTien(String(gia_tri));
  };

  async function chep(gia_tri, nhan) {
    try {
      await navigator.clipboard.writeText(String(gia_tri));
      tb.thanhCong(`Đã sao chép ${nhan}.`);
    } catch {
      tb.loi(`Không sao chép được ${nhan}. Vui lòng chép thủ công.`);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(so_tien);

    if (!amount || amount <= 0) {
      tb.loi("Vui lòng nhập số tiền cần nạp.");
      return;
    }

    if (!Number.isInteger(amount)) {
      tb.loi("Số tiền phải là số nguyên (VND).");
      return;
    }

    if (amount < 10000) {
      tb.loi("Số tiền tối thiểu là 10.000 VNĐ.");
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

      if (ket_qua.choDuyet) {
        // BE đã tạo yêu cầu Chờ xử lý -> hiện QR chuyển khoản
        setQrLoi(false);
        setYeuCau({
          id: ket_qua.giaoDich.id_giao_dich,
          ma: ket_qua.maGiaoDich,
          noi_dung: ket_qua.noiDungChuyenKhoan || ket_qua.maGiaoDich,
          so_tien: amount,
          tu_be: true,
        });
        lamMoiVi();

        tb.thanhCong(
          "Đã tạo yêu cầu nạp tiền. Quét QR và chuyển khoản để hoàn tất."
        );
        return;
      }

      // BE tắt: bản demo cộng tiền cục bộ như trước
      setSoTien("");
      setMoTa("");
      lamMoiVi();

      tb.thanhCong(
        `Nạp thành công (lưu tạm trình duyệt)! ${VND.format(
          amount
        )} sẽ đồng bộ khi BE kết nối.`
      );

      themThongBao({
        loai_thong_bao: "Vi",
        tieu_de: `Nạp ${VND.format(amount)} vào ví thành công`,
        noi_dung:
          "Giao dịch lưu tạm trên trình duyệt — sẽ đồng bộ vào database khi BE kết nối.",
        loai_doi_tuong: "so_du",
      });
    } catch (error) {
      tb.loi(
        error?.message === LOI_KHONG_KET_NOI
          ? "Không kết nối được hệ thống BE. Vui lòng thử lại."
          : `Nạp tiền thất bại: ${error?.message || "lỗi không xác định"}`
      );
    } finally {
      setDangGui(false);
    }
  }

  // Hủy yêu cầu khi chưa chuyển khoản
  async function handleHuyYeuCau() {
    if (!yeu_cau || dang_huy) return;

    setDangHuy(true);

    try {
      await huyYeuCauNapTien(yeu_cau.id);
      tb.thanhCong("Đã hủy yêu cầu nạp tiền.");
      setYeuCau(null);
      lamMoiVi();
    } catch (error) {
      tb.loi(error?.message || "Không hủy được yêu cầu nạp tiền.");
    } finally {
      setDangHuy(false);
    }
  }

  // Đã chuyển khoản: giữ yêu cầu ở trạng thái Chờ duyệt
  function handleDaChuyenKhoan() {
    setYeuCau(null);
    setSoTien("");
    setMoTa("");
    lamMoiVi();

    tb.thanhCong(
      "Đã ghi nhận chuyển khoản. Tiền sẽ vào ví sau khi quản trị viên duyệt."
    );
  }

  async function lamMoiTrangThai() {
    if (dang_lam_moi) return;

    setDangLamMoi(true);

    try {
      await dongBoViTuBe();
      setVi(getWallet());
      tb.thanhCong("Đã cập nhật trạng thái mới nhất.");
    } catch {
      tb.loi("Không kết nối được hệ thống. Vui lòng thử lại.");
    } finally {
      setDangLamMoi(false);
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
            <p className="mt-2 font-so text-4xl font-extrabold text-amber-300">
              {VND.format(vi.soDu || 0)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Số dư khả dụng ·{" "}
              {vi.tu_be ? "đồng bộ từ hệ thống" : "dữ liệu cục bộ"}
            </p>
          </div>
        </div>

        {/* Form tạo yêu cầu nạp tiền */}
        <form
          className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <h1 className="font-inknut text-2xl font-extrabold text-gray-900">
            Nạp số dư
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Số tiền tối thiểu 10.000 VNĐ. Bạn chuyển khoản vào tài khoản ngân
            hàng của hệ thống, quản trị viên đối chiếu rồi duyệt — tiền mới
            được cộng vào ví.
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

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={dang_gui}>
            {dang_gui ? "Đang tạo yêu cầu..." : "💳 Tạo mã QR chuyển khoản"}
          </Button>

          <p className="mt-3 text-center text-[11px] leading-4 text-gray-400">
            Tiền chỉ được cộng sau khi quản trị viên kiểm tra sao kê ngân hàng
            và bấm duyệt.
          </p>
        </form>

        {/* Các yêu cầu đang chờ duyệt */}
        {cho_duyet.length > 0 && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-inknut text-lg font-extrabold text-amber-900">
                  ⏳ Yêu cầu đang chờ duyệt
                </h2>
                <p className="text-sm text-amber-800/80">
                  Quản trị viên sẽ cộng tiền sau khi đối chiếu chuyển khoản.
                </p>
              </div>

              <button
                type="button"
                onClick={lamMoiTrangThai}
                disabled={dang_lam_moi}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dang_lam_moi ? "Đang kiểm tra..." : "🔄 Làm mới trạng thái"}
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {cho_duyet.map((g) => (
                <li
                  key={g.id_giao_dich}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {VND.format(g.so_tien)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mã: <b>{g.ma_giao_dich || "—"}</b> ·{" "}
                      {g.ngay_tao
                        ? new Date(g.ngay_tao).toLocaleString("vi-VN")
                        : "—"}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Chờ duyệt
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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

      {/* Modal QR chuyển khoản */}
      {yeu_cau && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            // Click ra ngoài chỉ ĐÓNG modal — KHÔNG huỷ yêu cầu nạp tiền.
            // Người dùng có thể mở lại QR từ lịch sử; muốn huỷ phải bấm
            // nút "Huỷ yêu cầu" bên trong modal.
            if (e.target === e.currentTarget && !dang_huy) {
              setYeuCau(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <h2 className="font-inknut text-xl font-extrabold text-gray-900">
              Quét QR để nạp tiền
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Mở app ngân hàng, quét mã và chuyển đúng số tiền. Giữ nguyên nội
              dung chuyển khoản để quản trị viên đối chiếu.
            </p>

            <p className="mt-4 rounded-xl bg-amber-50 py-2.5 font-so text-2xl font-extrabold text-amber-700 ring-1 ring-amber-200">
              {VND.format(yeu_cau.so_tien)}
            </p>

            {!cau_hinh?.da_cau_hinh && (
              <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-left text-xs font-semibold leading-5 text-amber-800">
                ⚠️ Chưa cấu hình tài khoản nhận tiền. Thêm{" "}
                <code>BANK_ID</code>, <code>BANK_ACCOUNT_NO</code>,{" "}
                <code>BANK_ACCOUNT_NAME</code> vào <code>backend/.env</code>{" "}
                rồi khởi động lại BE để dùng QR ngân hàng thật. QR bên dưới chỉ
                là bản demo.
              </p>
            )}

            {/* Mã QR — lỗi tải (mất mạng) thì ẩn ảnh, vẫn còn thông tin chữ */}
            {!qr_loi && (
              <img
                src={taoLinkQR(cau_hinh, {
                  soTien: yeu_cau.so_tien,
                  noiDung: yeu_cau.noi_dung,
                })}
                alt="Mã QR chuyển khoản nạp tiền"
                className="mx-auto mt-4 w-full max-w-[260px] rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
                onError={() => setQrLoi(true)}
              />
            )}

            {qr_loi && (
              <p className="mt-4 rounded-xl bg-slate-100 px-4 py-6 text-sm text-slate-600">
                Không tải được ảnh QR. Vui lòng chuyển khoản thủ công theo
                thông tin bên dưới.
              </p>
            )}

            {/* Thông tin chuyển khoản */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-left">
              {cau_hinh?.da_cau_hinh ? (
                <>
                  <DongThongTin
                    nhan="Ngân hàng"
                    gia_tri={cau_hinh.ngan_hang}
                    onChep={chep}
                  />
                  <DongThongTin
                    nhan="Số tài khoản"
                    gia_tri={cau_hinh.so_tai_khoan}
                    onChep={chep}
                  />
                  <DongThongTin
                    nhan="Chủ tài khoản"
                    gia_tri={cau_hinh.chu_tai_khoan}
                    onChep={chep}
                  />
                </>
              ) : (
                <DongThongTin
                  nhan="Tài khoản nhận"
                  gia_tri="Chưa cấu hình"
                  onChep={chep}
                />
              )}

              <DongThongTin
                nhan="Số tiền"
                gia_tri={new Intl.NumberFormat("vi-VN").format(
                  yeu_cau.so_tien
                )}
                onChep={chep}
              />
              <DongThongTin
                nhan="Nội dung CK"
                gia_tri={yeu_cau.noi_dung || yeu_cau.ma}
                onChep={chep}
              />
            </div>

            <p className="mt-3 text-[11px] leading-4 text-gray-400">
              Mã giao dịch: <b>{yeu_cau.ma}</b> · Yêu cầu sẽ chờ duyệt cho đến
              khi quản trị viên xác nhận đã nhận tiền.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleHuyYeuCau}
                disabled={dang_huy}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-rose-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dang_huy ? "Đang hủy..." : "Hủy yêu cầu"}
              </button>

              <button
                type="button"
                onClick={handleDaChuyenKhoan}
                disabled={dang_huy}
                className="flex-[1.3] rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✅ Tôi đã chuyển khoản
              </button>
            </div>
          </section>
        </div>
      )}

      <FooterTrangChu />
    </div>
  );
}
