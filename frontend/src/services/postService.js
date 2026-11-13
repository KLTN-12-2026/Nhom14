// Bài đăng: ưu tiên BE (FastAPI + MongoDB Atlas) — BE không chạy thì dùng
// chế độ demo cục bộ như cũ. Cách nối giữ nguyên "sync API" của các trang:
//   - ĐỌC: đồng bộ từ localStorage (nạp từ BE sẵn ở lần gọi đồng bộ trước)
//   - GHI: BE-first, BE trả lỗi thật thì hiện thẳng; BE không chạy thì lưu cục bộ
// Đây gọi là "BE cache-sync" — các trang không phải chuyển sang async.

import { getSession } from './authService';
import { LOI_KHONG_KET_NOI, coToken, goiApi } from './apiClient';
import { MOCK_POSTS, TYPE_OPTIONS } from '../data/mockPosts';

const STORAGE_KEY = 'rising-idea-posts'; // bài cục bộ (demo/tạo khi BE tắt)
const KEY_BE = 'rising-idea-be-posts'; // cache bài CÔNG KHAI chạy BE (Atlas thật)
const KEY_BE_MINE = 'rising-idea-be-posts-mine'; // cache "Bài đăng của tôi"
// (mọi trạng thái: Chờ duyệt / Từ chối / Bị ẩn) — tách khỏi cache công khai
// để bài chưa duyệt KHÔNG bao giờ lộ lên danh sách bài đăng chung.
// Hàng chờ các lần sửa bài chưa tới được DB (BE tắt lúc lưu) — khi BE chạy
// lại, App gọi dongBoTuBe() sẽ tự PUT lại vào DB, tránh bị sync phủ mất.
const KEY_CHO_DONG_BO = 'rising-idea-cho-dong-bo';

// Bản thử nghiệm frontend: lưu dữ liệu trong trình duyệt (localStorage).
// Lần đầu chạy, nếu chưa có dữ liệu sẽ nạp sẵn danh sách bài đăng mẫu
// để thử chức năng Góp vốn / Quyên góp.
// Dữ liệu cũ (tạo trước khi có ô chọn "Loại bài đăng") sẽ thiếu trường type —
// khi phát hiện dữ liệu không hợp lệ, nạp lại danh sách mẫu để chức năng
// Góp vốn / Quyên góp hiển thị đúng loại từng bài.
function laDuLieuHopLe(posts) {
  return (
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.every(
      (post) =>
        post &&
        typeof post === 'object' &&
        TYPE_OPTIONS.some((option) => option.value === post.type)
    )
  );
}

function docCache(prefix) {
  try {
    const posts = JSON.parse(localStorage.getItem(prefix) || '[]');
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

// Ghi cache an toàn: localStorage chỉ có ~5MB — cache lớn (ảnh base64 cũ,
// danh sách dài) văng QuotaExceededError làm cả trang sập. Lỗi quota thì
// bỏ qua im lặng: các trang vẫn render từ dữ liệu vừa tải, lần sync sau
// (bài đã có ảnh dạng URL nhỏ) cache sẽ vào bình thường.
function ghiCache(key, giaTri) {
  try {
    window['localStorage'].setItem(key, giaTri);
  } catch {
    // Quota vượt / privacy mode — không dừng luồng
  }
}

// ---- Hàng chờ đồng bộ lại các lần sửa (BE tắt lúc lưu) ----

function docHangCho() {
  return docCache(KEY_CHO_DONG_BO);
}

function luuHangCho(hang_doi) {
  ghiCache(KEY_CHO_DONG_BO, JSON.stringify(hang_doi));
}

async function duaHangChoCoDongBo() {
  const hang_doi = docHangCho();
  const da_xong = new Set();

  for (const muc of hang_doi) {
    try {
      const be = await goiApi(`/api/bai-dang/${muc.id}`, {
        method: 'PUT',
        body: muc.du_lieu,
      });

      if (be?.id) {
        // Cập nhật cache BE bằng bản ghi chuẩn từ BE
        const bang = docCache(KEY_BE).filter(
          (item) => String(item.id) !== String(be.id)
        );
        ghiCache(KEY_BE, JSON.stringify([...bang, be]));
        da_xong.add(String(muc.id));
      }
    } catch (error) {
      if (error.message !== LOI_KHONG_KET_NOI) {
        // BE từ chối rõ ràng (403 hết quyền / 404 / validation) — giữ bản BE,
        // bỏ khỏi hàng chờ để không retry vô hạn; lỗi hiện ở toast người dùng
        da_xong.add(String(muc.id));
      }
      // KHONG_KET_NOI: dừng kịch bản retry — BE kết nối tuột giữa chừng
      break;
    }
  }

  luuHangCho(hang_doi.filter((m) => !da_xong.has(String(m.id))));
  return da_xong.size;
}

// Map loại bài: DB/BE dùng tiếng Việt (enum LoaiBaiDang), form FE dùng mã Anh.
const LOAI_BE_SANG_FE = {
  'Gọi Vốn': 'crowdfund',
  'Quyên Góp': 'donation',
  'Đầu Tư': 'invest',
};
const TRANG_THAI_BE_SANG_FE = {
  Cho_Duyet: 'pending',
  Da_Duyet: 'approved',
  Tu_Choi: 'rejected',
};

// Đường dẫn ảnh tương đối (/api/media/...) -> đầy đủ kèm origin BE,
// vì trang FE chạy cổng khác (5173) — <img src="/api/.."> sẽ trỏ sai.
import { hoanChinhDuongDan as _hoanChinhDuongDan } from '../utils/duongDan';

// Đưa JSON của BE về shape bài đăng FE đang dùng (title/type/goal...).
// BE bản thân là source-of-truth của schema DB, nên các trường mới cũng
// được đưa qua (tieu_de/loai_bai_dang... để các trang quản trị dùng được).
// Ảnh BE lưu dạng đường dẫn (/api/media/... hay URL ngoài) — đường dẫn
// tương đối cần ghép origin của BE để <img> hiển thị được từ trang FE.
function beSangFe(baiDang) {
  const anh = baiDang.hinh_anh || [];
  const duongDanDau = _hoanChinhDuongDan(anh[0]?.duong_dan_hinh_anh);
  const ngayKetThuc = baiDang.thoi_gian_ket_thuc || null;

  return {
    id: baiDang.id,
    tu_be: true, // đánh dấu để phân biệt với bài cục bộ
    loai_bai_dang: baiDang.loai_bai_dang,
    tieu_de: baiDang.tieu_de,
    noi_dung: baiDang.noi_dung,
    trang_thai: baiDang.trang_thai,
    muc_tieu: baiDang.muc_tieu,
    don_vi_tien_te: baiDang.don_vi_tien_te || 'VND',
    thoi_gian_bat_dau: baiDang.thoi_gian_bat_dau || null,
    thoi_gian_ket_thuc: ngayKetThuc,
    // Tên người đăng BE ghép theo id lúc đọc — ai xem cũng thấy, kể cả
    // tài khoản thường (không cần danh sách admin).
    ten_nguoi_dang: baiDang.ten_nguoi_dang || '',
    id_nguoi_dang: baiDang.id_nguoi_dang || '',
    ngay_tao: baiDang.ngay_tao || '',
    ngay_cap_nhat: baiDang.ngay_cap_nhat || '',
    status: TRANG_THAI_BE_SANG_FE[baiDang.trang_thai] || 'pending',
    title: baiDang.tieu_de,
    description: baiDang.noi_dung,
    goal: baiDang.muc_tieu,
    type: LOAI_BE_SANG_FE[baiDang.loai_bai_dang] || baiDang.loai_bai_dang,
    deadline: ngayKetThuc ? ngayKetThuc.slice(0, 10) : '',
    image: duongDanDau,
    images: anh
      .map((item) => _hoanChinhDuongDan(item.duong_dan_hinh_anh))
      .filter(Boolean),
    raised: baiDang.raised || baiDang.so_tien_da_gop || 0,
    createdAt: baiDang.ngay_tao || '',
    updatedAt: baiDang.ngay_cap_nhat || '',
  };
}

// Đưa formData của form (PostForm) sang JSON BE cần (BaiDangCreate / Update).
// Form không có ô thời gian bắt đầu — để BE tự xử lý null.
function feSangBe(formData) {
  return {
    loai_bai_dang:
      {
        crowdfund: 'Gọi Vốn',
        donation: 'Quyên Góp',
        invest: 'Đầu Tư',
      }[formData.type] || formData.type,
    tieu_de: formData.title,
    noi_dung: formData.description,
    muc_tieu: Number(formData.goal),
    don_vi_tien_te: 'VND',
    thoi_gian_ket_thuc: formData.deadline,
    hinh_anh: formData.image ? [formData.image] : [],
  };
}

// GET /api/bai-dang công khai -> cache công khai; GET /cua-toi (mọi trạng
// thái) -> cache RIÊNG "Bài đăng của tôi". Hai nguồn tách bạch để bài Chờ
// duyệt / Từ chối / Bị ẩn không bao giờ lộ lên danh sách bài đăng chung.
// Gọi khi mở trang (App.jsx mount) — các trang đọc cache ngay sau đó.
export async function dongBoTuBe() {
  let dem = 0;

  try {
    // BE vừa kết nối: gửi lại các lần sửa chưa tới DB (hàng chờ) trước
    await duaHangChoCoDongBo();

    const congKhai = await goiApi('/api/bai-dang?limit=100');

    if (Array.isArray(congKhai)) {
      dem = congKhai.length;

      // Dựng LẠI cache từ kết quả BE (không giữ mảng cũ): bài bị ẩn/từ chối
      // rơi khỏi danh sách công khai của BE thì cũng phải biến mất khỏi
      // cache, nếu không bản cũ "Da_Duyet" ở lại localStorage vĩnh viễn
      // và lộ lên danh sách dù BE đã ẩn. Bản sửa "chờ duyệt" của cá nhân
      // vẫn hiển thị đúng ở trang "Bài đăng của tôi" (overlay hàng chờ).
      ghiCache(KEY_BE, JSON.stringify(congKhai));
    }
  } catch (error) {
    if (error.message === LOI_KHONG_KET_NOI) return 0;
    // BE trả lỗi khác 4xx/5xx -> vẫn thử lấy bài của tôi bên dưới
  }

  if (coToken()) {
    try {
      const cuaToi = await goiApi('/api/bai-dang/cua-toi');
      if (Array.isArray(cuaToi)) {
        // Cache riêng cho trang "Bài đăng của tôi" — KHÔNG hợp vào cache
        // công khai (bài chờ duyệt/từ chối/bị ẩn chỉ chủ bài được thấy).
        ghiCache(KEY_BE_MINE, JSON.stringify(cuaToi));
      }
    } catch {
      // chưa đăng nhập trên BE / lỗi — bỏ qua, bài công khai vẫn có
    }
  }

  return dem;
}

// Bài đăng dạng FE từ cache BE
export function layBaiTuBe() {
  return docCache(KEY_BE).map(beSangFe);
}

export function getPosts() {
  // Hợp nhất: bài cục bộ (demo + tạo khi BE tắt) + bài chạy BE thật.
  const posts = docCache(STORAGE_KEY);
  const baiBe = layBaiTuBe();

  if (!laDuLieuHopLe(posts)) {
    ghiCache(STORAGE_KEY, JSON.stringify(MOCK_POSTS));
    return hopNhatKhongTrung(MOCK_POSTS, baiBe);
  }

  if (baiBe.length) {
    // BE đang có bài thật: BỎ các bài mẫu demo (MOCK_POSTS) — BE đã có
    // bản thật cùng nội dung, giữ cả hai sẽ hiện 2 bài giống nhau và
    // người dùng bấm vào bản demo thì góp vốn/quyên góp chỉ lưu cục bộ.
    // Bài người dùng tự tạo khi BE tắt (id không thuộc MOCK_POSTS) vẫn giữ.
    const maMock = new Set(MOCK_POSTS.map((mock) => String(mock.id)));
    return hopNhatKhongTrung(
      posts.filter((post) => !maMock.has(String(post.id))),
      baiBe
    );
  }

  return hopNhatKhongTrung(posts, baiBe);
}

// Nối 2 dảy bài, bỏ con trùng mã bài đăng (ưu tiên các mục bên phải giữ lại)
function hopNhatKhongTrung(danhSachGoc, danhSachThem) {
  const daCo = new Set(
    danhSachGoc.filter(Boolean).map((post) => String(post.id))
  );
  return [
    ...danhSachGoc.filter(Boolean),
    ...danhSachThem.filter(
      (post) => post && !daCo.has(String(post.id))
    ),
  ];
}

function savePosts(posts) {
  ghiCache(STORAGE_KEY, JSON.stringify(posts));
}

export function getPostById(id) {
  return getPosts().find((post) => String(post.id) === String(id)) || null;
}

// Tìm bài ở mọi nguồn: cache hợp nhất, rồi thử BE trực tiếp (trường hợp
// BE vừa bật mà chưa kịp đồng bộ).
export async function layBaiDangBangId(id) {
  const trongCache = getPostById(id);
  if (trongCache) return trongCache;

  try {
    const be = await goiApi(`/api/bai-dang/${id}`);
    if (be?.id) {
      // nạp vào cache để lần sau đọc đồng bộ
      const bang = docCache(KEY_BE).filter(
        (item) => String(item.id) !== String(id)
      );
      ghiCache(KEY_BE, JSON.stringify([...bang, be]));
      return beSangFe(be);
    }
  } catch {
    // BE không chạy / không thấy — để trang xử lý "không tìm thấy"
  }

  return null;
}

export function createPost(postData) {
  // Chỉ đụng cache cục bộ — KHÔNG dùng getPosts() (đã hợp nhất cache BE,
  // ghi lại sẽ nhân đôi bài BE vào STORAGE_KEY).
  const posts = docCache(STORAGE_KEY);

  // Trường mới theo tài liệu DB (collection bai_dang):
  // don_vi_tien_te, id_nguoi_dang, ngay_tao. id_nguoi_dang lưu tên tài
  // khoản đang đăng nhập (MongoDB sẽ là ObjectId sau khi có backend).
  const session = getSession();
  const ngayTao = new Date().toISOString();

  const newPost = {
    raised: 0,
    ...postData,
    id: crypto.randomUUID(),
    don_vi_tien_te: 'VND',
    id_nguoi_dang: session?.ten_tk || '',
    ngay_tao: ngayTao,
    createdAt: ngayTao,
    status: 'pending',
  };

  savePosts([...posts, newPost]);
  return newPost;
}

// Tạo bài: BE-first (trạng thái Chờ duyệt do BE tự đặt), lỗi kết nối
// thì rơi về bản cục bộ. Trả về bài dạng FE; có cờ tu_be khi tạo thành
// công trên BE.
export async function taoBaiDang(postData) {
  try {
    const be = await goiApi('/api/bai-dang', {
      method: 'POST',
      body: feSangBe(postData),
    });

    if (be?.id) {
      // Bài mới là Chờ duyệt -> vào cache "Bài đăng của tôi", KHÔNG vào
      // cache công khai (chỉ hiện ở danh sách chung sau khi admin duyệt).
      ghiCache(
        KEY_BE_MINE,
        JSON.stringify([be, ...docCache(KEY_BE_MINE).filter(
          (item) => String(item.id) !== String(be.id)
        )])
      );
      return { baiDang: beSangFe(be), tu_be: true };
    }
  } catch (error) {
    // BE trả lỗi thật (ví dụ "tieu_de quá ngắn") -> hiện thẳng
    if (error.message !== LOI_KHONG_KET_NOI) {
      throw error;
    }
  }

  return { baiDang: createPost(postData), tu_be: false };
}

export function updatePost(id, postData) {
  const duLieuBe = feSangBe(postData);

  // 1) Bài từ BE nằm trong cache BE (rất thường gặp: bài tạo qua BE).
  // BE tắt -> mô phỏng logic BE trên cache: cập nhật + bài đã duyệt về chờ duyệt (PB08).
  const cacheBe = docCache(KEY_BE);
  const viTriBe = cacheBe.findIndex(
    (item) => String(item.id) === String(id)
  );

  if (viTriBe !== -1) {
    const bai = cacheBe[viTriBe];
    const danhSachAnh = duLieuBe.hinh_anh?.length
      ? duLieuBe.hinh_anh
      : (bai.hinh_anh || []).map((anh) => anh.duong_dan_hinh_anh);

    const baiCapNhat = {
      ...bai,
      ...duLieuBe,
      hinh_anh: danhSachAnh.map((duong_dan, thu_tu) => ({
        id: bai.hinh_anh?.[thu_tu]?.id || `anh-${Date.now()}-${thu_tu}`,
        duong_dan_hinh_anh: duong_dan,
        thu_tu_hien_thi: thu_tu + 1,
      })),
      ngay_cap_nhat: new Date().toISOString(),
    };

    // PB08: sửa bài đã duyệt -> quay về chờ duyệt (giống BE xử lý)
    if (bai.trang_thai === 'Da_Duyet') {
      baiCapNhat.trang_thai = 'Cho_Duyet';
      baiCapNhat.id_nguoi_duyet = null;
    }

    cacheBe[viTriBe] = baiCapNhat;
    ghiCache(KEY_BE, JSON.stringify(cacheBe));

    // Đánh dấu bản sửa chưa tới DB: đưa vào hàng chờ, dongBoTuBe() sẽ tự
    // PUT lại vào MongoDB khi BE đủ chạy — tránh lần sync sau phủ mất thay đổi.
    luuHangCho([
      ...docHangCho().filter((muc) => String(muc.id) !== String(id)),
      { id, du_lieu: duLieuBe, thoi_diem: new Date().toISOString() },
    ]);

    return beSangFe(baiCapNhat);
  }

  // 2) Bài CP cục bộ (demo + tạo khi BE tắt)
  // Chỉ đụng cache cục bộ (lý do như createPost)
  const posts = docCache(STORAGE_KEY);
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPost = {
    ...posts[index],
    ...postData,
    id,
    updatedAt: new Date().toISOString(),
    // Theo tài liệu DB (collection bai_dang)
    ngay_cap_nhat: new Date().toISOString(),
  };

  posts[index] = updatedPost;
  savePosts(posts);

  return updatedPost;
}

// Cập nhật bài: BE-first, BE duyệt lại từ đầu (đã duyệt -> về chờ duyệt
// do BE xử lý). BE không chạy -> fallback cục bộ như cũ.
export async function capNhatBaiDang(id, postData) {
  try {
    const be = await goiApi(`/api/bai-dang/${id}`, {
      method: 'PUT',
      body: feSangBe(postData),
    });

    if (be?.id) {
      // Log rõ: cập nhật đã vào DATABASE BE (Atlas) — xác nhận bằng log này
      console.log(
        `[postService] Cập nhật đã lưu vào DATABASE BE (bài ${id}, ngày cập nhật ${be.ngay_cap_nhat})`
      );
      ghiCache(
        KEY_BE,
        JSON.stringify([...docCache(KEY_BE).filter(
          (item) => String(item.id) !== String(id)
        ), be])
      );
      return { baiDang: beSangFe(be), tu_be: true };
    }
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) {
      // BE nhận được yêu cầu nhưng từ chối (sai quyền / sai dữ liệu / 401)
      console.warn(
        `[postService] BE từ chối cập nhật bài ${id}: ${error.message}`
      );
      throw error;
    }
    // BE không kết nối được (tắt / treo / CORS) — đặt ret ngay dòng này
    console.warn(
      `[postService] KHÔNG kết nối được BE khi cập nhật bài ${id} — đưa vào hàng chờ đồng bộ lại`
    );
  }

  return { baiDang: updatePost(id, postData), tu_be: false };
}

export function tangTienHuyDong(id, soTien) {
  // Bài BE: cập nhật cache BE (BE chưa có module giao dịch — đỡ vẽ lại tiền)
  const cacheBe = docCache(KEY_BE);
  const viTriBe = cacheBe.findIndex(
    (item) => String(item.id) === String(id)
  );

  if (viTriBe !== -1) {
    cacheBe[viTriBe] = {
      ...cacheBe[viTriBe],
      raised: (cacheBe[viTriBe].raised || 0) + soTien,
    };
    ghiCache(KEY_BE, JSON.stringify(cacheBe));
    return beSangFe(cacheBe[viTriBe]);
  }

  // Bài cục bộ
  const posts = docCache(STORAGE_KEY);
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPost = {
    ...posts[index],
    raised: (posts[index].raised || 0) + soTien,
    ngay_cap_nhat: new Date().toISOString(),
  };

  savePosts(posts);

  return updatedPost;
}

export function deletePost(id) {
  const session = getSession();

  if (!session) {
    throw new Error('Vui lòng đăng nhập!');
  }

  const posts = docCache(STORAGE_KEY);

  const post = posts.find((item) => String(item.id) === String(id));

  if (!post) {
    throw new Error('Không tìm thấy bài đăng!');
  }

  if (post.id_nguoi_dang !== session.ten_tk) {
    throw new Error('Bạn không có quyền xóa bài này!');
  }

  const updatedPosts = posts.filter(
    (item) => String(item.id) !== String(id)
  );

  ghiCache(STORAGE_KEY, JSON.stringify(updatedPosts));

  return true;
}

// Xóa bài: BE-first (chỉ chủ bài), BE không chạy -> xóa cục bộ.
export async function xoaBaiDang(id) {
  try {
    const be = await goiApi(`/api/bai-dang/${id}`, { method: 'DELETE' });

    if (!be) {
      // BE xóa xong (204 không nội dung)
      ghiCache(
        KEY_BE,
        JSON.stringify(
          docCache(KEY_BE).filter(
            (item) => String(item.id) !== String(id)
          )
        )
      );
      // Dọn cả cache quản trị: nếu không, bài đã xóa còn nằm trong trang
      // Duyệt/Quản lý của admin -> từ chối lại báo "Không tìm thấy bài đăng".
      ghiCache(
        'rising-idea-be-admin-posts',
        JSON.stringify(
          docCache('rising-idea-be-admin-posts').filter(
            (item) => String(item.id) !== String(id)
          )
        )
      );
      return { tu_be: true };
    }
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) {
      throw error;
    }
  }

  return { tu_be: false, ket_qua: deletePost(id) };
}

// Bài của tôi (PB09): BE chạy -> GET /api/bai-dang/cua-toi; BE không chạy
// -> lọc cục bộ theo tên tài khoản (trang BaiDangCuaToi dùng).
export async function layBaiDangCuaToi() {
  if (coToken()) {
    try {
      const cuaToi = await goiApi('/api/bai-dang/cua-toi');

      if (Array.isArray(cuaToi)) {
        // Các thay đổi đang nằm trong hàng chờ (chưa tới DB) — đè lên bản
        // BE khi hiển thị để trang khớp với lần sửa vừa làm của người dùng.
        const hangCho = docHangCho();
        const daChinhSua = cuaToi.map((bai) => {
          const muc = hangCho.find(
            (item) => String(item.id) === String(bai.id)
          );

          if (!muc) return bai;

          const datQuaVe = {
            ...bai,
            ...muc.du_lieu,
            // Mô phỏng PB08 như BE làm: sửa bài đã duyệt -> về chờ duyệt
            trang_thai:
              bai.trang_thai === 'Da_Duyet'
                ? 'Cho_Duyet'
                : bai.trang_thai,
            ngay_cap_nhat: muc.thoi_diem,
          };

          return datQuaVe;
        });

        return daChinhSua.map(beSangFe);
      }
    } catch (error) {
      // BE trả lỗi thật (hết hạn token...) -> ném lên để trang hiện
      if (error.message !== LOI_KHONG_KET_NOI) throw error;
    }
  }

  const username = getSession()?.ten_tk || '';
  return getPosts().filter((post) => post.id_nguoi_dang === username);
}
