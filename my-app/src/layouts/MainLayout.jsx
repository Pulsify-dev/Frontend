import { Outlet } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

const MainLayout = () => {
  return (
    <div className="auth-shell">
      <Navbar />
      <main className="auth-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
