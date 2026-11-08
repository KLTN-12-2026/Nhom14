import ViewCard from "./ViewCard";

// Lưới thẻ bài đăng: 1 cột trên điện thoại, 2 cột trên máy tính bảng,
// 3 cột trên màn hình lớn — khớp lưới card của trang chủ.
const ViewList = ({ posts = [] }) => {
  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <span className="text-5xl" aria-hidden="true">🔍</span>
        <p className="font-bold text-gray-800">
          Không tìm thấy bài đăng phù hợp
        </p>
        <p className="max-w-sm text-sm text-gray-500">
          Hãy thử chọn loại bài khác hoặc đổi từ khóa tìm kiếm nhé.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
      {posts.map((post) => (
        <ViewCard key={post._id || post.id} post={post} />
      ))}
    </div>
  );
};

export default ViewList;
