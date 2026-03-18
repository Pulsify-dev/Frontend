/**
 * MainLayout Component
 * Wraps pages with Navbar and Footer
 * Used for consistent layout across the app
 */

import { Outlet } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
