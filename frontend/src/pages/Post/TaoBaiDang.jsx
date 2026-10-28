
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import PostForm from '../../components/Post/PostForm';
import { createPost } from '../../services/postService';

export default function TaoBaiDang() {
  const navigate = useNavigate();

  function handleCreate(formData) {
    createPost(formData);
    window.alert('Tạo bài đăng thành công trên bản thử nghiệm!');
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
          <span className="text-gray-800">Tạo bài đăng</span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-yellow-100 px-6 py-6 md:px-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-yellow-800">
              Rising Idea
            </p>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Tạo bài đăng dự án
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Chia sẻ ý tưởng của bạn và giới thiệu mục tiêu gây quỹ với cộng đồng.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <p className="mb-6 text-sm text-gray-500">
              Các trường có dấu <span className="text-red-500">*</span> là bắt buộc.
            </p>
            <PostForm
              onSubmit={handleCreate}
              submitLabel="Tạo bài đăng"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
