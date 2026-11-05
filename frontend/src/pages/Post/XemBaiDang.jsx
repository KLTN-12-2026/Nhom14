import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Home/Hero";

import ViewSidebar from "../../components/View/ViewSidebar";
import ViewToolbar from "../../components/View/ViewToolbar";
import ViewList from "../../components/View/ViewList";

const XemBaiDang = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <Hero />

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-7xl flex-col border-x border-gray-300 md:min-h-screen md:flex-row">

        {/* Sidebar */}
        <ViewSidebar />

        {/* Content */}
        <section className="min-w-0 flex-1">

          {/* Toolbar */}
          <ViewToolbar />

          {/* List */}
          <ViewList />

        </section>

      </main>

    </div>
  );
};

export default XemBaiDang;