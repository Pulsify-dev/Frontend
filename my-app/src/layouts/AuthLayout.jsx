import { Outlet, Link } from "react-router-dom";
import SoundCloudLogo from "@/components/common/SoundCloudLogo";
import Footer from "@/components/common/Footer";

const AuthLayout = () => {
  return (
    <div className="auth-shell">
      <nav className="auth-navbar">
        <div className="auth-navbar-left">
          <SoundCloudLogo />
        </div>
        <div className="auth-navbar-right">
          <Link to="/login" className="auth-nav-signin">
            Sign in
          </Link>
          <Link to="/register" className="auth-nav-register">
            Create account
          </Link>
        </div>
      </nav>
      <main className="auth-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AuthLayout;
