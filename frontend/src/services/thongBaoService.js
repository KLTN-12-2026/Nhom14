// Hệ thống thông báo toàn cục của Rising Idea — thay alert()/confirm()
// mặc định của trình duyệt bằng toast + modal xác nhận theo hệ thiết kế.
//
// Cách dùng (không cần connect context, gọi từ bất cứ đâu):
//   import { tb } from '.../services/thongBaoService';
//   tb.thanhCong('Tạo bài đăng thành công!');
//   tb.loi('Mật khẩu không đúng.');   // modal lỗi giữa màn (tự tắt + nút OK)
//   ...
//   if (await tb.xacNhan({ tieuDe: 'Xóa bài đăng?', noiDung: '...', netLoai: 'danger' })) { ... }
//
// Toàn bộ hiển thị do <ToanCanhThongBao /> đảm nhiệm (mount trong App.jsx).

// ---- Toast (góc phải trên) ----
let danhSachToast = [];
const dangKyToastList = [];
let soThuTu = 0;

function phatToast() {
  const ban = [...danhSachToast];
  dangKyToastList.forEach((fn) => fn(ban));
}

export function dangKyToast(fn) {
  dangKyToastList.push(fn);
  fn([...danhSachToast]);
  return () => {
    const viTri = dangKyToastList.indexOf(fn);
    if (viTri !== -1) dangKyToastList.splice(viTri, 1);
  };
}

export function datToast(loai, noiDung, thoiGian = 4500) {
  soThuTu += 1;
  const toast = { id: soThuTu, loai, noiDung, thoiGian };
  danhSachToast = [...danhSachToast, toast];

  if (thoiGian > 0) {
    setTimeout(() => huyToast(toast.id), thoiGian);
  }

  phatToast();
  return toast.id;
}

export function huyToast(id) {
  danhSachToast = danhSachToast.filter((item) => item.id !== id);
  phatToast();
}

// ---- Modal xác nhận (thay window.confirm) ----
let hoiThoaiXacNhan = null;
let dapAnChoXacNhan = null;
const dangKyXacNhanList = [];

function phatXacNhan() {
  dangKyXacNhanList.forEach((fn) => fn(hoiThoaiXacNhan));
}

export function dangKyXacNhan(fn) {
  dangKyXacNhanList.push(fn);
  fn(hoiThoaiXacNhan);
  return () => {
    const viTri = dangKyXacNhanList.indexOf(fn);
    if (viTri !== -1) dangKyXacNhanList.splice(viTri, 1);
  };
}

export function xacNhan({
  tieuDe = 'Xác nhận',
  noiDung = '',
  nhanXacNhan = 'Xác nhận',
  nhanHuy = 'Hủy',
  netLoai = 'danger', // 'danger' (nút đỏ) | 'primary' (nút vàng)
} = {}) {
  return new Promise((goiDau) => {
    // Hỏi mới nghĩa là hủy câu hỏi cũ (chỉ 1 modal cùng lúc)
    if (dapAnChoXacNhan) {
      dapAnChoXacNhan(false);
      dapAnChoXacNhan = null;
    }

    hoiThoaiXacNhan = { tieuDe, noiDung, nhanXacNhan, nhanHuy, netLoai };
    phatXacNhan();

    dapAnChoXacNhan = (dongY) => {
      hoiThoaiXacNhan = null;
      dapAnChoXacNhan = null;
      phatXacNhan();
      goiDau(Boolean(dongY));
    };
  });
}

export function traLoiXacNhan(dongY) {
  if (dapAnChoXacNhan) {
    dapAnChoXacNhan(dongY);
  }
}

// ---- Modal báo lỗi tự tắt (popup giữa màn, vài giây tự đóng + nút OK) ----
let danhSachLoiModal = [];
const dangKyLoiModalList = [];
let soThuTuLoiModal = 0;

function phatLoiModal() {
  const ban = [...danhSachLoiModal];
  dangKyLoiModalList.forEach((fn) => fn(ban));
}

export function dangKyLoiModal(fn) {
  dangKyLoiModalList.push(fn);
  fn([...danhSachLoiModal]);
  return () => {
    const viTri = dangKyLoiModalList.indexOf(fn);
    if (viTri !== -1) dangKyLoiModalList.splice(viTri, 1);
  };
}

export function datLoiModal(noiDung, thoiGian = 4000) {
  soThuTuLoiModal += 1;
  const modal = { id: soThuTuLoiModal, noiDung, thoiGian };
  danhSachLoiModal = [...danhSachLoiModal, modal];

  if (thoiGian > 0) {
    setTimeout(() => huyLoiModal(modal.id), thoiGian);
  }

  phatLoiModal();
  return modal.id;
}

export function huyLoiModal(id) {
  danhSachLoiModal = danhSachLoiModal.filter((item) => item.id !== id);
  phatLoiModal();
}

// ---- API rút gọn cho các trang ----
export const tb = {
  thanhCong: (noiDung, thoiGian) => datToast('thanhCong', noiDung, thoiGian),
  // LỖI = modal giữa màn: vài giây tự tắt + bấm OK tắt ngay. Dùng chung
  // cho mọi chức năng báo lỗi (đăng nhập, giải ngân, tố cáo...) thay toast
  // để người dùng không bỏ sót thông báo.
  loi: (noiDung, thoiGian = 4000) => datLoiModal(noiDung, thoiGian),
  // Tên gọi tường minh của tb.loi (cùng modal) — giữ để tương thích các
  // chỗ đã gọi sẵn.
  loiModal: (noiDung, thoiGian = 4000) => datLoiModal(noiDung, thoiGian),
  canhBao: (noiDung, thoiGian) => datToast('canhBao', noiDung, thoiGian),
  thongTin: (noiDung, thoiGian) => datToast('thongTin', noiDung, thoiGian),
  xacNhan,
};
