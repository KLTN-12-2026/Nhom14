
import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button/Button';
import KhungQuanTri from '../../components/Admin/KhungQuanTri';
import PhanTrang from '../../components/Common/PhanTrang';
import { tb } from '../../services/thongBaoService';
import {
  layYeuCauNapTien,
  duyetNapTien,
  tuChoiNapTien,
} from '../../services/napTienAdminService';
import { layCauHinhNap } from '../../services/walletService';

const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const TRANG_THAI = {
  Cho_Xu_Ly: { nhan: 'Chờ duyệt', style: 'bg-amber-100 text-amber-800' },
  Thanh_cong: { nhan: 'Đã duyệt', style: 'bg-emerald-100 text-emerald-800' },
  That_bai: { nhan: 'Từ chối', style: 'bg-rose-100 text-rose-800' },
  Da_Huy: { nhan: 'Đã hủy', style: 'bg-slate-200 text-slate-600' },
};

const ngay = (gia_tri) =>
  gia_tri ? new Date(gia_tri).toLocaleString('vi-VN') : '—';

const SO_DONG_MOI_TRANG = 10;

// PB19 mở rộng: duyệt yêu cầu nạp tiền qua QR ngân hàng.
// Admin đối chiếu sao kê: đúng mã + đúng số tiền -> Duyệt (cộng ví),
// chưa nhận được tiền / sai nội dung -> Từ chối kèm lý do.
export default function DuyetNapTien() {
  const [danh_sach, setDanhSach] = useState(null); // null = đang tải
  const [loi, setLoi] = useState('');
  const [bo_loc, setBoLoc] = useState('Cho_Xu_Ly');
  const [trang, setTrang] = useState(1);
  const [cau_hinh, setCauHinh] = useState(null);

  const [dang_duyet, setDangDuyet] = useState(null);
  const [dang_tu_choi, setDangTuChoi] = useState(null);
  const [ghi_chu, setGhiChu] = useState('');
  const [ly_do, setLyDo] = useState('');
  const [dang_gui, setDangGui] = useState(false);

  const tai = useCallback(async () => {
    try {
      const ket_qua = await layYeuCauNapTien();

      if (ket_qua === null) {
        setDanhSach([]);
        setLoi(
          'Không kết nối được hệ thống BE. Khởi động backend rồi bấm Làm mới.'
        );
        return;
      }

      setDanhSach(ket_qua);
      setLoi('');
    } catch (error) {
      setDanhSach([]);
      setLoi(error.message);
    }
  }, []);

  useEffect(() => {
    let con_hieu_luc = true;

    (async () => {
      try {
        const ket_qua = await layYeuCauNapTien();

        if (!con_hieu_luc) return;

        if (ket_qua === null) {
          setDanhSach([]);
          setLoi(
            'Không kết nối được hệ thống BE. Khởi động backend rồi bấm Làm mới.'
          );
          return;
        }

        setDanhSach(ket_qua);
        setLoi('');
      } catch (error) {
        if (!con_hieu_luc) return;
        setDanhSach([]);
        setLoi(error.message);
      }
    })();

    layCauHinhNap().then((cauHinh) => {
      if (con_hieu_luc) setCauHinh(cauHinh);
    });

    return () => {
      con_hieu_luc = false;
    };
  }, []);

  const so_dem = useMemo(() => {
    const ds = danh_sach || [];
    return {
      all: ds.length,
      Cho_Xu_Ly: ds.filter((d) => d.trang_thai === 'Cho_Xu_Ly').length,
      Thanh_cong: ds.filter((d) => d.trang_thai === 'Thanh_cong').length,
      That_bai: ds.filter((d) => d.trang_thai === 'That_bai').length,
    };
  }, [danh_sach]);

  const hien_thi = useMemo(() => {
    const ds = danh_sach || [];
    if (bo_loc === 'all') return ds;
    return ds.filter((d) => d.trang_thai === bo_loc);
  }, [danh_sach, bo_loc]);

  const soTrang = Math.max(1, Math.ceil(hien_thi.length / SO_DONG_MOI_TRANG));
  const trangChot = Math.min(trang, soTrang);
  const hien_thi_trang = hien_thi.slice(
    (trangChot - 1) * SO_DONG_MOI_TRANG,
    trangChot * SO_DONG_MOI_TRANG
  );

  async function xacNhanDuyet() {
    if (!dang_duyet || dang_gui) return;

    setDangGui(true);

    try {
      await duyetNapTien(dang_duyet.id, ghi_chu);
      tb.thanhCong(
        `Đã duyệt ${VND.format(dang_duyet.so_tien)} cho @${
          dang_duyet.ten_tk || 'người dùng'
        }.`
      );
      setDangDuyet(null);
      setGhiChu('');
      await tai();
    } catch (error) {
      tb.loi(error.message);
    } finally {
      setDangGui(false);
    }
  }

  async function xacNhanTuChoi() {
    if (!dang_tu_choi || dang_gui) return;

    if (!ly_do.trim()) {
      tb.loi('Vui lòng nhập lý do từ chối.');
      return;
    }

    setDangGui(true);

    try {
      await tuChoiNapTien(dang_tu_choi.id, ly_do);
      tb.thanhCong('Đã từ chối yêu cầu nạp tiền.');
      setDangTuChoi(null);
      setLyDo('');
      await tai();
    } catch (error) {
      tb.loi(error.message);
    } finally {
      setDangGui(false);
    }
  }

  return (
    <KhungQuanTri
      tieuDe="Duyệt nạp tiền"
      moTa="Đối chiếu sao kê ngân hàng với mã giao dịch. Chỉ khi bấm Duyệt, tiền mới được cộng vào ví người dùng."
    >
      {/* Tài khoản nhận tiền hiện tại */}
      <div
        className={`mb-6 rounded-2xl border p-5 shadow-sm ${
          cau_hinh?.da_cau_hinh
            ? 'border-emerald-200 bg-emerald-50/70'
            : 'border-amber-300 bg-amber-50/70'
        }`}
      >
        <p className="text-sm font-bold text-gray-900">
          {cau_hinh?.da_cau_hinh
            ? '🏦 Tài khoản ngân hàng nhận tiền'
            : '⚠️ Chưa cấu hình tài khoản nhận tiền'}
        </p>

        {cau_hinh?.da_cau_hinh ? (
          <p className="mt-1 text-sm text-gray-700">
            <b>{cau_hinh.ngan_hang}</b> · STK{' '}
            <b>{cau_hinh.so_tai_khoan}</b> · Chủ TK{' '}
            <b>{cau_hinh.chu_tai_khoan}</b>
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-800">
            Thêm <code>BANK_ID</code>, <code>BANK_ACCOUNT_NO</code>,{' '}
            <code>BANK_ACCOUNT_NAME</code> vào <code>backend/.env</code> rồi
            khởi động lại BE. Người dùng vẫn tạo được yêu cầu nhưng QR là bản
            demo.
          </p>
        )}
      </div>

      {/* Thẻ đếm / bộ lọc trạng thái */}
      <div className="mb-7 grid gap-4 sm:grid-cols-4">
        {[
          ['Tất cả', 'all'],
          [TRANG_THAI.Cho_Xu_Ly.nhan, 'Cho_Xu_Ly'],
          [TRANG_THAI.Thanh_cong.nhan, 'Thanh_cong'],
          [TRANG_THAI.That_bai.nhan, 'That_bai'],
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

      {/* Thanh công cụ */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Mẹo: mã chuyển khoản (<b>NAP...</b>) nằm trong nội dung CK trên sao
          kê. Đúng mã + đúng số tiền thì hãy duyệt.
        </p>

        <Button variant="outline" onClick={tai}>
          🔄 Làm mới danh sách
        </Button>
      </div>

      {loi && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {loi}
        </p>
      )}

      {/* Bảng yêu cầu nạp tiền */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-4">Người nộp</th>
              <th className="p-4">Số tiền</th>
              <th className="p-4">Mã chuyển khoản</th>
              <th className="p-4">Thời gian tạo</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {hien_thi_trang.map((dong) => {
              const trang_thai =
                TRANG_THAI[dong.trang_thai] || {
                  nhan: dong.trang_thai,
                  style: 'bg-slate-100 text-slate-700',
                };

              return (
                <tr
                  key={dong.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4">
                    <p className="font-semibold">
                      {dong.ho_ten || dong.ten_tk || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{dong.ten_tk || '—'}
                      {dong.email ? ` · ${dong.email}` : ''}
                    </p>
                  </td>

                  <td className="p-4 font-bold text-gray-900">
                    {VND.format(dong.so_tien)}
                  </td>

                  <td className="p-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800">
                      {dong.ma_giao_dich || '—'}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap text-slate-500">
                    {ngay(dong.ngay_tao)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${trang_thai.style}`}
                    >
                      {trang_thai.nhan}
                    </span>

                    {dong.ly_do_tu_choi && (
                      <p className="mt-1 max-w-[220px] text-xs text-rose-600">
                        Lý do: {dong.ly_do_tu_choi}
                      </p>
                    )}

                    {dong.ghi_chu_duyet && (
                      <p className="mt-1 max-w-[220px] text-xs text-slate-500">
                        Ghi chú: {dong.ghi_chu_duyet}
                      </p>
                    )}
                  </td>

                  <td className="p-4">
                    {dong.trang_thai === 'Cho_Xu_Ly' ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setGhiChu('');
                            setDangDuyet(dong);
                          }}
                        >
                          ✅ Duyệt
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setLyDo('');
                            setDangTuChoi(dong);
                          }}
                        >
                          🚫 Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {dong.ngay_duyet
                          ? `Xử lý lúc ${ngay(dong.ngay_duyet)}`
                          : 'Đã xử lý'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!hien_thi_trang.length && (
              <tr>
                <td colSpan="6" className="px-6 py-14 text-center text-slate-500">
                  {danh_sach === null
                    ? 'Đang tải danh sách...'
                    : 'Không có yêu cầu nạp tiền phù hợp.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PhanTrang
        trang={trangChot}
        soTrang={soTrang}
        onDoiTrang={setTrang}
      />

      {/* Modal xác nhận duyệt */}
      {dang_duyet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !dang_gui) setDangDuyet(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold">Duyệt yêu cầu nạp tiền</h2>
            <p className="mt-2 text-sm text-slate-500">
              Chỉ bấm duyệt sau khi đã kiểm tra sao kê ngân hàng và thấy đúng
              số tiền + mã chuyển khoản.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="flex justify-between gap-3 py-1">
                <span className="text-slate-500">Người nộp</span>
                <b>
                  @{dang_duyet.ten_tk || '—'}
                  {dang_duyet.ho_ten ? ` · ${dang_duyet.ho_ten}` : ''}
                </b>
              </p>
              <p className="flex justify-between gap-3 py-1">
                <span className="text-slate-500">Số tiền</span>
                <b className="text-emerald-700">
                  {VND.format(dang_duyet.so_tien)}
                </b>
              </p>
              <p className="flex justify-between gap-3 py-1">
                <span className="text-slate-500">Mã CK</span>
                <b className="font-mono">{dang_duyet.ma_giao_dich || '—'}</b>
              </p>
            </div>

            <label
              className="mt-4 block text-sm font-semibold text-slate-700"
              htmlFor="ghi_chu_duyet"
            >
              Ghi chú (tùy chọn)
            </label>
            <textarea
              id="ghi_chu_duyet"
              rows="2"
              placeholder="Ví dụ: Đã đối chiếu sao kê MB lúc 20:15..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
              value={ghi_chu}
              onChange={(e) => setGhiChu(e.target.value)}
            />

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDangDuyet(null)}
                disabled={dang_gui}
              >
                Hủy
              </Button>

              <Button onClick={xacNhanDuyet} disabled={dang_gui}>
                {dang_gui ? 'Đang xử lý...' : '✅ Xác nhận đã nhận tiền'}
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Modal từ chối */}
      {dang_tu_choi && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !dang_gui) setDangTuChoi(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold">Từ chối yêu cầu nạp tiền</h2>
            <p className="mt-2 text-sm text-slate-500">
              Người dùng sẽ nhận thông báo kèm lý do này. Số dư không thay đổi.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="flex justify-between gap-3 py-1">
                <span className="text-slate-500">Người nộp</span>
                <b>@{dang_tu_choi.ten_tk || '—'}</b>
              </p>
              <p className="flex justify-between gap-3 py-1">
                <span className="text-slate-500">Số tiền</span>
                <b>{VND.format(dang_tu_choi.so_tien)}</b>
              </p>
              <p className="flex justify-between gap-3 py-1">
                <span className="text-slate-500">Mã CK</span>
                <b className="font-mono">{dang_tu_choi.ma_giao_dich || '—'}</b>
              </p>
            </div>

            <label
              className="mt-4 block text-sm font-semibold text-slate-700"
              htmlFor="ly_do_tu_choi"
            >
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="ly_do_tu_choi"
              rows="3"
              placeholder="Ví dụ: Chưa thấy giao dịch trong sao kê ngân hàng..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
              value={ly_do}
              onChange={(e) => setLyDo(e.target.value)}
            />

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDangTuChoi(null)}
                disabled={dang_gui}
              >
                Hủy
              </Button>

              <Button variant="danger" onClick={xacNhanTuChoi} disabled={dang_gui}>
                {dang_gui ? 'Đang xử lý...' : '🚫 Xác nhận từ chối'}
              </Button>
            </div>
          </section>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Dữ liệu lấy từ BE (GET /api/admin/nap-tien). Duyệt/từ chối ghi vào
        giao_dich + nhat_ky_quan_tri và gửi thông báo cho người dùng.
      </p>
    </KhungQuanTri>
  );
}
