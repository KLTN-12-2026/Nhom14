// Hiển thị thông báo toàn cục của Rising Idea — gắn MỘT LẦN trong App.jsx.
// Gồm 2 phần:
//   1. Toast góc phải trên: slide-in, icon gradient theo loại, thanh đếm ngược,
//      nút đóng tay. Thay alert() mặc định của trình duyệt.
//   2. Modal xác nhận giữa màn: nền mờ backdrop-blur, icon lớn theo loại,
//      2 nút hành động. Thay confirm() mặc định của trình duyệt.

import { useEffect, useState } from 'react';
import {
  dangKyToast,
  dangKyXacNhan,
  huyToast,
  traLoiXacNhan,
} from '../../services/thongBaoService';

// Cấu hình màu/giọng từng loại: khớp hệ thiết kế của dự án
const CAU_HINH_TYPES = {
  thanhCong: {
    icon: '✓',
    tieuDe: 'Thành công',
    bieuTuong: 'bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white',
    bien: 'border-emerald-300',
    thanh: 'bg-emerald-500',
  },
  loi: {
    icon: '✕',
    tieuDe: 'có lỗi',
    bieuTuong: 'bg-gradient-to-tr from-rose-500 to-rose-600 text-white',
    bien: 'border-rose-300',
    thanh: 'bg-rose-500',
  },
  canhBao: {
    icon: '!',
    tieuDe: 'Cảnh báo',
    bieuTuong: 'bg-gradient-to-tr from-amber-400 to-amber-500 text-gray-900',
    bien: 'border-amber-300',
    thanh: 'bg-amber-400',
  },
  thongTin: {
    icon: 'i',
    tieuDe: 'Thông tin',
    bieuTuong: 'bg-gradient-to-tr from-violet-500 to-violet-600 text-white',
    bien: 'border-violet-300',
    thanh: 'bg-violet-500',
  },
  // Vòng hỏi nguy hiểm dùng chung kiểu ảnh màu lỗi
  danger: {
    icon: '?',
    tieuDe: 'Xác nhận',
    bieuTuong: 'bg-gradient-to-tr from-rose-500 to-rose-600 text-white',
    bien: 'border-rose-300',
    thanh: 'bg-rose-500',
  },
  primary: {
    icon: '?',
    tieuDe: 'Xác nhận',
    bieuTuong: 'bg-gradient-to-tr from-amber-400 to-amber-500 text-gray-900',
    bien: 'border-amber-300',
    thanh: 'bg-amber-400',
  },
};

// Toast: một hàng thông báo
function Toast({ toast }) {
  const cauHinh = CAU_HINH_TYPES[toast.loai] || CAU_HINH_TYPES.thongTin;
  const [dong, setDong] = useState(false);

  const gong = () => {
    setDong(true); // chạy animation rời màn rồi mới gỡ khỏi store
    setTimeout(() => huyToast(toast.id), 220);
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto relative flex w-80 items-start gap-3 overflow-hidden rounded-2xl border bg-white p-4 shadow-2xl shadow-slate-950/10 ring-4 ring-white/60 transition-all duration-200 ${cauHinh.bien} ${
        dong ? 'opacity-0 translate-x-6' : 'tb-vao'
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-black shadow-md ${cauHinh.bieuTuong}`}
        aria-hidden="true"
      >
        {cauHinh.icon}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {cauHinh.tieuDe}
        </p>
        <p className="mt-0.5 break-words text-sm font-semibold leading-5 text-gray-800">
          {toast.noiDung}
        </p>
      </div>

      <button
        type="button"
        onClick={gong}
        aria-label="Đóng thông báo"
        className="mt-0.5 shrink-0 rounded-full px-1.5 text-gray-300 transition hover:bg-gray-100 hover:text-gray-600"
      >
        ✕
      </button>

      {/* Thanh đếm ngược thời gian tự ẩn */}
      {toast.thoiGian > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 w-full origin-left opacity-70 ${cauHinh.thanh}`}
          style={{ animation: `tb-dem-nguoc ${toast.thoiGian}ms linear forwards` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Modal xác nhận: thay window.confirm
function HopXacNhan({ hoiThoai }) {
  const cauHinh = CAU_HINH_TYPES[hoiThoai.netLoai] || CAU_HINH_TYPES.danger;
  const nutXacNhan =
    hoiThoai.netLoai === 'primary'
      ? 'bg-amber-400 text-gray-900 shadow-md shadow-amber-500/30 hover:bg-amber-300'
      : 'bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:bg-rose-600';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm tb-hien-nu">
      <div
        role="dialog"
        aria-modal="true"
        className="tb-vao w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-2xl"
      >
        {/* Icon lớn theo loại */}
        <span
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl font-black shadow-lg ring-4 ring-white ${cauHinh.bieuTuong}`}
          aria-hidden="true"
        >
          {cauHinh.icon}
        </span>

        <h2 className="mt-5 font-inknut text-xl font-extrabold text-gray-900">
          {hoiThoai.tieuDe}
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          {hoiThoai.noiDung}
        </p>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={() => traLoiXacNhan(false)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
          >
            {hoiThoai.nhanHuy}
          </button>
          <button
            type="button"
            onClick={() => traLoiXacNhan(true)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${nutXacNhan}`}
          >
            {hoiThoai.nhanXacNhan}
          </button>
        </div>
      </div>
    </div>
  );
}

// Cần gắn 1 lần trong App: <ToanCanhThongBao />
export default function ToanCanhThongBao() {
  const [toasts, setToasts] = useState([]);
  const [hoiThoai, setHoiThoai] = useState(null);

  useEffect(() => {
    const baiToast = dangKyToast(setToasts);
    const baiXacNhan = dangKyXacNhan(setHoiThoai);
    return () => {
      baiToast();
      baiXacNhan();
    };
  }, []);

  return (
    <>
      {/* Kiểu animation riêng của hệ thống (không thuộc tailwind) */}
      <style>{`
        @keyframes tb-vao { from { opacity: 0; transform: translateX(24px) scale(.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes tb-hien { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes tb-hien-nu { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tb-dem-nguoc { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .tb-vao { animation: tb-vao .25s ease both; }
        .tb-hien { animation: tb-hien .2s ease both; }
        .tb-hien-nu { animation: tb-hien-nu .2s ease both; }
        .tb-dem-nguoc { animation-name: tb-dem-nguoc; }
      `}</style>

      {/* Chồng toast: góc phải trên, luôn trên mọi nội dung trang */}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col items-end gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      {hoiThoai && <HopXacNhan hoiThoai={hoiThoai} />}
    </>
  );
}
