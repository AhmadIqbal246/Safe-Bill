import React, { useState } from 'react';
import Sidebar from '../SellerDashboard/Sidebar';
import Navbar from '../mutualComponents/Navbar/Navbar';
import { Menu } from 'lucide-react';
import { useSelector } from 'react-redux';
import { signedInNavItems, signedOutNavItems } from '../mutualComponents/Navbar/Navbar';

export default function MainLayout({ children, hideSafeBillHeader }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Get user info from Redux
  const user = useSelector(state => state.auth.user);
  // Define nav items (copy from Navbar logic)
  const navItems = user ? signedInNavItems : signedOutNavItems;

  // Always use these defaults
  const shiftNavbarLeft = true;
  const showSafeBillHeaderOnMobile = true;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} extraNavItems={navItems} />
      {/* Transparent overlay for mobile sidebar, closes sidebar on click */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col">
        {/* Navbar with hamburger for mobile */}
        <div className="flex items-center border-b border-gray-200">
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <Navbar
              hideSafeBillHeader={hideSafeBillHeader}
              showSafeBillHeaderOnMobile={showSafeBillHeaderOnMobile}
              shiftNavbarLeft={shiftNavbarLeft}
              navbarRightClassName={shiftNavbarLeft ? 'pl-45 justify-start' : ''}
              showMobileMenuButton={false}
            />
          </div>
        </div>
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
