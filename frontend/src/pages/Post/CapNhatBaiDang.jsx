
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import PostForm from '../../components/Post/PostForm';
import { getPostById, updatePost } from '../../services/postService';

export default function CapNhatBaiDang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = getPostById(id);

  function handleUpdate(formData) {
    const updated = updatePost(id, formData);

    if (!updated) {
      window.alert('Không tìm thấy bài đăng cần cập nhật.');
      return;
    }

    window.alert('Cập nhật bài đăng thành công!');
    navigate('/');
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

        {!post ? (
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
