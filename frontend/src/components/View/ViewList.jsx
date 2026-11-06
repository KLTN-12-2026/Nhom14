import ViewCard from "./ViewCard";

const ViewList = ({ posts = [] }) => {
  if (!posts.length) {
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        Không tìm thấy bài đăng phù hợp. Hãy thử chọn loại bài khác hoặc
        đổi từ khóa tìm kiếm.
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <ViewCard key={post._id || post.id} post={post} />
      ))}
    </div>
  );
};

export default ViewList;
