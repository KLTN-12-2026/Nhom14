import { useEffect, useRef, useState } from 'react';

import chatbot from '../../assets/chatbot.png';
import { getSession } from '../../services/authService';
import {
  guiTin,
  layDanhSachHoiThoai,
  layTinNhan,
} from '../../services/chatbotService';

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

  const vung_tin = useRef(null);
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

  const gui = async (e) => {
    e.preventDefault();

    const gui_di = noi_dung.trim();
    if (!gui_di || dang_gui) return;

    setDangGui(true);
    setCanhBao('');
    // Tin người dùng hiện ngay (chờ BE lưu + AI trả lời)
    const tin_toi_uu = {
      id: `tam-${Date.now()}`,
      loai_nguoi_gui: 'Nguoi_Dung',
      noi_dung: gui_di,
      ngay_tao: new Date().toISOString(),
    };
    setTinNhan((truoc) => [...truoc, tin_toi_uu]);
    setNoiDung('');

    try {
      const ket_qua = await guiTin(gui_di, id_hoi);

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
      // Lỗi BE thật (401/500...) — hiện tin tối + gỡ tin tạm
      setTinNhan((truoc) => truoc.filter((tin) => tin.id !== tin_toi_uu.id));
      setNoiDung(gui_di);
      setCanhBao(error.message);
    } finally {
      setDangGui(false);
    }
  };

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
          className="fixed bottom-24 right-6 z-50 flex h-[540px] w-[380px] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
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
                <b>ủng hộ dự án</b> hay bất cứ điều gì về Rising Idea nhé!
              </div>
            )}

            {tin_nhan.map((tin) => (
              <div
                key={tin.id}
                className={`flex ${tin.loai_nguoi_gui === 'Nguoi_Dung' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    tin.loai_nguoi_gui === 'Nguoi_Dung'
                      ? 'rounded-br-md bg-amber-300 text-gray-900'
                      : 'rounded-bl-md bg-white text-slate-700'
                  }`}
                >
                  {tin.noi_dung}
                </p>
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
              className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-3"
            >
              <input
                type="text"
                value={noi_dung}
                onChange={(e) => setNoiDung(e.target.value)}
                placeholder="Nhập câu hỏi cho Rising Bot..."
                maxLength={2000}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={dang_gui || !noi_dung.trim()}
                aria-label="Gửi"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-gray-900 shadow transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ➤
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotAI;
