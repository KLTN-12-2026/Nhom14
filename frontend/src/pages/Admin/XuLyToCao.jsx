import { useEffect, useMemo, useState } from 'react';
import KhungQuanTri from '../../components/Admin/KhungQuanTri';
import PhanTrang from '../../components/Common/PhanTrang';
import Button from '../../components/Button/Button';
import {
  layDanhSachToCao,
  dongBoToCaoTuBe,
  xuLyToCao,
  TRANG_THAI_TO_CAO,
} from '../../services/toCaoService';
import { tb } from '../../services/thongBaoService';

const TRANG_THAI_STYLE = {
  Chua_Xu_Ly: 'bg-amber-100 text-amber-800',
  Da_Xu_Ly: 'bg-emerald-100 text-emerald-800',
};

const ngay = (gia_tri) =>
  gia_tri ? new Date(gia_tri).toLocaleString('vi-VN') : '—';

// Thẻ thống kê/bộ lọc — mỗi trạng thái một màu riêng
const O_THE = [
  { key: 'all', nhan: 'Tất cả', nhanVien: 'bg-slate-900 text-white' },
  { key: 'Chua_Xu_Ly', nhan: TRANG_THAI_TO_CAO.Chua_Xu_Ly, nhanVien: 'bg-amber-400 text-gray-900' },
  { key: 'Da_Xu_Ly', nhan: TRANG_THAI_TO_CAO.Da_Xu_Ly, nhanVien: 'bg-emerald-400 text-white' },
];

// PB20 - Xử lý tố cáo bài đăng: admin tiếp nhận, đanh dấu đã xử lý,
// ghi chú kết luận theo collection to_cao_bai_dang (tài liệu DB).
export default function XuLyToCao() {
  const [to_cao, setToCao] = useState(() => layDanhSachToCao());
  const [bo_loc, setBoLoc] = useState('all');
  const [tu_khoa, setTuKhoa] = useState('');
  const [dang_xu_ly, setDangXuLy] = useState(null); // { id, trang_thai, ghi_chu }
  const [dang_gui, setDangGui] = useState(false);
  const [trang, setTrang] = useState(1);

  const lam_moi = () => setToCao(layDanhSachToCao());

  // Mở trang: tải tố cáo thật từ BE (nếu module đã dựng) vào cache
  useEffect(() => {
    let tiep_tuc = true;

    dongBoToCaoTuBe()
      .then(() => {
        if (tiep_tuc) lam_moi();
      })
      .catch(() => {
        // BE tắt -> danh sách cục bộ (demo + tố cáo chờ đồng bộ)
      });

    return () => {
      tiep_tuc = false;
    };
  }, []);

  const so_dem = useMemo(() => ({
    all: to_cao.length,
    Chua_Xu_Ly: to_cao.filter((t) => t.trang_thai === 'Chua_Xu_Ly').length,
    Da_Xu_Ly: to_cao.filter((t) => t.trang_thai === 'Da_Xu_Ly').length,
  }), [to_cao]);

  const hien_thi = useMemo(
    () =>
      to_cao
        .filter((t) => {
          if (bo_loc !== 'all' && t.trang_thai !== bo_loc) return false;
          const chuoi = `${t.tieu_de_bai_dang || ''} ${t.ly_do} ${t.mo_ta} ${t.ten_nguoi_to_cao}`.toLowerCase();
          return chuoi.includes(tu_khoa.toLowerCase());
        })
        .sort(
          (a, b) =>
            // Chưa xử lý nổi "hot" lên đầu; mới nhất lên trước trong cùng nhóm
            (a.trang_thai === 'Chua_Xu_Ly' ? 0 : 1) -
              (b.trang_thai === 'Chua_Xu_Ly' ? 0 : 1) ||
            new Date(b.ngay_tao || 0) - new Date(a.ngay_tao || 0)
        ),
    [to_cao, bo_loc, tu_khoa]
  );

  // Phân trang 8 tố cáo/trang
  const SO_TRANG_KICH_THUOC = 8;
  const soTrang = Math.max(1, Math.ceil(hien_thi.length / SO_TRANG_KICH_THUOC));
  const trangChot = Math.min(trang, soTrang);
  const hien_thi_trang = hien_thi.slice(
    (trangChot - 1) * SO_TRANG_KICH_THUOC,
    trangChot * SO_TRANG_KICH_THUOC
  );

  async function luu_xu_ly(event) {
    event.preventDefault();

    if (!dang_xu_ly) return;

    setDangGui(true);

    try {
      const ket_qua = await xuLyToCao(
        dang_xu_ly.id,
        dang_xu_ly.trang_thai,
        dang_xu_ly.ghi_chu,
        dang_xu_ly.an_bai
      );

      if (!ket_qua.thanhCong) {
        tb.loi(ket_qua.loi);
        return;
      }

      tb.thanhCong(
        dang_xu_ly.an_bai
          ? 'Đã xử lý tố cáo và ẩn bài vi phạm khỏi danh sách công khai!'
          : 'Cập nhật xử lý tố cáo thành công! (người tố cáo nhận thông báo)'
      );
      setDangXuLy(null);
      lam_moi();
    } catch (error) {
      tb.loi(error.message);
    } finally {
      setDangGui(false);
    }
  }

  return (
    <KhungQuanTri
      tieuDe="Xử lý tố cáo"
      moTa="Tiếp nhận và xử lý tố cáo bài đăng theo quy trình kiểm duyệt nội dung."
    >
      {/* Thẻ thống kê/bộ lọc */}
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        {O_THE.map(({ key, nhan, nhanVien }) => (
          <button
            type="button"
            key={key}
            onClick={() => {
              setBoLoc(key);
              setTrang(1);
            }}
            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
              bo_loc === key
                ? 'border-gray-900 ring-2 ring-amber-300'
                : 'border-gray-200 hover:-translate-y-0.5 hover:shadow-md'
            }`}
          >
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${nhanVien}`}
            >
              {nhan}
            </span>

            <p className="mt-2 font-inknut text-3xl font-extrabold text-gray-900">
              {so_dem[key] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Tìm kiếm + làm mới */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
          <span className="text-gray-400" aria-hidden="true">⌕</span>

          <input
            aria-label="Tìm tố cáo"
            placeholder="Tìm theo bài, người tố cáo, lý do..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            value={tu_khoa}
            onChange={(e) => {
              setTuKhoa(e.target.value);
              setTrang(1);
            }}
          />
        </div>

        <Button variant="outline" onClick={lam_moi}>
          🔄 Làm mới danh sách
        </Button>
      </div>

      {/* Bảng tố cáo */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="p-4 font-bold">Bài bị tố cáo</th>
              <th className="p-4 font-bold">Lý do</th>
              <th className="p-4 font-bold">Người tố cáo</th>
              <th className="p-4 font-bold">Thời điểm</th>
              <th className="p-4 font-bold">Trạng thái</th>
              <th className="p-4 font-bold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {hien_thi_trang.map((t) => (
              <tr
                key={t.id}
                className="border-t border-gray-100 transition hover:bg-amber-50/50"
              >
                <td className="max-w-[240px] p-4 font-semibold">
                  {t.tieu_de_bai_dang || `Bài ${t.id_bai_dang_str}`}
                </td>

                <td className="max-w-[240px] p-4">
                  <p className="font-semibold text-gray-800">{t.ly_do}</p>

                  {t.mo_ta && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {t.mo_ta}
                    </p>
                  )}
                </td>

                <td className="p-4">{t.ten_nguoi_to_cao || '—'}</td>

                <td className="p-4 text-slate-500">{ngay(t.ngay_tao)}</td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${TRANG_THAI_STYLE[t.trang_thai]}`}
                  >
                    {TRANG_THAI_TO_CAO[t.trang_thai] || t.trang_thai}
                  </span>

                  {t.ghi_chu && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      💬 {t.ghi_chu}
                    </p>
                  )}
                </td>

                <td className="p-4">
                  <Button
                    size="sm"
                    onClick={() =>
                      setDangXuLy({
                        id: t.id,
                        trang_thai: t.trang_thai,
                        ghi_chu: t.ghi_chu || '',
                        an_bai: false,
                      })
                    }
                  >
                    {t.trang_thai === 'Chua_Xu_Ly' ? '⚖ Xử lý' : 'Sửa kết luận'}
                  </Button>
                </td>
              </tr>
            ))}

            {!hien_thi.length && (
              <tr>
                <td colSpan="6" className="px-6 py-14 text-center text-slate-500">
                  Chưa có tố cáo nào. Nút “🚩 Báo cáo” ở mỗi trang chi tiết
                  bài đăng sẽ đưa tố cáo về đây.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PhanTrang trang={trangChot} soTrang={soTrang} onDoiTrang={setTrang} />

      {!to_cao.some((t) => t.tu_be) && (
        <p className="mt-4 text-xs text-slate-500">
          Đang xem bản cục bộ: tố cáo do người dùng tạo khi backend chưa kết nối
          hoặc module tố cáo chưa dựng. Khi BE hoạt động, danh sách được lấy từ
          MongoDB (collection to_cao_bai_dang).
        </p>
      )}

      {/* Modal xử lý tố cáo */}
      {dang_xu_ly && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !dang_gui) setDangXuLy(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="to-cao-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  {TRANG_THAI_TO_CAO[dang_xu_ly.trang_thai]}
                </span>

                <h2
                  id="to-cao-title"
                  className="mt-2 font-inknut text-xl font-extrabold text-gray-900"
                >
                  Xử lý tố cáo
                </h2>
              </div>

              <button
                type="button"
                onClick={() => !dang_gui && setDangXuLy(null)}
                aria-label="Đóng"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={luu_xu_ly}>
              <div>
                <label
                  htmlFor="trang_thai-to-cao"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Kết luận
                </label>

                <select
                  id="trang_thai-to-cao"
                  value={dang_xu_ly.trang_thai}
                  onChange={(e) =>
                    setDangXuLy({
                      ...dang_xu_ly,
                      trang_thai: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                >
                  {Object.entries(TRANG_THAI_TO_CAO).map(([value, nhan]) => (
                    <option key={value} value={value}>
                      {nhan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="ghi_chu-to-cao"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Ghi chú xử lý
                </label>

                <textarea
                  id="ghi_chu-to-cao"
                  rows={4}
                  maxLength={1000}
                  value={dang_xu_ly.ghi_chu}
                  onChange={(e) =>
                    setDangXuLy({ ...dang_xu_ly, ghi_chu: e.target.value })
                  }
                  placeholder="Kết luận của quản trị viên: đã ẩn bài, cảnh báo người đăng..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* Ẩn bài vi phạm: bài biến mất khỏi danh sách công khai,
                  người đăng nhận thông báo kèm lý do (ghi lich_su_duyet_bai) */}
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(dang_xu_ly.an_bai)}
                  onChange={(e) =>
                    setDangXuLy({
                      ...dang_xu_ly,
                      an_bai: e.target.checked,
                    })
                  }
                  className="mt-0.5 accent-rose-500"
                />
                <span>
                  <b className="text-rose-600">Ẩn bài đăng vi phạm</b>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Bài sẽ biến mất khỏi mọi danh sách công khai; người đăng
                    nhận thông báo kèm lý do.
                  </span>
                </span>
              </label>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDangXuLy(null)}
                  disabled={dang_gui}
                >
                  Hủy
                </Button>

                <Button type="submit" disabled={dang_gui}>
                  {dang_gui ? 'Đang lưu...' : '✓ Lưu kết luận'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </KhungQuanTri>
  );
}
