import { useState } from 'react';
import Button from '../Button/Button';
import { layTieuDe } from '../../services/contributionService';

// Email nhóm ghi trong trang chủ (footer) — nơi nhà đầu tư liên hệ trực tiếp.
const EMAIL_NHOM = 'nhom14@risingidea.vn';

// Modal hướng dẫn liên hệ cho bài loại "Đầu Tư".
// Theo quy định của nhóm: đầu tư KHÔNG nhận vốn qua hệ thống — nhà đầu tư
// tự liên hệ trực tiếp qua email để trao đổi chi tiết.
function LienHeDauTu({ post, onClose }) {
  const [daSaoChep, setDaSaoChep] = useState(false);

  async function handleSaoChep() {
    try {
      await navigator.clipboard.writeText(EMAIL_NHOM);
      setDaSaoChep(true);
      setTimeout(() => setDaSaoChep(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard — người dùng tự nhìn email để copy.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Liên hệ đầu tư"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh tiêu đề */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Đầu tư cho dự án
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

        {/* Nội dung hướng dẫn */}
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
          <span aria-hidden="true" className="text-xl">🤝</span>
          <p>
            Bài đăng loại <span className="font-semibold">"Đầu Tư"</span> không
            nhận vốn qua hệ thống. Mời nhà đầu tư liên hệ
            <span className="font-semibold"> trực tiếp với nhóm Rising Idea</span> qua
            email bên dưới — nhóm sẽ phản hồi và trao đổi chi tiết về hợp đồng
            cổ phần cùng bạn.
          </p>
        </div>

        {/* Ô email + nút sao chép */}
        <label className="mt-4 block text-sm font-semibold text-gray-800">
          Email liên hệ
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5">
          <span className="flex-1 truncate font-mono text-sm font-semibold text-gray-900">
            {EMAIL_NHOM}
          </span>
          <Button variant="outline" size="sm" onClick={handleSaoChep}>
            {daSaoChep ? '✅ Đã sao chép' : 'Sao chép'}
          </Button>
        </div>

        {/* Nút hành động */}
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Đóng
          </Button>
          <Button
            as="a"
            href={`mailto:${EMAIL_NHOM}?subject=${encodeURIComponent(
              `Đầu tư dự án: ${layTieuDe(post)}`
            )}`}
            className="flex-1"
          >
            📧 Soạn email
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LienHeDauTu;
