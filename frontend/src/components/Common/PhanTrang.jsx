// Nút chuyển trang dùng chung cho các danh sách dài (bài đăng, người dùng...).
// Giữ màn hình gọn: mỗi trang vừa khối lượng, có nút ‹ trái/phải, đánh số
// trang, dấu "…" rút gọn khi số trang lớn — thay cho danh sách kéo vô hạn.
//
//   <PhanTrang trang={trang} soTrang={soTrang} onDoiTrang={setTrang} />
//   (không hiển thị gì khi danh sách chỉ 1 trang)

export default function PhanTrang({ trang, soTrang, onDoiTrang }) {
  if (soTrang <= 1) return null;

  // Danh sách số trang hiển thị: 1 … (tr-1) tr (tr+1) … N
  function soTrangHien() {
    const nhan = [];
    const tap = new Set(
      [1, soTrang, trang, trang - 1, trang + 1].filter(
        (so) => so >= 1 && so <= soTrang
      )
    );
    // thêm 2 trang lân cận khi đang ở đầu/đuôi để cụm số liên tục
    if (trang <= 2) [2, 3].forEach((so) => so <= soTrang && tap.add(so));
    if (trang >= soTrang - 1) {
      [soTrang - 1, soTrang - 2].forEach(
        (so) => so >= 1 && tap.add(so)
      );
    }

    const giao = [...tap].sort((a, b) => a - b);
    giao.forEach((so, viTri) => {
      if (viTri > 0 && so - giao[viTri - 1] > 1) {
        nhan.push('…');
      }
      nhan.push(so);
    });
    return nhan;
  }

  const nutCu = 'rounded-lg px-3 py-1.5 text-sm font-bold transition';

  return (
    <nav
      aria-label="Phân trang"
      className="mt-7 flex flex-wrap items-center justify-center gap-2 pb-6"
    >
      {/* Trang trước */}
      <button
        type="button"
        disabled={trang <= 1}
        onClick={() => onDoiTrang(trang - 1)}
        className={`${nutCu} border ${
          trang <= 1
            ? 'cursor-not-allowed border-gray-100 text-gray-300'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900'
        }`}
        aria-label="Trang trước"
      >
        ‹ Trước
      </button>

      {soTrangHien().map((so, viTri) =>
        so === '…' ? (
          <span
            key={`vach-${viTri}`}
            className="px-1 text-sm font-bold text-gray-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={so}
            type="button"
            aria-current={so === trang ? 'page' : undefined}
            onClick={() => onDoiTrang(so)}
            className={
              so === trang
                ? `${nutCu} bg-amber-400 text-gray-900 shadow-sm shadow-amber-500/30 ring-2 ring-amber-400/40`
                : `${nutCu} border border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900`
            }
          >
            {so}
          </button>
        )
      )}

      {/* Trang sau */}
      <button
        type="button"
        disabled={trang >= soTrang}
        onClick={() => onDoiTrang(trang + 1)}
        className={`${nutCu} border ${
          trang >= soTrang
            ? 'cursor-not-allowed border-gray-100 text-gray-300'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900'
        }`}
        aria-label="Trang sau"
      >
        Sau ›
      </button>
    </nav>
  );
}
