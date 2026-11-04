
import { MOCK_POSTS, TYPE_OPTIONS } from '../data/mockPosts';

const STORAGE_KEY = 'rising-idea-posts';

// Bản thử nghiệm frontend: lưu dữ liệu trong trình duyệt (localStorage).
// Lần đầu chạy, nếu chưa có dữ liệu sẽ nạp sẵn danh sách bài đăng mẫu
// để thử chức năng Góp vốn / Quyên góp. Khi backend có API, thay các hàm
// này bằng lời gọi API.
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

export function getPosts() {
  try {
    const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!laDuLieuHopLe(posts)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_POSTS));
      return [...MOCK_POSTS];
    }
    return posts;
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getPostById(id) {
  return getPosts().find((post) => post.id === id) || null;
}

export function createPost(postData) {
  const posts = getPosts();

  const newPost = {
    raised: 0,
    ...postData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  savePosts([...posts, newPost]);
  return newPost;
}

export function updatePost(id, postData) {
  const posts = getPosts();
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPost = {
    ...posts[index],
    ...postData,
    id,
    updatedAt: new Date().toISOString(),
  };

  posts[index] = updatedPost;
  savePosts(posts);

  return updatedPost;
}

// Cập nhật số tiền đã huy động sau khi giao dịch góp vốn / quyên góp thành công.
export function tangTienHuyDong(id, soTien) {
  const posts = getPosts();
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPost = {
    ...posts[index],
    raised: (posts[index].raised || 0) + soTien,
  };

  posts[index] = updatedPost;
  savePosts(posts);

  return updatedPost;
}
