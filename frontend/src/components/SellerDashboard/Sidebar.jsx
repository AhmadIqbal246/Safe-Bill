import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const links = [
  { labelKey: 'sidebar.dashboard', to: '/seller-dashboard' },
  { labelKey: 'sidebar.my_quotes', to: '/my-quotes' },
  { labelKey: 'sidebar.current_projects', to: '/current-projects' },
  { labelKey: 'sidebar.completed_projects', to: '/completed-projects' },
  { labelKey: 'sidebar.disputes', to: '/seller-disputes' },
  { labelKey: 'sidebar.my_profile', to: '/profile' },
  { labelKey: 'sidebar.billings', to: '/billings' },
  { labelKey: 'sidebar.documents', to: '/my-documents' },
  { labelKey: 'sidebar.support', to: '/support' },
];

export default function Sidebar({ open, setOpen, extraNavItems = [] }) {
  const { t } = useTranslation();
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-[#F6FAFD] min-h-screen p-6 border-r border-gray-200">
        <Link to="/" className="text-xl font-bold mb-8 block  transition-colors cursor-pointer">Safe Bill</Link>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            link.to === "#" ? (
              <Link
                key={link.labelKey}
                to="#"
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-gray-700 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive ? 'bg-white text-[#01257D] font-bold' : 'text-gray-700 hover:bg-white'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </NavLink>
            )
          ))}
        </nav>
      </aside>
      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 bg-[#F6FAFD] min-h-screen p-6 text-black border-r border-gray-200 transform transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: '100vh' }}
      >
        <button
          className="absolute top-4 right-4 text-gray-700"
          onClick={() => setOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
        <Link to="/seller-dashboard" className="text-xl font-bold mb-8 block hover:text-[#01257D] transition-colors cursor-pointer">Safe Bill</Link>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            link.to === "#" ? (
              <Link
                key={link.labelKey}
                to="#"
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-gray-700 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive ? 'bg-white text-[#01257D] font-bold' : 'text-gray-700 hover:bg-white'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </NavLink>
            )
          ))}
          {extraNavItems.length > 0 && <hr className="my-4 border-gray-300" />}
          {extraNavItems.map(item => (
            item.href === "#" ? (
              <Link
                key={item.label}
                to="#"
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-gray-700 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {t(item.label)}
              </Link>
            ) : (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive ? 'bg-white text-[#01257D] font-bold' : 'text-gray-700 hover:bg-white'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {t(item.label)}
              </NavLink>
            )
          ))}
        </nav>
      </aside>
    </>
  );
}
