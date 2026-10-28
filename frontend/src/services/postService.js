
const STORAGE_KEY = 'rising-idea-posts';

// Bản thử nghiệm frontend: lưu dữ liệu trong trình duyệt.
// Khi backend có API, thay các hàm này bằng lời gọi API.
function getPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
