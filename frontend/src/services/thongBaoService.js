// Hệ thống thông báo toàn cục của Rising Idea — thay alert()/confirm()
// mặc định của trình duyệt bằng toast + modal xác nhận theo hệ thiết kế.
//
// Cách dùng (không cần connect context, gọi từ bất cứ đâu):
//   import { tb } from '.../services/thongBaoService';
//   tb.thanhCong('Tạo bài đăng thành công!');
//   tb.loi('Mật khẩu không đúng.');
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

// ---- API rút gọn cho các trang ----
export const tb = {
  thanhCong: (noiDung, thoiGian) => datToast('thanhCong', noiDung, thoiGian),
  loi: (noiDung, thoiGian = 6000) => datToast('loi', noiDung, thoiGian),
  canhBao: (noiDung, thoiGian) => datToast('canhBao', noiDung, thoiGian),
  thongTin: (noiDung, thoiGian) => datToast('thongTin', noiDung, thoiGian),
  xacNhan,
};
