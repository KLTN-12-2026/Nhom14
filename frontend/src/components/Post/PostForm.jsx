
import { useState } from 'react';
import Button from '../Button/Button';
import { TYPE_OPTIONS } from '../../data/mockPosts';

const emptyForm = {
  title: '',
  type: 'crowdfund',
  creator: '',
  description: '',
  goal: '',
  deadline: '',
  image: '',
};

// Đưa dữ liệu bài đăng vào form (dùng khi cập nhật bài đã đăng).
function khoiTaoForm(data) {
  if (!data) {
    return { ...emptyForm };
  }

  return {
    ...emptyForm,
    ...data,
    type: data.type || emptyForm.type,
    goal: data.goal ?? '',
  };
}

export default function PostForm({
  initialData,
  onSubmit,
  submitLabel = 'Lưu bài đăng',
}) {
  // Khởi tạo form một lần từ initialData. Trang cập nhật truyền key={post.id}
  // nên khi đổi bài đăng, component được tạo lại với dữ liệu mới —
  // không cần useEffect (tránh lỗi react-hooks/set-state-in-effect).
  const [form, setForm] = useState(() => khoiTaoForm(initialData));
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    // Ô nhập tiền chỉ nhận chữ số — cho phép gõ số bình thường,
    // tránh hành vi khó chịu của input type="number" (mũi tên, chấp nhận 'e'...).
    const giaTri = name === 'goal' ? value.replace(/\D/g, '') : value;

    setForm((current) => ({
      ...current,
      [name]: giaTri,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một tệp hình ảnh.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh phải có dung lượng không quá 5 MB.');
      event.target.value = '';
      return;
    }

    // Nén ảnh trước khi lưu: BE từng lưu base64 thô (1 ảnh ~2MB) làm tràn
    // cache localStorage của FE. Canvas thu nhỏ về tối đa 1280px + JPEG
    // 0.8 -> ~100KB. Lỗi nén thì dùng data URL nguyên bản như cũ.
    nenAnh(file)
      .then((dataUrl) => {
        setForm((current) => ({ ...current, image: dataUrl }));
        setError('');
      })
      .catch(() => {
        setError('Không thể đọc ảnh. Vui lòng thử lại.');
      });
  }

  // Trả Promise<dataURL> — ảnh đã thu nhỏ + nén JPEG.
  function nenAnh(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('doc anh loi'));

      reader.onload = () => {
        try {
          const img = new Image();

          img.onerror = () => reject(new Error('tai anh loi'));
          img.onload = () => {
            try {
              const TOI_DA = 1280;
              const tiLe = Math.min(1, TOI_DA / Math.max(img.width, img.height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.round(img.width * tiLe);
              canvas.height = Math.round(img.height * tiLe);
              canvas
                .getContext('2d')
                .drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } catch {
              resolve(String(reader.result));
            }
          };

          img.src = String(reader.result);
        } catch {
          reject(new Error('nen anh loi'));
        }
      };

      reader.readAsDataURL(file);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const goal = Number(form.goal);

    if (!Number.isFinite(goal) || goal <= 0) {
      setError('Mục tiêu gây quỹ phải lớn hơn 0.');
      return;
    }

    if (form.deadline < new Date().toLocaleDateString('en-CA')) {
      setError('Hạn gây quỹ không được nằm trong quá khứ.');
      return;
    }

    onSubmit({
      ...form,
      goal,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Tên dự án <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          maxLength={150}
          placeholder="Nhập tên dự án"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        />
      </div>

      <div>
        <label
          htmlFor="type"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Loại bài đăng <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {TYPE_OPTIONS.find((option) => option.value === form.type)?.hint}
        </p>
      </div>

      <div>
        <label
          htmlFor="creator"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Người tạo / nhóm thực hiện <span className="text-red-500">*</span>
        </label>
        <input
          id="creator"
          name="creator"
          value={form.creator}
          onChange={handleChange}
          required
          maxLength={100}
          placeholder="Nhập tên người tạo hoặc nhóm"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Mô tả dự án <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          placeholder="Giới thiệu ý tưởng, mục tiêu và tác động của dự án..."
          className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        />
        <p className="mt-1 text-right text-xs text-gray-500">
          {form.description.length}/5000 ký tự
        </p>
      </div>

      <div>
        <label
          htmlFor="goal"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Mục tiêu gây quỹ (VNĐ) <span className="text-red-500">*</span>
        </label>
        <input
          id="goal"
          name="goal"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={form.goal}
          onChange={handleChange}
          required
          placeholder="Ví dụ: 50000000"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        />
        {form.goal && (
          <p className="mt-1 text-xs text-gray-500">
            ≈ {new Intl.NumberFormat('vi-VN').format(Number(form.goal))} VNĐ
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="deadline"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Hạn gây quỹ <span className="text-red-500">*</span>
        </label>
        <input
          id="deadline"
          name="deadline"
          type="date"
          value={form.deadline}
          onChange={handleChange}
          min={new Date().toLocaleDateString('en-CA')}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        />
      </div>

      <div>
        <label
          htmlFor="image"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Ảnh đại diện dự án
        </label>
        <input
          id="image"
          name="imageFile"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full rounded-lg border border-gray-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-yellow-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-yellow-200"
        />
        <p className="mt-1 text-xs text-gray-500">
          Chọn ảnh từ máy tính, tối đa 5 MB.
        </p>

        {form.image && (
          <div className="mt-4">
            <img
              src={form.image}
              alt="Xem trước ảnh dự án"
              className="max-h-64 w-full rounded-lg border border-gray-200 object-contain"
            />
            <Button
              variant="link"
              className="mt-2"
              onClick={() =>
                setForm((current) => ({ ...current, image: '' }))
              }
            >
              Xóa ảnh
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.history.back()}
        >
          Quay lại
        </Button>
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
