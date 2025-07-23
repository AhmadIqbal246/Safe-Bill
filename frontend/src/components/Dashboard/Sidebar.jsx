import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'My quotes', to: '/my-quotes' },
  { label: 'Current projects', to: '/current-projects' },
  { label: 'Completed projects', to: '/completed-projects' },
  { label: 'My profile', to: '/profile' },
  { label: 'Documents', to: '/documents' },
  { label: 'Support', to: '/support' },
];

export default function Sidebar({ open, setOpen }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-[#F6FAFD] min-h-screen p-6 border-r border-gray-200">
        <div className="text-xl font-bold mb-8">Safe Bill</div>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'bg-white text-[#01257D] font-bold' : 'text-gray-700 hover:bg-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 bg-[#F6FAFD] min-h-screen p-6 text-black border-r border-gray-200 transform transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 text-gray-700"
          onClick={() => setOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-xl font-bold mb-8">Safe Bill</div>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
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
          ))}
        </nav>
      </aside>
    </>
  );
}
