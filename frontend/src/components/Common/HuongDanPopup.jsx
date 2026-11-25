import { useEffect, useRef, useState } from "react";
import { getSession } from "../../services/authService";

const KHOA_CHO = "rising-idea-guide-pending";
const TEN_SU_KIEN = "rising-idea-guide";
const MOT_NGAY = 24 * 60 * 60 * 1000;

function khoaAn(tenTk) {
  return `rising-idea-guide-skip-until:${tenTk || "guest"}`;
}

function docHanAn(tenTk) {
  try {
    return Number(localStorage.getItem(khoaAn(tenTk)) || 0);
  } catch {
    return 0;
  }
}

function dangAn(tenTk) {
  return docHanAn(tenTk) > Date.now();
}

function datAnMotNgay(tenTk) {
  localStorage.setItem(khoaAn(tenTk), String(Date.now() + MOT_NGAY));
}

const MUC_HUONG_DAN = [
  {
    icon: "🔎",
    tieuDe: "Khám phá dự án",
    moTa: "Vào mục Bài đăng để xem các dự án Gọi vốn, Quyên góp, Đầu tư và đọc chi tiết trước khi ủng hộ.",
  },
  {
    icon: "📝",
    tieuDe: "Tạo bài đăng",
    moTa: "Chọn Tạo bài đăng, điền thông tin dự án và gửi chờ quản trị viên duyệt trước khi công khai.",
  },
  {
    icon: "💛",
    tieuDe: "Ủng hộ / Đầu tư",
    moTa: "Bài Gọi vốn, Quyên góp có thể ủng hộ trực tiếp. Bài Đầu tư cần liên hệ để bàn rõ chi tiết.",
  },
  {
    icon: "💳",
    tieuDe: "Ví và nạp tiền",
    moTa: "Vào Ví của tôi để nạp tiền bằng QR. Số dư chỉ cộng sau khi quản trị viên xác nhận chuyển khoản.",
  },
  {
    icon: "🤖",
    tieuDe: "Rising Bot AI",
    moTa: "Mở chatbot để hỏi về dự án. Bạn có thể gửi ảnh để AI đánh giá theo tình hình dự án đang xem.",
  },
];

export default function HuongDanPopup() {
  const dangMoRef = useRef(false);
  const [mo, setMo] = useState(false);
  const [khongHienMotNgay, setKhongHienMotNgay] = useState(false);

  useEffect(() => {
    function kiemTraHienPopup() {
      if (dangMoRef.current) return;

      const phien = getSession();
      const cho = sessionStorage.getItem(KHOA_CHO) === "1";
      if (!phien || !cho) return;

      if (dangAn(phien.ten_tk)) {
        sessionStorage.removeItem(KHOA_CHO);
        return;
      }

      setKhongHienMotNgay(false);
      dangMoRef.current = true;
      setMo(true);
    }

    // Kiểm tra sau tick để không gọi setState đồng bộ trong effect.
    const id = window.setTimeout(kiemTraHienPopup, 0);
    window.addEventListener(TEN_SU_KIEN, kiemTraHienPopup);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener(TEN_SU_KIEN, kiemTraHienPopup);
    };
  }, []);

  function dongPopup() {
    const phien = getSession();
    if (khongHienMotNgay && phien?.ten_tk) {
      datAnMotNgay(phien.ten_tk);
    }
    sessionStorage.removeItem(KHOA_CHO);
    dangMoRef.current = false;
    setMo(false);
  }

  if (!mo) return null;

  return (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dongPopup();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn sử dụng trang web"
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
              Chào mừng đến Rising Idea
            </p>
            <h2 className="mt-1 font-inknut text-xl font-extrabold text-gray-900 sm:text-2xl">
              Hướng dẫn nhanh
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Một vài gợi ý để bạn bắt đầu sử dụng trang web dễ dàng hơn.
            </p>
          </div>

          <button
            type="button"
            onClick={dongPopup}
            aria-label="Đóng hướng dẫn"
            className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {MUC_HUONG_DAN.map((muc) => (
            <div
              key={muc.tieuDe}
              className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  {muc.icon}
                </span>
                <p className="text-sm font-bold text-gray-900">{muc.tieuDe}</p>
              </div>
              <p className="mt-1 text-xs leading-5 text-gray-600">{muc.moTa}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={khongHienMotNgay}
              onChange={(e) => setKhongHienMotNgay(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            <span>Không hiển thị lại trong 1 ngày</span>
          </label>

          <button
            type="button"
            onClick={dongPopup}
            className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-gray-900 shadow-md shadow-amber-400/30 transition hover:bg-amber-300"
          >
            Đã hiểu
          </button>
        </div>
      </section>
    </div>
  );
}
