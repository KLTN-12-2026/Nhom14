import { useState } from "react";
import Button from "../Button/Button";
import { thanhToan } from "../../services/walletService";
import {
  ghiNhanGop,
  layLoaiInfo,
  layMaBaiDang,
  layMucTieu,
  layTieuDe,
} from "../../services/contributionService";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const SO_TIEN_TOI_THIEU = 10000;

const SO_TIEN_NHANH = [50000, 100000, 200000, 500000];

// Thông điệp cảm ơn riêng cho từng loại bài đăng.
const LOI_CAM_ON_THEO_LOAI = {
  donation:
    "Cảm ơn tấm lòng của bạn! Số tiền quyên góp sẽ được chủ dự án công khai minh bạch.",
  crowdfund:
    "Khoản góp vốn của bạn đã được ghi nhận và cùng dự án hướng tới mục tiêu chờ phía trước.",
  invest:
    "Đề nghị đầu tư của bạn đã được ghi nhận. Nhóm dự án sẽ liên hệ để trao đổi chi tiết về quyền lợi.",
};

// Modal hỗ trợ dự án 3 bước: nhập tiền → xác nhận → hoàn tất.
// Dùng chung ba loại bài đăng với trường riêng theo loại:
//   - Quyên góp: lời nhắn + tùy chọn ẩn danh.
//   - Góp vốn: tỷ lệ phần quỹ dự kiến + xác nhận cam kết góp vốn.
//   - Đầu tư: tỷ lệ cổ phần dự kiến + xác nhận hiểu rủi ro đầu tư.
// Nhận bài đăng từ bất kỳ nguồn nào (demo hoặc người dùng tạo) qua
// các hàm chuẩn hóa trong contributionService.
function HoTroModal({ post, soDu, onClose, onSuccess }) {
  const [step, setStep] = useState("nhap");
  const [soTien, setSoTien] = useState("");
  const [phuongThuc, setPhuongThuc] = useState("vi");
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState(null);

  // Trường riêng theo loại bài đăng
  const [loiNhac, setLoiNhac] = useState("");
  const [anDanh, setAnDanh] = useState(false);
  const [daXacNhan, setDaXacNhan] = useState(false);

  const loaiInfo = layLoaiInfo(post);
  const loai = loaiInfo.value;
  const loaiLaDon = loai === "donation";
  const loaiLaGopVon = loai === "crowdfund";
  const nhan = loaiInfo.actionLabel;
  const mucTieu = layMucTieu(post);
  const soTienNumber = Number(soTien);

  // Tỷ lệ cổ phần / phần quỹ dự kiến = số tiền / mục tiêu vốn (ước tính).
  const soHuDanhGia =
    mucTieu > 0 && soTienNumber > 0
      ? Math.min((soTienNumber / mucTieu) * 100, 100)
      : null;

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

    // Góp vốn và đầu tư bắt buộc xác nhận điều khoản / rủi ro trước khi tiếp tục.
    if (!loaiLaDon && !daXacNhan) {
      setLoi("Vui lòng đọc và xác nhận nội dung trước khi tiếp tục.");
      return;
    }

    setLoi("");
    setStep("xac-nhan");
  };

  const handleXacNhan = () => {
    const ketQuaGiaoDich = thanhToan({
      postId: layMaBaiDang(post),
      postTitle: layTieuDe(post),
      soTien: soTienNumber,
      loaiGiaoDich: nhan,
    });

    if (!ketQuaGiaoDich.thanhCong) {
      setLoi(ketQuaGiaoDich.loi);
      setStep("nhap");
      return;
    }

    // Ghi danh sách người góp + cập nhật số tiền đã huy động của bài đăng.
    ghiNhanGop({
      post,
      soTien: soTienNumber,
      loai: nhan,
      loiNhac,
      anDanh: loaiLaDon ? anDanh : false,
      soHuPhanTram: !loaiLaDon && soHuDanhGia ? Number(soHuDanhGia.toFixed(1)) : null,
    });

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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh tiêu đề của modal */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {nhan} cho dự án
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-gray-500">
              {layTieuDe(post)}
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

        {/* Bước 1: Nhập số tiền + trường riêng theo loại + chọn phương thức */}
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
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ví dụ: 100000"
              value={soTien}
              onChange={(e) => {
                // Chỉ nhận chữ số — gõ số tự nhiên, không bị input type="number" cản.
                setSoTien(e.target.value.replace(/\D/g, ""));
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

            {/* Ước tính riêng cho góp vốn / đầu tư */}
            {!loaiLaDon && soHuDanhGia && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                {loaiLaGopVon ? "Phần quỹ dự kiến: " : "Tỷ lệ cổ phần dự kiến: "}
                <span className="font-bold text-yellow-800">
                  {soHuDanhGia.toFixed(1)}%
                </span>
                {" — ước tính trên mục tiêu "}
                {VND.format(mucTieu)}
                , chỉ để tham khảo.
              </div>
            )}

            {/* Lời nhắn riêng cho từng loại */}
            <label
              htmlFor="loiNhac"
              className="mt-4 block text-sm font-semibold text-gray-800"
            >
              {loaiLaDon
                ? "Lời nhắn gửi chủ dự án (tùy chọn)"
                : loaiLaGopVon
                  ? "Lời nhắn cho chủ dự án (tùy chọn)"
                  : "Nhắn cho nhóm dự án (tùy chọn)"}
            </label>
            <textarea
              id="loiNhac"
              name="loiNhac"
              rows={2}
              value={loiNhac}
              onChange={(e) => setLoiNhac(e.target.value)}
              placeholder={
                loaiLaDon
                  ? "Gửi lời động viên cho chủ dự án…"
                  : loaiLaGopVon
                    ? "Chào chủ dự án, tôi rất mong dự án sớm đạt mục tiêu…"
                    : "Chúng tôi có kinh nghiệm về phân phối, mong muốn hỗ trợ thêm…"
              }
              className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />

            {/* Tùy chọn ẩn danh cho quyên góp */}
            {loaiLaDon && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={anDanh}
                  onChange={(e) => setAnDanh(e.target.checked)}
                  className="accent-yellow-500"
                />
                Tham gia ẩn danh (tên của bạn không hiển thị trong danh sách)
              </label>
            )}

            {/* Bắt buộc xác nhận Điều khoản góp vốn hoặc rủi ro Đầu tư */}
            {!loaiLaDon && (
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={daXacNhan}
                  onChange={(e) => {
                    setDaXacNhan(e.target.checked);
                    setLoi("");
                  }}
                  className="mt-0.5 accent-yellow-500"
                />
                <span>
                  {loaiLaGopVon
                    ? "Tôi cam kết nguồn vốn góp của mình và đồng hành theo kế hoạch của chủ dự án."
                    : "Tôi đã đọc kỹ, hiểu rằng đầu tư luôn tiềm ẩn rủi ro và đồng ý tham gia theo thỏa thuận với chủ dự án."}
                </span>
              </label>
            )}

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
                  {layTieuDe(post)}
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

              {/* Thông tin hiển thị riêng theo loại bài đăng */}
              {!loaiLaDon && soHuDanhGia && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">
                    {loaiLaGopVon ? "Phần quỹ dự kiến" : "Cổ phần dự kiến"}
                  </dt>
                  <dd className="font-semibold text-gray-800">
                    {soHuDanhGia.toFixed(1)}%
                  </dd>
                </div>
              )}
              {loaiLaDon && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Ẩn danh</dt>
                  <dd className="font-semibold text-gray-800">
                    {anDanh ? "Đúng" : "Không"}
                  </dd>
                </div>
              )}
              {loiNhac.trim() && (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-gray-500">Lời nhắn</dt>
                  <dd className="line-clamp-2 text-right text-gray-700">
                    {loiNhac}
                  </dd>
                </div>
              )}

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
              {LOI_CAM_ON_THEO_LOAI[loai]}
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
              {loaiLaDon && anDanh && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Danh sách</dt>
                  <dd className="font-semibold text-gray-800">
                    Ghi nhận ẩn danh
                  </dd>
                </div>
              )}
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
