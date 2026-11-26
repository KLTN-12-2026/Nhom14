import { useEffect, useRef, useState } from "react";
import { getSession } from "../../services/authService";

// 6 ảnh hướng dẫn nằm trong src/assets — mỗi ảnh là 1 bước, có nút
// "Tiếp theo" để chuyển bước; bước cuối nút đổi thành "Bắt đầu".
import anhBaiDang from "../../assets/baidang_modal.png";
import anhBaiDangCuaToi from "../../assets/baidangcuatoi_modal.png";
import anhThongTinCaNhan from "../../assets/capnhatthongtincanhan_modal.png";
import anhViCuatoi from "../../assets/vicuatoi_modal.png";
import anhThongBao from "../../assets/thongbao_modal.png";
import anhTaiNguyen from "../../assets/tainguyen_modal.png";

const KHOA_CHO = "rising-idea-guide-pending";
const TEN_SU_KIEN = "rising-idea-guide";
const MOT_NGAY = 24 * 60 * 60 * 1000;

const CAC_BUOC = [
  {
    anh: anhBaiDang,
    tieuDe: "Khám phá bài đăng",
    moTa: "Vào Bài đăng để xem các dự án Gọi vốn, Quyên góp, Đầu tư và đọc chi tiết trước khi ủng hộ.",
  },
  {
    anh: anhBaiDangCuaToi,
    tieuDe: "Bài đăng của tôi",
    moTa: "Theo dõi, chỉnh sửa hoặc xoá các dự án bạn đã tạo ngay tại trang này.",
  },
  {
    anh: anhThongTinCaNhan,
    tieuDe: "Thông tin cá nhân",
    moTa: "Cập nhật họ tên, email, số điện thoại và đổi mật khẩu để bảo mật tài khoản.",
  },
  {
    anh: anhViCuatoi,
    tieuDe: "Ví của tôi",
    moTa: "Nạp tiền bằng QR, xem số dư và lịch sử biến động ví trước khi ủng hộ dự án.",
  },
  {
    anh: anhThongBao,
    tieuDe: "Thông báo",
    moTa: "Chuông thông báo cập nhật kết quả duyệt bài, giải ngân, hoàn trả và tin nhắn từ AI.",
  },
  {
    anh: anhTaiNguyen,
    tieuDe: "Tài nguyên & FAQ",
    moTa: "Mở mục Tài nguyên trên thanh điều hướng để xem FAQ và các hướng dẫn hữu ích khác.",
  },
];

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
  try {
    localStorage.setItem(khoaAn(tenTk), String(Date.now() + MOT_NGAY));
  } catch {
    // Private mode / localStorage bị chặn: bỏ qua, không làm hỏng đóng popup
  }
}

export default function HuongDanPopup() {
  const dangMoRef = useRef(false);
  const dongPopupRef = useRef(() => {});
  const [mo, setMo] = useState(false);
  const [buoc, setBuoc] = useState(0);
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
      // Không reset buoc: component không unmount khi đóng/mở lại nên giữ
      // nguyên bước đang xem trước đó cho người dùng tiếp tục.
      dangMoRef.current = true;
      setMo(true);
    }

    function dongKhiBamEsc(suKien) {
      if (suKien.key === 'Escape') dongPopupRef.current();
    }

    // Kiểm tra sau tick để không gọi setState đồng bộ trong effect.
    const id = window.setTimeout(kiemTraHienPopup, 0);
    window.addEventListener(TEN_SU_KIEN, kiemTraHienPopup);
    window.addEventListener('keydown', dongKhiBamEsc);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener(TEN_SU_KIEN, kiemTraHienPopup);
      window.removeEventListener('keydown', dongKhiBamEsc);
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

  // Giữ hàm đóng mới nhất cho listener Esc (effect chỉ chạy 1 lần lúc mount)
  useEffect(() => {
    dongPopupRef.current = dongPopup;
  });

  function tiep() {
    if (buoc < CAC_BUOC.length - 1) {
      setBuoc(buoc + 1);
    } else {
      dongPopup();
    }
  }

  function lui() {
    if (buoc > 0) setBuoc(buoc - 1);
  }

  if (!mo) return null;

  const buocHienTai = CAC_BUOC[buoc];
  const laBuocCuoi = buoc === CAC_BUOC.length - 1;

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
        className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        {/* Đầu modal */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:px-9">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
              Chào mừng đến Rising Idea
            </p>
            <h2 className="mt-1 font-inknut text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Hướng dẫn nhanh
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {buocHienTai.tieuDe} — chỉ vài bước để bạn bắt đầu quen thuộc.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {buoc + 1} / {CAC_BUOC.length}
            </span>
            <button
              type="button"
              onClick={dongPopup}
              aria-label="Đóng hướng dẫn"
              className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Ảnh hướng dẫn + chú thích */}
        <div className="px-6 py-6 sm:px-9">
          <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:min-h-[280px] sm:p-6">
            <img
              key={buoc}
              src={buocHienTai.anh}
              alt={buocHienTai.tieuDe}
              className="max-h-[250px] w-full object-contain sm:max-h-[320px]"
            />
          </div>

          <h3 className="mt-5 text-lg font-extrabold text-gray-900 sm:text-xl">
            {buocHienTai.tieuDe}
          </h3>
          <p className="mt-1.5 text-sm leading-7 text-gray-600 sm:text-base">
            {buocHienTai.moTa}
          </p>
        </div>

        {/* Chân modal: chấm chỉ báo + Quay lại / Tiếp theo / Bắt đầu */}
        <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-5 sm:px-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" aria-label={`Bước ${buoc + 1} trên ${CAC_BUOC.length}`}>
              {CAC_BUOC.map((_, viTri) => (
                <button
                  key={viTri}
                  type="button"
                  onClick={() => setBuoc(viTri)}
                  aria-label={`Xem bước ${viTri + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    viTri === buoc
                      ? 'w-7 bg-amber-500'
                      : viTri < buoc
                        ? 'w-2.5 bg-amber-200 hover:bg-amber-300'
                        : 'w-2.5 bg-gray-300 hover:bg-amber-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Ẩn ở bước đầu — từ bước 2 trở đi mới hiện để xem lại */}
              {buoc > 0 && (
                <button
                  type="button"
                  onClick={lui}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-700"
                >
                  ← Quay lại
                </button>
              )}

              <button
                type="button"
                onClick={tiep}
                className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-gray-900 shadow-md shadow-amber-400/30 transition hover:bg-amber-300"
              >
                {laBuocCuoi ? 'Bắt đầu ✓' : 'Tiếp theo →'}
              </button>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={khongHienMotNgay}
              onChange={(e) => setKhongHienMotNgay(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            Không hiện lại trong 1 ngày
          </label>
        </div>
      </section>
    </div>
  );
}
