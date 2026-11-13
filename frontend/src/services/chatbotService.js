// Trợ lý AI Rising Bot — BE-first qua /api/chatbot, fallback demo cục bộ.
//
// Schema đúng tài liệu DB:
//   cuoc_hoi_thoai: _id, id_nguoi_dung, tieu_de, ngay_tao, ngay_cap_nhat
//   tin_nhan_chatbot: _id, id_cuoc_hoi_thoai, loai_nguoi_gui,
//                     noi_dung, ngay_tao

import { goiApi, LOI_KHONG_KET_NOI } from './apiClient';

// ---- Hội thoại ----

export async function layDanhSachHoiThoai() {
  const danh_sach = await goiApi('/api/chatbot/hoi-thoai');
  return Array.isArray(danh_sach) ? danh_sach : [];
}

export async function taoHoiThoai() {
  return goiApi('/api/chatbot/hoi-thoai', { method: 'POST' });
}

export async function layTinNhan(id_hoi_thoai) {
  return goiApi(
    `/api/chatbot/hoi-thoai/${encodeURIComponent(id_hoi_thoai)}/tin-nhan`
  );
}

// Gửi tin + nhận trả lời AI. BE luôn trả 200 (AI sự cố -> tin_chatbot
// mang lời xin lỗi + canh_bao). BE tắt -> fallback demo cục bộ.
export async function guiTin(noi_dung, id_hoi_thoai) {
  try {
    return await goiApi('/api/chatbot/tin-nhan', {
      method: 'POST',
      body: { id_hoi_thoai: id_hoi_thoai || null, noi_dung },
    });
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) throw error;
    return tra_loi_demo(noi_dung, id_hoi_thoai);
  }
}

// ---- Fallback demo khi BE tắt: trả lời cục bộ theo từ khóa ----

function tra_loi_demo(noi_dung, id_hoi_thoai) {
  const tin = noi_dung.trim().toLowerCase();

  let tra_loi;
  if (/chào|hello|hi\b/.test(tin)) {
    tra_loi =
      'Xin chào! Mình là Rising Bot 🤖 — có thể giúp gì cho bạn về nền tảng Rising Idea?';
  } else if (/đăng|tạo.*bài|dự án/.test(tin)) {
    tra_loi =
      'Để đăng dự án, bạn vào "Bài đăng" → Tạo bài → chọn loại hình (Gọi Vốn / Quyên Góp / Đầu Tư), điền mục tiêu và thời hạn. Bài sẽ được quản trị viên duyệt trước khi hiển thị nhé! 📝';
  } else if (/nạp|tiền|ví/.test(tin)) {
    tra_loi =
      'Bạn vào trang "Nạp số dư" để nạp tiền vào ví, rồi dùng ví ủng hộ các dự án bạn thích 💳';
  } else if (/góp|ủng hộ|quyên|đầu tư/.test(tin)) {
    tra_loi =
      'Vào bài đăng đang diễn ra → nhấn "Ủng hộ" → chọn số tiền trong ví. Tiến độ gây vốn của dự án sẽ cập nhật ngay 🎯';
  } else if (/tố cáo|báo cáo|vi phạm/.test(tin)) {
    tra_loi =
      'Nếu thấy bài đăng vi phạm, mở bài đó → "Báo cáo" → chọn lý do. Quản trị viên sẽ kiểm tra và có thể ẩn bài 🚩';
  } else if (/quên mật khẩu|mật khẩu/.test(tin)) {
    tra_loi =
      'Quên mật khẩu? Vào trang "Quên mật khẩu", nhập email đăng ký — mã 6 số sẽ được gửi qua Gmail, hiệu lực 10 phút 🔐';
  } else {
    tra_loi =
      'Mình có thể giúp bạn về: đăng bài, nạp tiền ví, ủng hộ dự án, tố cáo vi phạm hay khôi phục mật khẩu. Bạn đang thắc mắc điều gì? 🤖';
  }

  const now = new Date().toISOString();

  return {
    id_hoi_thoai: id_hoi_thoai || null,
    tieu_de: (noi_dung || 'Hội thoại mới').trim().slice(0, 60),
    tin_nguoi_dung: {
      id: `CN-${Date.now()}`,
      loai_nguoi_gui: 'Nguoi_Dung',
      noi_dung: noi_dung.trim(),
      ngay_tao: now,
    },
    tin_chatbot: {
      id: `CB-${Date.now()}`,
      loai_nguoi_gui: 'Chatbot',
      noi_dung: tra_loi,
      ngay_tao: now,
    },
    tu_be: false,
  };
}
