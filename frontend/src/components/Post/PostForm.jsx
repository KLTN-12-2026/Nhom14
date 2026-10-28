
import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  creator: '',
  description: '',
  goal: '',
  deadline: '',
  image: '',
};

export default function PostForm({
  initialData,
  onSubmit,
  submitLabel = 'Lưu bài đăng',
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        ...emptyForm,
        ...initialData,
        goal: initialData.goal ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
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

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: String(reader.result),
      }));
      setError('');
    };

    reader.onerror = () => {
      setError('Không thể đọc ảnh. Vui lòng thử lại.');
    };

    reader.readAsDataURL(file);
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
          type="number"
          min="1"
          step="1000"
          value={form.goal}
          onChange={handleChange}
          required
          placeholder="Ví dụ: 50000000"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
        />
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
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({ ...current, image: '' }))
              }
              className="mt-2 text-sm font-medium text-red-600 hover:underline"
            >
              Xóa ảnh
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Quay lại
        </button>
        <button
          type="submit"
          className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition hover:bg-yellow-500"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
