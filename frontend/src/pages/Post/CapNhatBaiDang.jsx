
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import PostForm from '../../components/Post/PostForm';
import {
  getPostById,
  layBaiDangBangId,
  capNhatBaiDang,
} from '../../services/postService';
import { tb } from '../../services/thongBaoService';

export default function CapNhatBaiDang() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Nạp bài ngay từ cache; chưa thấy thì hỏi thẳng BE (vừa bật BE, cache trễ)
  const [post, setPost] = useState(() => getPostById(id));
  const [dang_tai, setDangTai] = useState(!post);
  const [khong_thay, setKhongThay] = useState(false);

  useEffect(() => {
    if (post) return;

    let con_mo = true;

    layBaiDangBangId(id)
      .then((bai) => {
        if (!con_mo) return;
        if (bai) {
          setPost(bai);
        } else {
          setKhongThay(true);
        }
      })
      .catch(() => con_mo && setKhongThay(true))
      .finally(() => con_mo && setDangTai(false));

    return () => {
      con_mo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, Boolean(post)]);

  async function handleUpdate(formData) {
    try {
      const { baiDang, tu_be } = await capNhatBaiDang(id, formData);

      if (!baiDang) {
        tb.loi('Không tìm thấy bài đăng cần cập nhật.');
        return;
      }

      if (tu_be) {
        tb.thanhCong('Cập nhật thành công!');
      } else {
        // BE chưa nhận được thay đổi (chỉ cache trình duyệt + hàng chờ tự gửi).
        // Nói thật cho người dùng để tránh tưởng database đã cập nhật.
        tb.canhBao(
          'BE không kết nối được lúc này — thay đổi chỉ lưu trên trình duyệt, chưa vào database.'
        );
        tb.thongTin(
          'Bài sẽ tự gửi vào database khi BE chạy lại (mở lại trang hoặc quay lại tab). Nếu BE đang chạy, hãy thử Lưu lại một lần.'
        );
      }
      navigate('/bai-dang-cua-toi');
    } catch (error) {
      tb.loi(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50/50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-yellow-700">
            Trang chủ
          </Link>
          {' / '}
          <span className="text-gray-800">Cập nhật bài đăng</span>
        </div>

        {dang_tai ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">⏳ Đang tải bài đăng...</p>
          </section>
        ) : khong_thay || !post ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900">
              Không tìm thấy bài đăng
            </h1>
            <p className="mt-2 text-gray-600">
              Hãy tạo bài đăng trước khi cập nhật.
            </p>
            <Link
              to="/bai-dang/tao-moi"
              className="mt-5 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-gray-900"
            >
              Tạo bài đăng
            </Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-yellow-100 px-6 py-6 md:px-8">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Cập nhật bài đăng
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Chỉnh sửa thông tin dự án của bạn.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <PostForm
                key={post.id}
                initialData={post}
                onSubmit={handleUpdate}
                submitLabel="Lưu thay đổi"
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
