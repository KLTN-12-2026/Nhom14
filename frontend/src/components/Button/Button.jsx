// Nút bấm dùng chung cho toàn dự án — thống nhất màu sắc, kích thước, bo góc
// tại đúng một nơi này (không viết style nút rải rác trong các file khác).
// Màu vàng thương hiệu: #ffdf19 (hover: #f2cd00).
//
// Cách dùng:
//   <Button onClick={...}>Lưu</Button>                     → nút vàng chính
//   <Button variant="outline" onClick={...}>Quay lại</Button>
//   <Button variant="outline-dark" size="lg">Tạo bài đăng</Button>
//   <Button variant="danger">Xóa</Button>
//   <Button variant="ghost" size="sm">Bỏ chọn</Button>
//   <Button variant="link" onClick={...}>Xóa ảnh</Button>  → nút dạng liên kết
//   <Button type="submit" disabled className="w-full">Đăng bài</Button>
//   <Button as={Link} to="/bai-dang/tao-moi">Tạo bài đăng</Button> → nút dẫn link

const VARIANTS = {
  primary:
    'bg-[#ffdf19] font-bold text-gray-900 shadow-sm hover:bg-[#f2cd00]',
  outline:
    'border border-gray-300 bg-white font-semibold text-gray-700 hover:bg-gray-50',
  'outline-dark':
    'border-2 border-gray-800 bg-transparent font-bold text-gray-900 hover:bg-white',
  danger:
    'border border-red-300 bg-red-50 font-semibold text-red-700 hover:bg-red-100',
  ghost: 'bg-transparent font-medium text-gray-600 hover:bg-gray-100',
  link: 'bg-transparent px-0 py-0 font-medium text-red-600 hover:underline',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...otherProps
}) {
  // Nút dạng liên kết (link) không dùng đệm của size.
  const sizeClass = variant === 'link' ? '' : SIZES[size] || SIZES.md;

  // Khi render thành component khác (ví dụ Link của react-router-dom),
  // bỏ thuộc tính type — chỉ thuộc của thẻ <button>.
  const typeProps = Tag === 'button' ? { type } : {};

  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffdf19] disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant] || VARIANTS.primary
      } ${sizeClass} ${className}`}
      {...typeProps}
      {...otherProps}
    >
      {children}
    </Tag>
  );
}

export default Button;
