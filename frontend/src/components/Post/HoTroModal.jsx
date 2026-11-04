import { useState } from "react";
import Button from "../Button/Button";
import { getTypeOption } from "../../data/mockPosts";
import { thanhToan } from "../../services/walletService";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const SO_TIEN_TOI_THIEU = 10000;

const SO_TIEN_NHANH = [50000, 100000, 200000, 500000];

// Modal hỗ trợ dự án 3 bước: nhập tiền → xác nhận → hoàn tất.
// Dùng chung cho Góp vốn (US13) và Quyên góp (US14) — bản FE thanh toán qua ví.
// Khi backend có API, thay lời gọi thanhToan() bằng lời gọi API.
function HoTroModal({ post, soDu, onClose, onSuccess }) {
  const [step, setStep] = useState("nhap");
  const [soTien, setSoTien] = useState("");
  const [phuongThuc, setPhuongThuc] = useState("vi");
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState(null);

  const nhan = getTypeOption(post.type).actionLabel;
  const soTienNumber = Number(soTien);

  const handleTiepTuc = () => {
    if (!soTien || !Number.isFinite(soTienNumber) || soTienNumber <= 0) {
      setLoi("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    if (!Number.isInteger(soTienNumber)) {
      setLoi("Số tiền phải là số nguyên, không có phần thập phân.");
      return;
    }

    if (soTienNumber < SO_TIEN_TOI_THIEU) {
      setLoi(`Số tiền tối thiểu là ${VND.format(SO_TIEN_TOI_THIEU)}.`);
      return;
    }

    if (soTienNumber > soDu) {
      setLoi("Số dư tài khoản không đủ. Vui lòng nhập số tiền nhỏ hơn.");
      return;
    }

    setLoi("");
    setStep("xac-nhan");
  };

  const handleXacNhan = () => {
    const ketQuaGiaoDich = thanhToan({
      postId: post.id,
      postTitle: post.title,
      soTien: soTienNumber,
      loaiGiaoDich: nhan,
    });

    if (!ketQuaGiaoDich.thanhCong) {
      setLoi(ketQuaGiaoDich.loi);
      setStep("nhap");
      return;
    }

    setKetQua(ketQuaGiaoDich);
    // Báo về trang chi tiết để cập nhật số dư và tiến độ huy động ngay.
    onSuccess(ketQuaGiaoDich.soDuMoi, ketQuaGiaoDich.giaoDich.soTien);
    setStep("thanh-cong");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${nhan} cho dự án`}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh tiêu đề của modal */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {nhan} cho dự án
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-gray-500">
              {post.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-1 text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Bước 1: Nhập số tiền + chọn phương thức */}
        {step === "nhap" && (
          <div className="mt-5">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm text-gray-700">
              Số dư khả dụng:{" "}
              <span className="font-bold text-yellow-800">
                {VND.format(soDu)}
              </span>
            </div>

            <label
              htmlFor="soTien"
              className="mt-4 block text-sm font-semibold text-gray-800"
            >
              Số tiền {nhan.toLowerCase()} (VNĐ)
            </label>
            <input
              id="soTien"
              name="soTien"
              type="number"
              min={SO_TIEN_TOI_THIEU}
              placeholder="Ví dụ: 100000"
              value={soTien}
              onChange={(e) => {
                setSoTien(e.target.value);
                setLoi("");
              }}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />

            <div className="mt-3 grid grid-cols-4 gap-2">
              {SO_TIEN_NHANH.map((giaTri) => (
                <Button
                  key={giaTri}
                  variant={Number(soTien) === giaTri ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSoTien(String(giaTri));
                    setLoi("");
                  }}
                >
                  {giaTri / 1000}K
                </Button>
              ))}
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-800">
              Phương thức thanh toán
            </p>
            <div className="mt-2 space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                  phuongThuc === "vi"
                    ? "border-yellow-500 bg-yellow-50 font-semibold text-gray-900"
                    : "border-gray-200 text-gray-700 hover:border-yellow-400"
                }`}
              >
                <input
                  type="radio"
                  name="phuongThuc"
                  value="vi"
                  checked={phuongThuc === "vi"}
                  onChange={() => setPhuongThuc("vi")}
                  className="accent-yellow-500"
                />
                💰 Số dư tài khoản (Ví Rising Idea)
              </label>

              <label className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 opacity-70">
                <input type="radio" name="phuongThuc" disabled className="accent-yellow-500" />
                🏦 Thẻ ngân hàng / QR (sắp ra mắt)
              </label>
            </div>

            {loi && (
              <p className="mt-3 text-sm font-semibold text-red-600" role="status">
                {loi}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Đóng
              </Button>
              <Button className="flex-1" onClick={handleTiepTuc}>
                Tiếp tục
              </Button>
            </div>
          </div>
        )}

        {/* Bước 2: Xác nhận thông tin giao dịch */}
        {step === "xac-nhan" && (
          <div className="mt-5">
            <h4 className="text-base font-bold text-gray-900">
              Xác nhận giao dịch
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              Vui lòng kiểm tra kỹ thông tin trước khi thanh toán.
            </p>

            <dl className="mt-4 space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-gray-500">Dự án</dt>
                <dd className="line-clamp-2 text-right font-semibold text-gray-800">
                  {post.title}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Hình thức</dt>
                <dd className="font-semibold text-gray-800">{nhan}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Số tiền</dt>
                <dd className="text-base font-bold text-gray-900">
                  {VND.format(soTienNumber)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Phương thức</dt>
                <dd className="text-right font-semibold text-gray-800">
                  Ví Rising Idea
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-2.5">
                <dt className="text-gray-500">Số dư trước</dt>
                <dd className="font-semibold text-gray-800">
                  {VND.format(soDu)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Số dư sau</dt>
                <dd className="font-bold text-yellow-700">
                  {VND.format(soDu - soTienNumber)}
                </dd>
              </div>
            </dl>

            {loi && (
              <p className="mt-3 text-sm font-semibold text-red-600" role="status">
                {loi}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("nhap")}
              >
                ← Quay lại
              </Button>
              <Button className="flex-1" onClick={handleXacNhan}>
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        )}

        {/* Bước 3: Giao dịch thành công */}
        {step === "thanh-cong" && ketQua && (
          <div className="mt-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✅
            </div>
            <h4 className="mt-3 text-lg font-bold text-gray-900">
              {nhan} thành công!
            </h4>
            <p className="mt-1 text-sm text-gray-600">
              Cảm ơn bạn đã đồng hành cùng dự án này.
            </p>

            <dl className="mt-4 space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Mã giao dịch</dt>
                <dd className="font-mono font-bold text-gray-900">
                  {ketQua.giaoDich.ma}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Số tiền</dt>
                <dd className="font-semibold text-gray-800">
                  {VND.format(ketQua.giaoDich.soTien)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-2.5">
                <dt className="text-gray-500">Số dư còn lại</dt>
                <dd className="font-bold text-yellow-700">
                  {VND.format(ketQua.soDuMoi)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Giao dịch đã được ghi vào lịch sử số dư của bạn (xem tại trang
              Thông tin cá nhân khi tính năng lịch sử ra mắt).
            </p>

            <Button className="mt-4 w-full" onClick={onClose}>
              Hoàn tất
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HoTroModal;
