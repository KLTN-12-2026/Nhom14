import { Link } from "react-router-dom";

const ViewCard = ({ post }) => {
  return (
    <Link
      to={`/bai-dang/${post._id}`}
      className="block border-b border-gray-300 p-4 hover:bg-gray-50"
    >
      <h3 className="font-semibold">
        {post.tieu_de}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {post.loai_bai_dang}
      </p>

      <p className="mt-2 text-sm">
        {post.noi_dung}
      </p>
    </Link>
  );
};

export default ViewCard;