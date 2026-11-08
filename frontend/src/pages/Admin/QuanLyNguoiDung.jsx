import { useMemo, useState } from 'react';
import Button from '../../components/Button/Button';
import KhungQuanTri from '../../components/Admin/KhungQuanTri';
import PhanTrang from '../../components/Common/PhanTrang';
import {
  layDanhSachNguoiDung,
  khoaTaiKhoan,
  moKhoaTaiKhoan,
  doiVaiTro,
  docNhatKy,
} from '../../services/adminUserService';

const VAI_TRO_NHAN = {
  Nguoi_Dung: 'Người dùng',
  Quan_Tri_Vien: 'Quản trị viên',
};

const VAI_TRO_STYLE = {
  Nguoi_Dung: 'bg-slate-200 text-slate-700',
  Quan_Tri_Vien: 'bg-violet-100 text-violet-700',
};

const TRANG_THAI_NHAN = {
  Hoat_Dong: 'Hoạt động',
  Bi_Khoa: 'Bị khóa',
};

const TRANG_THAI_STYLE = {
  Hoat_Dong: 'bg-emerald-100 text-emerald-800',
  Bi_Khoa: 'bg-rose-100 text-rose-800',
};

// Định dạng ngày theo tài liệu DB (ngay_tao/ngay_cap_nhat ISO string)
const ngay = (gia_tri) =>
  gia_tri ? new Date(gia_tri).toLocaleString('vi-VN') : '—';

export default function QuanLyNguoiDung() {
  const [nguoi_dung, setNguoiDung] = useState(() => layDanhSachNguoiDung());
  const [bo_loc, setBoLoc] = useState('all');
  const [tu_khoa, setTuKhoa] = useState('');
  const [dang_chon, setDangChon] = useState(null); // tài khoản đang khóa
  const [ly_do, setLyDo] = useState('');
  const [thong_bao, setThongBao] = useState('');
  const [trang, setTrang] = useState(1);
  const nhat_ky = docNhatKy();

  const lam_moi = () => setNguoiDung(layDanhSachNguoiDung());

  const so_dem = useMemo(() => ({
    all: nguoi_dung.length,
    Hoat_Dong: nguoi_dung.filter((n) => n.trang_thai === 'Hoat_Dong').length,
    Bi_Khoa: nguoi_dung.filter((n) => n.trang_thai === 'Bi_Khoa').length,
    Quan_Tri_Vien: nguoi_dung.filter((n) => n.vai_tro === 'Quan_Tri_Vien').length,
  }), [nguoi_dung]);

  const hien_thi = useMemo(() => nguoi_dung.filter((n) => {
    if (bo_loc !== 'all' && n.trang_thai !== bo_loc) return false;
    const chuoi = `${n.ho_ten} ${n.ten_tk} ${n.email} ${n.dien_thoai}`.toLowerCase();
    return chuoi.includes(tu_khoa.toLowerCase());
  }), [nguoi_dung, bo_loc, tu_khoa]);

  // Phân trang 8 người dùng/trang
  const SO_TRANG_KICH_THUOC = 8;
  const soTrang = Math.max(1, Math.ceil(hien_thi.length / SO_TRANG_KICH_THUOC));
  const trangChot = Math.min(trang, soTrang);
  const hien_thi_trang = hien_thi.slice(
    (trangChot - 1) * SO_TRANG_KICH_THUOC,
    trangChot * SO_TRANG_KICH_THUOC
  );

  function hanh_dong(fn, mau_thong_bao) {
    try {
      fn();
      setThongBao(mau_thong_bao);
      lam_moi();
    } catch (error) {
      setThongBao(`⚠️ ${error.message}`);
    }
    setDangChon(null);
    setLyDo('');
  }

  return (
    <KhungQuanTri
      tieuDe="Quản lý người dùng"
      moTa="Xem, khóa/mở khóa và cập nhật quyền cho các tài khoản trong hệ thống."
    >
        {/* Thẻ đếm/bộ lọc trạng thái */}
        <div className="mb-7 grid gap-4 sm:grid-cols-4">
          {[
            ['Tất cả', 'all'],
            [TRANG_THAI_NHAN.Hoat_Dong, 'Hoat_Dong'],
            [TRANG_THAI_NHAN.Bi_Khoa, 'Bi_Khoa'],
            [VAI_TRO_NHAN.Quan_Tri_Vien, 'Quan_Tri_Vien'],
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

              <p className="mt-2 font-inknut text-3xl font-extrabold text-gray-900">
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
              aria-label="Tìm người dùng"
              placeholder="Tìm theo họ tên, tài khoản, email, SĐT..."
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

        {thong_bao && (
          <div role="status" className="mb-4 flex justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {thong_bao}
            <button type="button" onClick={() => setThongBao('')} aria-label="Đóng thông báo">✕</button>
          </div>
        )}

        {/* Bảng người dùng */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-4">Người dùng</th>
                <th className="p-4">Email</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {hien_thi_trang.map((n) => (
                <tr key={n.ten_tk} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 to-violet-400 font-bold text-gray-900 shadow-sm">
                        {n.ho_ten ? n.ho_ten.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-semibold">{n.ho_ten || n.ten_tk}</p>
                        <p className="text-xs text-slate-500">@{n.ten_tk}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{n.email}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VAI_TRO_STYLE[n.vai_tro]}`}>
                      {VAI_TRO_NHAN[n.vai_tro]}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${TRANG_THAI_STYLE[n.trang_thai]}`}>
                      {TRANG_THAI_NHAN[n.trang_thai]}
                    </span>
                  </td>
                  <td className="p-4">{ngay(n.ngay_tao)}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (n.trang_thai === 'Bi_Khoa') {
                            hanh_dong(
                              () => moKhoaTaiKhoan(n.ten_tk),
                              `Đã mở khóa tài khoản @${n.ten_tk}.`
                            );
                          } else {
                            setThongBao('');
                            setLyDo('');
                            setDangChon(n);
                          }
                        }}
                      >
                        {n.trang_thai === 'Bi_Khoa' ? '🔓 Mở khóa' : '🔒 Khóa'}
                      </Button>
                      <Button
                        size="sm"
                        variant={n.vai_tro === 'Quan_Tri_Vien' ? 'danger' : 'primary'}
                        onClick={() =>
                          hanh_dong(
                            () => doiVaiTro(
                              n.ten_tk,
                              n.vai_tro === 'Quan_Tri_Vien' ? 'Nguoi_Dung' : 'Quan_Tri_Vien'
                            ),
                            n.vai_tro === 'Quan_Tri_Vien'
                              ? `Đã thu quyền admin @${n.ten_tk}.`
                              : `Đã cấp quyền admin @${n.ten_tk}.`
                          )
                        }
                      >
                        {n.vai_tro === 'Quan_Tri_Vien' ? 'Thu quyền' : 'Cấp quyền'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!hien_thi.length && (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-slate-500">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Nút chuyển trang dưới bảng người dùng */}
        <PhanTrang
          trang={trangChot}
          soTrang={soTrang}
          onDoiTrang={setTrang}
        />

        {/* Hộp thoại xác nhận khóa + ghi lý do */}
        {dang_chon && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setDangChon(null); }}
          >
            <section
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold">Khóa tài khoản @{dang_chon.ten_tk}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Người dùng không thể đăng nhập bằng tài khoản này.
              </p>
              <textarea
                rows="3"
                placeholder="Lý do (tùy chọn) - ghi vào nhật ký quản trị..."
                className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
                value={ly_do}
                onChange={(e) => setLyDo(e.target.value)}
              />
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDangChon(null)}>Hủy</Button>
                <Button variant="danger" onClick={() => hanh_dong(() => khoaTaiKhoan(dang_chon.ten_tk, ly_do), 'Tài khoản bị khóa.')}>
                  🔒 Xác nhận khóa
                </Button>
              </div>
            </section>
          </div>
        )}

        {/* Nhật ký quản trị theo collection nhat_ky_quan_tri */}
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Nhật ký quản trị (nhat_ky_quan_tri)</h2>
          {nhat_ky.length ? (
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
                  {nhat_ky.map((dong) => (
                    <tr key={dong.id} className="border-t border-slate-100">
                      <td className="p-4">{ngay(dong.ngay_tao)}</td>
                      <td className="p-4">@{dong.id_quan_tri_vien || '—'}</td>
                      <td className="p-4 font-semibold">{dong.hanh_dong}</td>
                      <td className="p-4">{dong.loai_doi_tuong}</td>
                      <td className="p-4 text-slate-600">{dong.ly_do || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              Chưa có thao tác quản trị nào được ghi nhận.
            </p>
          )}
        </section>

        <p className="mt-6 text-xs text-slate-500">
          Bản demo frontend: trạng thái khóa/vai trò lưu localStorage; cấu trúc trường khớp
          tài liệu DB (ten_tk, ho_ten, email, vai_tro, trang_thai, ngay_tao...) — chỉ cần cắm
          GET/PUT /api/admin/nguoi-dung khi backend hoàn thành. Người dùng bị khóa sẽ bị
          chặn đăng nhập phía frontend.
        </p>
    </KhungQuanTri>
  );
}
