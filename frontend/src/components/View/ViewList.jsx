import { posts } from "../../data/PostDemo/posts";
import ViewCard from "./ViewCard";

const ViewList = () => {
  return (
    <div>
      {posts.map((post) => (
        <ViewCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default ViewList;