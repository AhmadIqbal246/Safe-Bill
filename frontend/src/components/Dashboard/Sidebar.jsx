import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { X } from 'lucide-react';

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'My quotes', to: '/my-quotes' },
  { label: 'Current projects', to: '/current-projects' },
  { label: 'Completed projects', to: '/completed-projects' },
  { label: 'My profile', to: '/profile' },
  { label: 'Documents', to: '/my-documents' },
  { label: 'Support', to: '/support' },
];

export default function Sidebar({ open, setOpen, extraNavItems = [] }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-[#F6FAFD] min-h-screen p-6 border-r border-gray-200">
        <Link to="/" className="text-xl font-bold mb-8 block  transition-colors cursor-pointer">Safe Bill</Link>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            link.to === "#" ? (
              <Link
                key={link.label}
                to="#"
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-gray-700 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
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
                {link.label}
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
        <Link to="/dashboard" className="text-xl font-bold mb-8 block hover:text-[#01257D] transition-colors cursor-pointer">Safe Bill</Link>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            link.to === "#" ? (
              <Link
                key={link.label}
                to="#"
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-gray-700 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
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
                {link.label}
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
                {item.label}
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
                {item.label}
              </NavLink>
            )
          ))}
        </nav>
      </aside>
    </>
  );
}
