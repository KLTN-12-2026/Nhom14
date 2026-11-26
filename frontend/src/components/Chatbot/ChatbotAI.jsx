import { useEffect, useRef, useState } from 'react';

import chatbot from '../../assets/chatbot.png';
import { getSession } from '../../services/authService';
import {
  guiTin,
  layDanhSachHoiThoai,
  layTinNhan,
} from '../../services/chatbotService';
import { nenAnh, ANH_TOI_DA_BYTES } from '../../utils/anh';

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 pr-9 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100';

// Widget trợ lý AI Rising Bot — nút nổi góc phải + khung hội thoại.
// BE module /api/chatbot (Gemini thật); BE tắt -> chatbotService trả demo.
const ChatbotAI = () => {
  const [mo_rong, setMoRong] = useState(false);
  const [danh_sach_hoi, setDanhSachHoi] = useState([]);
  const [id_hoi, setIdHoi] = useState(null);
  const [tin_nhan, setTinNhan] = useState([]);
  const [noi_dung, setNoiDung] = useState('');
  const [dang_gui, setDangGui] = useState(false);
  const [dang_tai, setDangTai] = useState(false);
  const [canh_bao, setCanhBao] = useState('');
  // Ảnh đang chọn để gửi kèm (data URL đã nén) + trạng thái đang xử lý file
  const [anh_chon, setAnhChon] = useState(null);
  const [dang_xu_ly_anh, setDangXuLyAnh] = useState(false);
  // Dự án đang xem — để AI đánh giá ảnh theo tình hình dự án
  const [id_bai_dang, setIdBaiDang] = useState(null);
  const [ten_bai_dang, setTenBaiDang] = useState('');

  const vung_tin = useRef(null);
  const o_chon_anh = useRef(null);
  const dang_dang_nhap = Boolean(getSession());

  // Cuộn xuống tin mới nhất
  useEffect(() => {
    if (vung_tin.current) {
      vung_tin.current.scrollTop = vung_tin.current.scrollHeight;
    }
  }, [tin_nhan, mo_rong]);

  // Mở panel: nạp hội thoại + tin nhắn gần nhất
  useEffect(() => {
    if (!mo_rong || !dang_dang_nhap) return;

    (async () => {
      try {
        const danh_sach = await layDanhSachHoiThoai();
        setDanhSachHoi(danh_sach);

        const hoi_moi_nhat = danh_sach[0];
        if (hoi_moi_nhat) {
          setIdHoi(hoi_moi_nhat.id);
          setTinNhan(await layTinNhan(hoi_moi_nhat.id));
        } else {
          setIdHoi(null);
          setTinNhan([]);
        }
      } catch {
        setCanhBao('Không tải được hội thoại — đang dùng chế độ demo.');
      }
    })();
  }, [mo_rong, dang_dang_nhap]);

  const chon_hoi_thoai = async (id) => {
    setIdHoi(id);
    setCanhBao('');
    // Đổi hội thoại -> bỏ ảnh đang chọn; NGỮ CẢNH DỰ ÁN giữ nguyên vì
    // người dùng vẫn đang xem trang dự án đó (trang tự phát/xóa ngữ cảnh).
    setAnhChon(null);
    setDangTai(true);
    try {
      setTinNhan(id ? await layTinNhan(id) : []);
    } catch {
      setTinNhan([]);
    } finally {
      setDangTai(false);
    }
  };

  const hoi_thoai_moi = () => chon_hoi_thoai(null);

  // Gửi tin nhắn vào hội thoại hiện tại (hoặc hội thoại MỚI nếu hoi_moi).
  // hinh_anh: data URL đã nén; du_an: id bài đăng để AI nạp bối cảnh dự án.
  const guiTrucTiep = async (
    gui_di,
    hoi_moi = false,
    hinh_anh = null,
    du_an = id_bai_dang
  ) => {
    const noi_dung_gui = (gui_di || '').trim();

    if ((!noi_dung_gui && !hinh_anh) || dang_gui) return;

    setDangGui(true);
    setCanhBao('');

    // Tin người dùng hiện ngay (chờ BE lưu + AI trả lời)
    const tin_toi_uu = {
      id: `tam-${Date.now()}`,
      loai_nguoi_gui: 'Nguoi_Dung',
      noi_dung: noi_dung_gui,
      hinh_anh: hinh_anh || null,
      ngay_tao: new Date().toISOString(),
    };

    if (hoi_moi) {
      // Hội thoại mới: dọn khung trước (khi hỏi AI từ trang bài đăng)
      setIdHoi(null);
      setTinNhan([tin_toi_uu]);
    } else {
      setTinNhan((truoc) => [...truoc, tin_toi_uu]);
    }
    setNoiDung('');
    setAnhChon(null);

    try {
      const ket_qua = await guiTin(
        noi_dung_gui,
        hoi_moi ? null : id_hoi,
        hinh_anh,
        du_an
      );

      setTinNhan((truoc) => [
        ...truoc.filter((tin) => tin.id !== tin_toi_uu.id),
        ket_qua.tin_nguoi_dung,
        ket_qua.tin_chatbot,
      ]);
      setIdHoi(ket_qua.id_hoi_thoai || id_hoi);
      setCanhBao(ket_qua.canh_bao || '');
      // Làm mới danh sách hội thoại (tin mới -> lên đầu)
      layDanhSachHoiThoai().then(setDanhSachHoi).catch(() => {});
    } catch (error) {
      // Lỗi BE thật (400/401/500...) — gỡ tin tạm, trả lại nội dung đã gõ
      setTinNhan((truoc) => truoc.filter((tin) => tin.id !== tin_toi_uu.id));
      setNoiDung(noi_dung_gui);
      if (hinh_anh) setAnhChon(hinh_anh);
      setCanhBao(error.message);
    } finally {
      setDangGui(false);
    }
  };

  // Chọn ảnh: kiểm tra định dạng/kích thước rồi nén trước khi gửi.
  const chon_anh = async (e) => {
    const file = e.target.files?.[0];
    // Cho phép chọn lại đúng file vừa chọn
    e.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCanhBao('Vui lòng chọn một tệp hình ảnh (JPEG, PNG hoặc WEBP).');
      return;
    }

    if (file.size > ANH_TOI_DA_BYTES) {
      setCanhBao('Ảnh tối đa 5 MB — vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setDangXuLyAnh(true);
    setCanhBao('');
    try {
      setAnhChon(await nenAnh(file));
    } catch {
      setCanhBao('Không thể đọc ảnh. Vui lòng thử lại.');
    } finally {
      setDangXuLyAnh(false);
    }
  };

  // Gửi từ form nhập tin (cho phép gửi chỉ ảnh, không cần chữ)
  const gui = (e) => {
    e.preventDefault();

    const gui_di = noi_dung.trim();
    if (gui_di || anh_chon) guiTrucTiep(gui_di, false, anh_chon);
  };

  // Ngữ cảnh dự án đang mở: trang chi tiết phát sự kiện khi mount/unmount.
  // Nhờ vậy mở chatbot trực tiếp trên trang dự án rồi gửi ảnh, AI vẫn có
  // bối cảnh dự án — không cần bấm nút "Hỏi AI đánh giá dự án".
  useEffect(() => {
    const xuLyNguCanh = (suKien) => {
      setIdBaiDang(suKien.detail?.idBaiDang || null);
      setTenBaiDang(suKien.detail?.tenBaiDang || '');
    };

    window.addEventListener('rising-bot:ngu-canh', xuLyNguCanh);
    return () =>
      window.removeEventListener('rising-bot:ngu-canh', xuLyNguCanh);
  }, []);

  // Sự kiện từ các trang (nút "🤖 Hỏi AI đánh giá dự án" ở trang chi tiết
  // bài đăng): mở widget + TỰ gửi câu hỏi vào hội thoại MỚI. Chưa đăng
  // nhập thì chỉ mở khung — hiện lời mời đăng nhập. Không mảng deps:
  // đăng ký lại mỗi lần render để luôn dùng giá trị state mới nhất.
  useEffect(() => {
    const xuLyHoiBai = (suKien) => {
      const cauHoi = suKien.detail?.cauHoi;
      if (!cauHoi) return;

      // Trang chi tiết gửi kèm id bài đăng -> AI đánh giá ảnh theo dự án
      const duAn = suKien.detail?.idBaiDang || null;
      setIdBaiDang(duAn);
      setTenBaiDang(suKien.detail?.tenBaiDang || '');
      setMoRong(true);
      if (Boolean(getSession()) && !dang_gui) {
        guiTrucTiep(cauHoi, true, null, duAn);
      }
    };

    window.addEventListener('rising-bot:hoi-bai', xuLyHoiBai);
    return () => window.removeEventListener('rising-bot:hoi-bai', xuLyHoiBai);
  });

  return (
    <>
      {/* Nút nổi góc phải — giữ thiết kế placeholder cũ */}
      <button
        type="button"
        onClick={() => setMoRong((truoc) => !truoc)}
        title="Trợ lý AI Rising Bot"
        aria-label={mo_rong ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-300 shadow-lg transition hover:scale-105 hover:shadow-xl"
      >
        <img
          src={chatbot}
          alt="Trợ lý AI"
          className="h-10 w-10 rounded-full object-cover"
        />
      </button>

      {/* Khung hội thoại */}
      {mo_rong && (
        <div
          role="dialog"
          aria-label="Trợ lý AI Rising Bot"
          className="fixed bottom-24 right-6 z-50 flex h-[min(680px,calc(100vh-8rem))] w-[460px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Đầu khung */}
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
            <img
              src={chatbot}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-inknut text-sm font-extrabold text-slate-900">
                Rising Bot 🤖
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {dang_dang_nhap
                  ? 'Trợ lý AI của nền tảng Rising Idea'
                  : 'Đăng nhập để trò chuyện với trợ lý AI'}
              </p>
              {id_bai_dang && (
                <p className="truncate text-[10px] font-semibold text-amber-600">
                  📌 {ten_bai_dang || 'Dự án đang xem'}
                </p>
              )}
            </div>

            {dang_dang_nhap && (
              <button
                type="button"
                onClick={hoi_thoai_moi}
                title="Bắt đầu hội thoại mới"
                className="shrink-0 rounded-lg border border-amber-300 px-2 py-1 text-[11px] font-bold text-amber-700 transition hover:bg-amber-50"
              >
                ＋ Mới
              </button>
            )}

            <button
              type="button"
              onClick={() => setMoRong(false)}
              aria-label="Đóng"
              className="shrink-0 rounded-lg px-1.5 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {/* Chọn hội thoại cũ */}
          {dang_dang_nhap && danh_sach_hoi.length > 1 && (
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <select
                value={id_hoi || ''}
                onChange={(e) => chon_hoi_thoai(e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none"
              >
                <option value="">— Hội thoại mới —</option>
                {danh_sach_hoi.map((hoi) => (
                  <option key={hoi.id} value={hoi.id}>
                    {hoi.tieu_de}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vùng tin nhắn */}
          <div
            ref={vung_tin}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-4 py-4"
          >
            {!dang_dang_nhap && (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                🔐 Đăng nhập để trò chuyện với Rising Bot — trợ lý AI hướng
                dẫn đăng bài, nạp tiền, ủng hộ dự án và giải đáp thắc mắc.
              </p>
            )}

            {dang_dang_nhap && dang_tai && (
              <p className="text-center text-xs text-slate-400">
                Đang tải tin nhắn...
              </p>
            )}

            {dang_dang_nhap && !dang_tai && tin_nhan.length === 0 && (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Xin chào! Mình là <b>Rising Bot</b> 🤖<br />
                Hỏi mình về cách <b>đăng bài</b>, <b>nạp tiền</b>,{' '}
                <b>ủng hộ dự án</b> — hoặc gửi <b>ảnh dự án</b> để mình đánh
                giá theo tình hình thực tế nhé!
              </div>
            )}

            {tin_nhan.map((tin) => (
              <div
                key={tin.id}
                className={`flex ${tin.loai_nguoi_gui === 'Nguoi_Dung' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] space-y-1.5 rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    tin.loai_nguoi_gui === 'Nguoi_Dung'
                      ? 'rounded-br-md bg-amber-300 text-gray-900'
                      : 'rounded-bl-md bg-white text-slate-700'
                  }`}
                >
                  {tin.hinh_anh && (
                    <a
                      href={tin.hinh_anh}
                      target="_blank"
                      rel="noreferrer"
                      title="Mở ảnh ở tab mới"
                      className="block overflow-hidden rounded-lg border border-white/60"
                    >
                      <img
                        src={tin.hinh_anh}
                        alt="Ảnh người dùng gửi"
                        className="max-h-44 w-full object-cover"
                      />
                    </a>
                  )}

                  {tin.noi_dung && (
                    <p className="whitespace-pre-wrap">{tin.noi_dung}</p>
                  )}
                </div>
              </div>
            ))}

            {dang_gui && (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-slate-400 shadow-sm">
                  Rising Bot đang soạn...
                </p>
              </div>
            )}
          </div>

          {/* Cảnh báo trung thực (AI sự cố / demo) */}
          {canh_bao && (
            <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-[11px] text-amber-700">
              ⚠ {canh_bao}
            </p>
          )}

          {/* Nhập tin */}
          {dang_dang_nhap && (
            <form
              onSubmit={gui}
              className="border-t border-slate-100 bg-white px-3 py-3"
            >
              {/* Ảnh đang chọn — xem trước + gỡ */}
              {anh_chon && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2">
                  <img
                    src={anh_chon}
                    alt="Ảnh sẽ gửi"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <p className="min-w-0 flex-1 text-[11px] leading-4 text-amber-800">
                    Ảnh sẽ được gửi kèm
                    {id_bai_dang
                      ? ' và AI đánh giá theo tình hình dự án đang xem.'
                      : ' để AI đánh giá.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAnhChon(null)}
                    aria-label="Gỡ ảnh"
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Chọn ảnh: input file ẩn + nút camera */}
                <input
                  ref={o_chon_anh}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={chon_anh}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => o_chon_anh.current?.click()}
                  disabled={dang_gui || dang_xu_ly_anh}
                  title="Gửi ảnh để AI đánh giá theo dự án"
                  aria-label="Chọn ảnh"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {dang_xu_ly_anh ? '…' : '📷'}
                </button>

                <input
                  type="text"
                  value={noi_dung}
                  onChange={(e) => setNoiDung(e.target.value)}
                  placeholder={
                    anh_chon
                      ? 'Thêm mô tả cho ảnh (không bắt buộc)...'
                      : 'Nhập câu hỏi cho Rising Bot...'
                  }
                  maxLength={2000}
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={
                    dang_gui ||
                    dang_xu_ly_anh ||
                    (!noi_dung.trim() && !anh_chon)
                  }
                  aria-label="Gửi"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-gray-900 shadow transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ➤
                </button>
              </div>

              <p className="mt-1.5 text-center text-[10px] text-slate-400">
                {id_bai_dang
                  ? 'Ảnh JPEG/PNG/WEBP, tối đa 5 MB — AI đánh giá ảnh theo tình hình dự án đang xem.'
                  : 'Ảnh JPEG/PNG/WEBP, tối đa 5 MB — gửi kèm mô tả để AI đánh giá chính xác hơn.'}
              </p>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotAI;
