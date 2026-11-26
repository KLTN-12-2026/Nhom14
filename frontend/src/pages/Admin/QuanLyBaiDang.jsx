import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import KhungQuanTri from '../../components/Admin/KhungQuanTri';
import PhanTrang from '../../components/Common/PhanTrang';
import {
  layDanhSachQuanLy,
  anBaiDang,
  hienBaiDang,
  docNhatKyQuanLy,
  ghiNhatKyQuanLy,
  MAP_TRANG_THAI_P18,
} from '../../services/adminService';
import {
  giaiNgan as giaiNganVi,
  hoanTra as hoanTraVi,
  layViBaiDang,
} from '../../services/viBaiDangService';
import { tb } from '../../services/thongBaoService';

// Nhãn + màu trạng thái ví dự án (escrow vi_bai_dang)
const VI_STYLE = {
  Tam_giu: 'bg-amber-100 text-amber-800',
  Da_giai_ngan: 'bg-emerald-100 text-emerald-800',
  Da_hoan_tra: 'bg-slate-200 text-slate-600',
};

const VI_NHAN = {
  Tam_giu: 'Đang giữ',
  Da_giai_ngan: 'Đã giải ngân',
  Da_hoan_tra: 'Đã hoàn trả',
};

const TRANG_THAI_STYLE = {
  Cho_Duyet: 'bg-amber-100 text-amber-800',
  Da_Duyet: 'bg-emerald-100 text-emerald-800',
  Tu_Choi: 'bg-rose-100 text-rose-800',
  Da_An: 'bg-slate-200 text-slate-600',
};

const LOAI_ICON = {
  'Gọi Vốn': '🤝',
  'Quyên Góp': '❤️',
  'Đầu Tư': '📈',
};

const ngay = (gia_tri) =>
  gia_tri ? new Date(gia_tri).toLocaleDateString('vi-VN') : '—';

const tien = (value) => Number(value || 0).toLocaleString('vi-VN') + ' đ';

// Bài đã đạt mục tiêu (đủ điều kiện GIẢI NGÂN)
const duVon = (p) =>
  Number(p.muc_tieu || 0) > 0 &&
  Number(p.so_tien_da_gop || 0) >= Number(p.muc_tieu || 0);

// Bài đã quá thời hạn kết thúc (đủ điều kiện HOÀN TRẢ)
const hetHan = (p) =>
  p.thoi_gian_ket_thuc
    ? new Date(p.thoi_gian_ket_thuc).getTime() < Date.now()
    : false;

export default function QuanLyBaiDang() {
  const [bai_dang, setBaiDang] = useState(() => layDanhSachQuanLy());
  const [bo_loc, setBoLoc] = useState('all');
  const [tu_khoa, setTuKhoa] = useState('');
  const [dang_xem, setDangXem] = useState(null);
  const [trang, setTrang] = useState(1);
  // Ví dự án (escrow vi_bai_dang) từng bài: id bài -> thông tin ví từ BE
  const [vi_theo_bai, setViTheoBai] = useState({});
  const [id_dang_xu_ly, setIdDangXuLy] = useState(null);
  const nhat_ky = docNhatKyQuanLy();

  const lam_moi = () => setBaiDang(layDanhSachQuanLy());

  // Nạp thông tin ví dự án cho các bài thật (từ MongoDB) — bài demo
  // chưa có escrow nên bỏ qua (lookup theo id nên phần dư không gây lỗi)
  useEffect(() => {
    const bai_be = bai_dang.filter(
      (p) => p.tu_be && /^[0-9a-f]{24}$/i.test(p.id)
    );

    if (!bai_be.length) return;

    let tiep_tuc = true;

    Promise.all(
      bai_be.map((p) => layViBaiDang(p.id).then((vi) => [p.id, vi]))
    )
      .then((ket_qua) => {
        if (tiep_tuc) {
          setViTheoBai(
            Object.fromEntries(ket_qua.filter(([, vi]) => vi))
          );
        }
      })
      .catch(() => {});

    return () => {
      tiep_tuc = false;
    };
  }, [bai_dang]);

  // Admin: giải ngân / hoàn trả ví dự án của một bài đăng
  async function xu_ly_vi(id, hanh_dong, tieu_de) {
    setIdDangXuLy(id);

    try {
      if (hanh_dong === 'giai_ngan') {
        const ket_qua = await giaiNganVi(id);
        tb.thanhCong(
          `Đã giải ngân "${tieu_de}" — chủ dự án nhận ${tien(ket_qua?.so_tien_thuc_nhan)} ` +
            `(phí nền tảng ${tien(ket_qua?.phi_nen_tang)}).`
        );
      } else {
        const ket_qua = await hoanTraVi(id);
        tb.thanhCong(
          `Đã hoàn ${tien(ket_qua?.so_tien_hoan)} cho ${ket_qua?.so_nguoi_hoan ?? 0} người ủng hộ của "${tieu_de}" ` +
            `(phí hoàn trả ${tien(ket_qua?.phi_hoan_tra)}).`
        );
      }

      ghiNhatKyQuanLy(
        hanh_dong === 'giai_ngan' ? 'Giai_Ngan' : 'Hoan_Tra',
        `bai_dang:${id}`
      );
      lam_moi();
    } catch (error) {
      tb.loi(error.message);
    } finally {
      setIdDangXuLy(null);
    }
  }

  const so_dem = useMemo(() => ({
    all: bai_dang.length,
    Cho_Duyet: bai_dang.filter((p) => p.trang_thai === 'Cho_Duyet').length,
    Da_Duyet: bai_dang.filter((p) => p.trang_thai === 'Da_Duyet').length,
    Tu_Choi: bai_dang.filter((p) => p.trang_thai === 'Tu_Choi').length,
    Da_An: bai_dang.filter((p) => p.trang_thai === 'Da_An').length,
  }), [bai_dang]);

  const hien_thi = useMemo(() => bai_dang.filter((p) => {
    if (bo_loc !== 'all' && p.trang_thai !== bo_loc) return false;
    const chuoi = `${p.tieu_de} ${p.id_nguoi_dang} ${p.loai_bai_dang}`.toLowerCase();
    return chuoi.includes(tu_khoa.toLowerCase());
  }).sort((a, b) => new Date(b.ngay_tao || 0) - new Date(a.ngay_tao || 0)), [bai_dang, bo_loc, tu_khoa]);

  // Phân trang 8 bài/trang
  const SO_TRANG_KICH_THUOC = 8;
  const soTrang = Math.max(1, Math.ceil(hien_thi.length / SO_TRANG_KICH_THUOC));
  const trangChot = Math.min(trang, soTrang);
  const hien_thi_trang = hien_thi.slice(
    (trangChot - 1) * SO_TRANG_KICH_THUOC,
    trangChot * SO_TRANG_KICH_THUOC
  );

  async function xu_ly(fn, thong_bao_mo) {
    try {
      const ket_qua = await fn();

      // Hàm BE-first trả { thanhCong, tu_be } — lỗi nghiệp vụ BE hiện thẳng
      if (ket_qua && ket_qua.thanhCong === false) {
        tb.loi(ket_qua.loi);
        return;
      }

      tb.thanhCong(
        ket_qua?.tu_be === false
          ? `${thong_bao_mo} (lưu tạm trình duyệt — BE chưa kết nối)`
          : thong_bao_mo
      );
      lam_moi();
    } catch (error) {
      tb.loi(error.message);
    }
  }

  return (
    <KhungQuanTri
      tieuDe="Quản lý bài đăng"
      moTa="Toàn bộ bài đăng của hệ thống, thao tác ẩn/hiện theo quy định nội dung."
    >
        {/* Thẻ đếm/bộ lọc */}
        <div className="mb-7 grid gap-4 sm:grid-cols-5">
          {[
            ['Tất cả', 'all'],
            [MAP_TRANG_THAI_P18.Cho_Duyet, 'Cho_Duyet'],
            [MAP_TRANG_THAI_P18.Da_Duyet, 'Da_Duyet'],
            [MAP_TRANG_THAI_P18.Tu_Choi, 'Tu_Choi'],
            [MAP_TRANG_THAI_P18.Da_An, 'Da_An'],
          ].map(([nhan, gia_tri]) => (
            <button
              type="button"
              key={gia_tri}
              onClick={() => {
                setBoLoc(gia_tri);
                setTrang(1);
              }}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                bo_loc === gia_tri
                  ? 'border-gray-900 ring-2 ring-amber-300'
                  : 'border-gray-200 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600">
                {nhan}
              </span>

              <p className="mt-2 font-so text-3xl font-extrabold text-gray-900">
                {so_dem[gia_tri] ?? 0}
              </p>
            </button>
          ))}
        </div>

        {/* Tìm kiếm */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <span className="text-gray-400" aria-hidden="true">⌕</span>

            <input
              aria-label="Tìm bài đăng"
              placeholder="Tìm theo tiêu đề, người đăng, loại..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              value={tu_khoa}
              onChange={(e) => {
                setTuKhoa(e.target.value);
                setTrang(1);
              }}
            />
          </div>

          <Button variant="outline" onClick={lam_moi}>🔄 Làm mới danh sách</Button>
        </div>

        {/* Bảng bài đăng */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-4">Bài đăng</th>
                <th className="p-4">Loại</th>
                <th className="p-4">Người đăng</th>
                <th className="p-4">Mục tiêu</th>
                <th className="p-4">Tiền</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {hien_thi_trang.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="max-w-xs p-4">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{LOAI_ICON[p.loai_bai_dang] || '📄'}</span>
                      <span className="font-semibold">{p.tieu_de || 'Chưa có tiêu đề'}</span>
                    </div>
                  </td>
                  <td className="p-4">{p.loai_bai_dang}</td>
                  <td className="p-4">
                    {p.ten_nguoi_dang || p.id_nguoi_dang || '—'}
                  </td>
                  <td className="p-4">{tien(p.muc_tieu)}</td>
                  <td className="p-4">
                    {(() => {
                      const vi = vi_theo_bai[p.id];
                      if (!vi) {
                        return <span className="text-slate-400">—</span>;
                      }

                      return (
                        <div className="space-y-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              VI_STYLE[vi.trang_thai] ||
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {VI_NHAN[vi.trang_thai] ||
                              vi.mo_ta_trang_thai ||
                              vi.trang_thai}
                          </span>

                          <p className="text-xs text-slate-500">
                            {tien(vi.so_du_con_lai)} đang giữ
                          </p>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4">{ngay(p.ngay_tao)}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${TRANG_THAI_STYLE[p.trang_thai]}`}>
                      {MAP_TRANG_THAI_P18[p.trang_thai] || p.trang_thai}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDangXem(p)}>
                        Xem
                      </Button>
                      {p.trang_thai === 'Da_An' ? (
                        <Button
                          size="sm"
                          onClick={() => xu_ly(
                            () => hienBaiDang(p.id),
                            `Đã hiển thị lại bài "${p.tieu_de}".`
                          )}
                        >
                          👁 Hiện lại
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            xu_ly(
                              () => anBaiDang(p.id, 'Ẩn theo yêu cầu quản trị'),
                              `Đã ẩn bài "${p.tieu_de}" (mọi trang công khai sẽ không thấy).`
                            )
                          }
                        >
                          🙈 Ẩn bài
                        </Button>
                      )}

                      {/* Ví dự án (escrow): giải ngân khi đủ vốn, hoàn trả
                          khi hết hạn chưa đủ — BE chặn điều kiện, FE chỉ ẩn
                          nút không phù hợp để admin không bấm nhầm.
                          Bài Đầu Tư liên hệ trực tiếp nên không giải ngân/hoàn trả. */}
                      {(() => {
                        const vi = vi_theo_bai[p.id];
                        if (
                          !vi ||
                          vi.trang_thai !== 'Tam_giu' ||
                          p.loai_bai_dang === 'Đầu Tư'
                        ) {
                          return null;
                        }

                        return (
                          <>
                            {duVon(p) && (
                              <Button
                                size="sm"
                                onClick={() => xu_ly_vi(p.id, 'giai_ngan', p.tieu_de)}
                                disabled={id_dang_xu_ly === p.id}
                              >
                                💸 Giải ngân
                              </Button>
                            )}

                            {!duVon(p) && hetHan(p) && (
                              <Button
                                size="sm"
                                variant="outline-dark"
                                onClick={() => xu_ly_vi(p.id, 'hoan_tra', p.tieu_de)}
                                disabled={id_dang_xu_ly === p.id}
                              >
                                ↩ Hoàn trả
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
              {!hien_thi.length && (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-slate-500">
                    Chưa có bài đăng phù hợp. Bài mới chờ duyệt sẽ xuất hiện tại{' '}
                    <Link to="/admin/duyet-bai" className="font-semibold text-amber-700 underline">
                      trang duyệt bài
                    </Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Nút chuyển trang dưới bảng quản lý */}
        <PhanTrang
          trang={trangChot}
          soTrang={soTrang}
          onDoiTrang={setTrang}
        />

        {/* Hộp thoại xem chi tiết */}
        {dang_xem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setDangXem(null); }}
          >
            <section
              role="dialog"
              aria-modal="true"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">{dang_xem.tieu_de}</h2>
                <button
                  type="button"
                  onClick={() => setDangXem(null)}
                  aria-label="Đóng chi tiết"
                  className="rounded p-2 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p><b>Loại:</b> {dang_xem.loai_bai_dang}</p>
                <p><b>Trạng thái:</b> {MAP_TRANG_THAI_P18[dang_xem.trang_thai]}</p>
                <p><b>Người đăng:</b> {dang_xem.id_nguoi_dang || '—'}</p>
                <p><b>Mục tiêu:</b> {tien(dang_xem.muc_tieu)} {dang_xem.don_vi_tien_te}</p>
                <p><b>Ngày tạo:</b> {ngay(dang_xem.ngay_tao)}</p>
                <p><b>Cập nhật:</b> {ngay(dang_xem.ngay_cap_nhat)}</p>
                <p><b>Nguồn:</b> {dang_xem.la_demo ? 'Dữ liệu demo' : 'Bài người dùng tạo'}</p>
              </div>
              <div className="mt-5">
                <h3 className="mb-2 font-bold">Nội dung</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {dang_xem.noi_dung || 'Chưa có mô tả'}
                </p>
              </div>
              {!!dang_xem.hinh_anh?.length && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {dang_xem.hinh_anh.map((anh, chi_so) => (
                    <img
                      key={chi_so}
                      src={anh}
                      alt={`Hình ${chi_so + 1}`}
                      className="max-h-60 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Nhật ký quản trị */}
        {!!nhat_ky.length && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-bold">Nhật ký quản trị gần đây</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-4">Thời điểm</th>
                    <th className="p-4">Quản trị viên</th>
                    <th className="p-4">Hành động</th>
                    <th className="p-4">Đối tượng</th>
                    <th className="p-4">Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {nhat_ky.slice(0, 10).map((dong) => (
                    <tr key={dong.id} className="border-t border-slate-100">
                      <td className="p-4">{new Date(dong.ngay_tao).toLocaleString('vi-VN')}</td>
                      <td className="p-4">
                        {dong.ho_ten_quan_tri_vien ||
                          (dong.id_quan_tri_vien
                            ? `@${dong.id_quan_tri_vien}`
                            : '—')}
                      </td>
                      <td className="p-4 font-semibold">{dong.hanh_dong}</td>
                      <td className="p-4">{dong.loai_doi_tuong}</td>
                      <td className="p-4 text-slate-600">{dong.ly_do || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Danh sách hợp nhất bài từ MongoDB (GET /api/admin/bai-dang) và bài
          cục bộ khi BE tắt; trạng thái theo chuẩn DB: Cho_Duyet/Da_Duyet/
          Tu_Choi/Da_An. Nút Ẩn/Hiện lưu trạng thái cục bộ — khi BE cung cấp
          endpoint ẩn bài sẽ chuyển tiếp tự động.
        </p>
    </KhungQuanTri>
  );
}
