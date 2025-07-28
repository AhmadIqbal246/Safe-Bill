import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, CheckCircle, Link2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../store/slices/AuthSlices";
import { fetchNotifications, markNotificationRead } from '../../../store/slices/NotificationSlice';
import { formatDistanceToNow } from 'date-fns';

export const signedOutNavItems = [
  { label: "Home", href: "/" },
  { label: "Directory", href: "#" },
  { label: "How it works", href: "#" },
  { label: "Contact", href: "#" },
];

export const signedInNavItems = [
  { label: "Find Professionals", href: "/find-professionals" },
  { label: "How it Works", href: "#" },
  { label: "For Professionals", href: "#" },
];

export default function SafeBillHeader({
  onSignIn,
  onJoinNow,
  onSignOut,
  hideSafeBillHeader,
  showSafeBillHeaderOnMobile,
  shiftNavbarLeft,
  navbarRightStyle,
  navbarRightClassName,
  showMobileMenuButton = true,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Get auth state from Redux
  const user = useSelector(state => state.auth.user);
  const isSignedIn = !!user;
  const userName = user ? (user.name || user.username || "User") : "User";
  const userAvatar = user && user.avatar ? user.avatar : null;
  const userEmail = user && user.email ? user.email : "";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Notifications
  const { notifications } = useSelector(state => state.notifications);
  useEffect(() => {
    if (isSignedIn) dispatch(fetchNotifications());
  }, [dispatch, isSignedIn]);
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleSignOut = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const navItems = isSignedIn ? signedInNavItems : signedOutNavItems

  // Example: use a default style if shiftNavbarLeft is true, or use the passed style/class
  const leftShiftStyle = shiftNavbarLeft
    ? navbarRightStyle || { marginLeft: 0, justifyContent: 'flex-start' }
    : navbarRightStyle;

  const leftShiftClass = shiftNavbarLeft
    ? navbarRightClassName || 'pl-8 justify-start'
    : navbarRightClassName || 'justify-end';

  // Notification icon logic (reuse from dashboard)
  function getNotificationIcon(message) {
    if (message.toLowerCase().includes('project')) return '+';
    if (message.toLowerCase().includes('approved')) return '✓';
    if (message.toLowerCase().includes('deadline')) return '⏰';
    if (message.toLowerCase().includes('payment')) return '$';
    return '!';
  }

  function renderNotifications(list = notifications) {
    const unreadList = (list || []).filter(n => !n.is_read);
    if (!unreadList || unreadList.length === 0) {
      return <div className="text-center text-gray-400 p-4">No unread notifications.</div>;
    }
    return unreadList.slice(0, 5).map(n => (
      <div key={n.id} className="flex items-start gap-3 p-2 hover:bg-gray-50">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#E6F0FA] text-[#01257D] text-lg font-bold`}>
          {getNotificationIcon(n.message)}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="text-sm text-gray-800">{n.message}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </div>
        </div>
        <button
          className="ml-2 text-green-600 hover:text-green-800 self-center"
          title="Mark as read"
          onClick={() => dispatch(markNotificationRead(n.id))}
        >
          <CheckCircle size={18} />
        </button>
      </div>
    ));
  }

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {showSafeBillHeaderOnMobile ? (
              <Link to="/" className="text-xl font-semibold text-gray-900 cursor-pointer md:hidden">Safe Bill</Link>
            ) : (
              !hideSafeBillHeader && (
                <Link to="/" className="text-xl font-semibold text-gray-900 cursor-pointer">Safe Bill</Link>
              )
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side - Desktop */}
          <div className={`hidden md:flex items-center space-x-4 ${leftShiftClass}`} style={leftShiftStyle}>
            {isSignedIn ? (
              <>
                {/* Notification Bell with Dropdown */}
                <div className="relative">
                  <button
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                      <div className="py-2">{renderNotifications()}</div>
                    </div>
                  )}
                </div>
                {/* User Avatar with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {userAvatar ? (
                        <img
                          src={userAvatar || "/placeholder.svg"}
                          alt={userName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">{userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </button>
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex flex-col items-start px-4 py-3 border-b border-gray-100 bg-transparent w-full text-left focus:outline-none"
                          style={{ background: 'none', border: 'none' }}
                        >
                          <p className="text-sm font-medium text-gray-900">{userName}</p>
                          <p className="text-xs text-gray-500">{userEmail}</p>
                        </button>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Profile
                        </Link>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Settings
                        </a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Billing
                        </a>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sign In and Join Now Buttons */}
                <button
                  onClick={onSignIn}
                  className="px-4 py-2 text-sm font-medium text-[#01257D] hover:text-[#2346a0] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >
                  <Link to="/login">Sign In</Link>
                </button>
                <button
                  onClick={onJoinNow}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md transition-colors cursor-pointer"
                >
                  <Link to="/seller-register">Sign Up</Link>
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Side (avatar and bell only, no hamburger) */}
          {!showMobileMenuButton && (
            <div className="flex md:hidden items-center space-x-4">
              {isSignedIn ? (
                <>
                  <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                    <Bell className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {userAvatar ? (
                          <img
                            src={userAvatar || "/placeholder.svg"}
                            alt={userName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">{userName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </button>
                    {/* Dropdown Menu (reuse desktop logic) */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex flex-col items-start px-4 py-3 border-b border-gray-100 bg-transparent w-full text-left focus:outline-none"
                            style={{ background: 'none', border: 'none' }}
                          >
                            <p className="text-sm font-medium text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                          </button>
                          <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Profile
                          </Link>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Settings
                          </a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Billing
                          </a>
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={onSignIn}
                    className="px-4 py-2 text-sm font-medium text-[#01257D] hover:text-[#2346a0] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <Link to="/login">Sign In</Link>
                  </button>
                  <button
                    onClick={onJoinNow}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md transition-colors cursor-pointer"
                  >
                    <Link to="/seller-register">Sign Up</Link>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {showMobileMenuButton && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                {isSignedIn ? (
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden focus:outline-none"
                      >
                        {userAvatar ? (
                          <img
                            src={userAvatar || "/placeholder.svg"}
                            alt={userName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">{userName.charAt(0).toUpperCase()}</span>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="ml-3 flex flex-col items-start bg-transparent w-auto text-left focus:outline-none"
                      style={{ background: 'none', border: 'none' }}
                    >
                      <div className="text-base font-medium text-gray-800">{userName}</div>
                      <div className="text-sm font-medium text-gray-500">{userEmail}</div>
                    </button>
                    <button className="ml-auto relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full cursor-pointer">
                      <Bell className="h-5 w-5" />
                    </button>
                    {/* Mobile Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-4 top-20 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                          </div>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Profile
                          </a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Settings
                          </a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Billing
                          </a>
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 px-3">
                    <button
                      onClick={onSignIn}
                      className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      <Link to="/login">Sign In</Link>
                    </button>
                    <button
                      onClick={onJoinNow}
                      className="w-full px-3 py-2 text-base font-medium text-white bg-black hover:bg-gray-800 rounded-md"
                    >
                      <Link to="/seller-register">Sign Up</Link>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for dropdown */}
      {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
      {isNotifDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNotifDropdownOpen(false)}></div>}
    </header>
  )
}