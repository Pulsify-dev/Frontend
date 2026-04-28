import { Outlet } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

const AuthLayout = () => {
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

export default AuthLayout;
