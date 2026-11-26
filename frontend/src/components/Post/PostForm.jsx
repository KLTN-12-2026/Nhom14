
import { useState } from 'react';
import Button from '../Button/Button';
import { TYPE_OPTIONS } from '../../data/mockPosts';
import { nenAnh, ANH_TOI_DA_BYTES } from '../../utils/anh';

const ANH_TOI_DA = 10;

// Tài liệu đính kèm trong phần mô tả — chỉ nhận PDF, upload qua BE/GridFS
const LOAI_TAI_LIEU = ['application/pdf'];
const TAI_LIEU_TOI_DA_BYTES = 10 * 1024 * 1024; // 10 MB

const emptyForm = {
  title: '',
  type: 'crowdfund',
  creator: '',
  description: '',
  goal: '',
  deadline: '',
  images: [],
  taiLieu: '',
  tenTaiLieu: '',
};

function chuanHoaDanhSachAnh(data) {
  if (!data) return [];

  const nguon = Array.isArray(data.images) && data.images.length
    ? data.images
    : Array.isArray(data.hinh_anh) && data.hinh_anh.length
      ? data.hinh_anh
      : data.image
        ? [data.image]
        : [];

  return nguon
    .map((anh) => {
      if (typeof anh === 'string') return anh;
      if (anh && typeof anh === 'object') {
        return anh.duong_dan_hinh_anh || anh.url || '';
      }
      return '';
    })
    .filter(Boolean)
    .slice(0, ANH_TOI_DA);
}

// Đưa dữ liệu bài đăng vào form (dùng khi cập nhật bài đã đăng).
function khoiTaoForm(data) {
  if (!data) {
    return { ...emptyForm };
  }

  const images = chuanHoaDanhSachAnh(data);

  return {
    ...emptyForm,
    ...data,
    type: data.type || emptyForm.type,
    goal: data.goal ?? '',
    images,
    image: images[0] || '',
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
  // File PDF thật — caller upload qua BE sau khi bài có id (không đọc base64)
  const [tepTaiLieu, setTepTaiLieu] = useState(null);

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

  async function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const choPhep = form.images.length;
    const conTrong = ANH_TOI_DA - choPhep;
    if (conTrong <= 0) {
      setError(`Mỗi bài đăng chỉ được tối đa ${ANH_TOI_DA} ảnh.`);
      return;
    }

    const filesHopLe = [];
    for (const file of files.slice(0, conTrong)) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chỉ chọn tệp hình ảnh.');
        return;
      }
      if (file.size > ANH_TOI_DA_BYTES) {
        setError('Mỗi ảnh phải có dung lượng không quá 5 MB.');
        return;
      }
      filesHopLe.push(file);
    }

    try {
      const anhMoi = await Promise.all(filesHopLe.map((file) => nenAnh(file)));
      setForm((current) => {
        const images = [...current.images, ...anhMoi].slice(0, ANH_TOI_DA);
        return { ...current, images, image: images[0] || '' };
      });
      if (files.length > conTrong) {
        setError(`Chỉ thêm được ${conTrong} ảnh nữa (tối đa ${ANH_TOI_DA} ảnh).`);
      } else {
        setError('');
      }
    } catch {
      setError('Không thể đọc ảnh. Vui lòng thử lại.');
    }
  }

  function xoaAnh(taiViTri) {
    setForm((current) => {
      const images = current.images.filter((_, i) => i !== taiViTri);
      return { ...current, images, image: images[0] || '' };
    });
  }

  function handleTaiLieuChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const hopLe =
      LOAI_TAI_LIEU.includes(file.type) || /\.pdf$/i.test(file.name);
    if (!hopLe) {
      setError('Vui lòng chọn tệp PDF (.pdf).');
      event.target.value = '';
      return;
    }

    if (file.size > TAI_LIEU_TOI_DA_BYTES) {
      setError('Tài liệu phải có dung lượng không quá 10 MB.');
      event.target.value = '';
      return;
    }

    setTepTaiLieu(file);
    setForm((current) => ({ ...current, tenTaiLieu: file.name }));
    setError('');
  }

  function xoaTaiLieu(event) {
    setTepTaiLieu(null);
    setForm((current) => ({ ...current, taiLieu: '', tenTaiLieu: '' }));
    if (event.currentTarget.form?.elements?.taiLieuFile) {
      event.currentTarget.form.elements.taiLieuFile.value = '';
    }
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
      tepTaiLieu,
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

        {/* Tài liệu đính kèm: bổ sung cho phần mô tả, chỉ nhận PDF */}
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-slate-50/60 p-4">
          <label
            htmlFor="taiLieuFile"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Tài liệu đính kèm (PDF)
          </label>
          <input
            id="taiLieuFile"
            name="taiLieuFile"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleTaiLieuChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-yellow-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-yellow-200"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tùy chọn — chỉ nhận file PDF (kế hoạch, báo cáo...), tối đa 10 MB.
          </p>

          {tepTaiLieu && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <span className="text-lg" aria-hidden="true">📕</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
                {form.tenTaiLieu}
              </span>
              <Button variant="link" type="button" onClick={xoaTaiLieu}>
                Xóa tệp
              </Button>
            </div>
          )}
        </div>
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
          htmlFor="images"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Ảnh dự án
        </label>
        <input
          id="images"
          name="imageFiles"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="block w-full rounded-lg border border-gray-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-yellow-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-yellow-200"
        />
        <p className="mt-1 text-xs text-gray-500">
          Có thể chọn nhiều ảnh, tối đa {ANH_TOI_DA} ảnh, mỗi ảnh tối đa 5 MB.
          Ảnh đầu tiên sẽ là ảnh đại diện.
        </p>

        {form.images.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {form.images.map((anh, index) => (
              <div
                key={`${index}-${anh.slice(0, 24)}`}
                className="overflow-hidden rounded-lg border border-gray-200 bg-slate-50"
              >
                <img
                  src={anh}
                  alt={`Ảnh dự án ${index + 1}`}
                  className="h-40 w-full object-cover"
                />
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-semibold text-gray-600">
                    {index === 0 ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs"
                    onClick={() => xoaAnh(index)}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            ))}
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
