import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../store/slices/AuthSlices";
import { fetchNotifications, markNotificationRead } from '../../../store/slices/NotificationSlice';
import { useNotificationWebSocket } from '../../../hooks/useNotificationWebSocket';
import { formatDistanceToNow } from 'date-fns';
import SignUpPopup from './SignUpPopup';
import { useTranslation } from 'react-i18next';

export const signedOutNavItems = [
  { label: "navbar.home", href: "/" },
  { label: "navbar.find_professionals", href: "/find-professionals" },
  { label: "navbar.contact", href: "/contact-us" },
];

export const signedInNavItems = [
  { label: "navbar.find_professionals", href: "/find-professionals" },
  { label: "navbar.for_professionals", href: "#" },
  { label: "navbar.contact", href: "/contact-us" }
];

export const buyerNavItems = [
  { label: "navbar.find_professionals", href: "/find-professionals" },
  { label: "navbar.how_to_accept_project_invite", href: "/how-to-accept-project-invite" },
  { label: "navbar.contact", href: "/contact-us" }
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
  // Add separate state for mobile notification dropdown
  const [isMobileNotifDropdownOpen, setIsMobileNotifDropdownOpen] = useState(false);
  const [isSignUpPopupOpen, setIsSignUpPopupOpen] = useState(false);

  // i18n
  const { t, i18n } = useTranslation();
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  // Get auth state from Redux
  const user = useSelector(state => state.auth.user);
  const isSignedIn = !!user;
  const userName = user ? (user.name || user.username || "User") : "User";
  const userAvatar = user && user.avatar ? user.avatar : null;
  const userEmail = user && user.email ? user.email : "";

  // Determine admin panel visibility from session/user
  const adminRoleFlag = (typeof window !== 'undefined' && sessionStorage.getItem('admin_role') === 'true');
  const canSeeAdminPanel = !!(
    adminRoleFlag ||
    (user && (user.role === 'admin' || user.role === 'super-admin' || user.is_admin === true))
  );

  const canSeeProjectInvite = !!(
    user && (user.role === 'buyer' || user.role === 'professional-buyer')
  )

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Notifications
  const { notifications, websocketConnected } = useSelector(state => state.notifications);
  const { markNotificationRead: wsMarkNotificationRead } = useNotificationWebSocket();
  
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
      return <div className="text-center text-gray-400 p-4">{t('navbar.no_unread_notifications')}</div>;
    }
    return unreadList.slice(0, 5).map((n, idx) => (
      <div key={`notif-${n.id}-${idx}`} className="flex items-center gap-3 p-2 hover:bg-gray-50">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E6F0FA] text-[#01257D] text-lg font-bold flex-shrink-0">
          {getNotificationIcon(n.message)}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-sm text-gray-800">{n.message}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </div>
        </div>
        <button
          className="ml-1 mr-2 text-green-600 hover:text-green-800 self-center flex-shrink-0 cursor-pointer"
          title="Mark as read"
          onClick={() => {
            if (websocketConnected) {
              wsMarkNotificationRead(n.id);
            } else {
              dispatch(markNotificationRead(n.id));
            }
          }}
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
                {t(item.label)}
              </Link>
            ))}
            {canSeeAdminPanel && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Admin Panel
              </Link>
            )}
            {canSeeProjectInvite && (
              <Link
                to="/how-to-accept-project-invite"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                How to Accept Project Invite
              </Link>
            )}
          </nav>

          {/* Right Side - Desktop */}
          <div className={`hidden md:flex items-center space-x-4 ${leftShiftClass}`} style={leftShiftStyle}>
            {/* Language Switcher */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 text-xs rounded-md border ${i18n.language.startsWith('en') ? 'bg-[#01257D] text-white border-[#01257D]' : 'border-gray-300 text-gray-700'} cursor-pointer`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('fr')}
                className={`px-2 py-1 text-xs rounded-md border ${i18n.language.startsWith('fr') ? 'bg-[#01257D] text-white border-[#01257D]' : 'border-gray-300 text-gray-700'} cursor-pointer`}
                title="Français"
              >
                FR
              </button>
            </div>
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
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max_h-80 max-h-80 overflow-y-auto">
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
                          className="flex flex_col flex-col items-start px-4 py-3 border-b border-gray-100 bg-transparent w-full text-left focus:outline-none"
                          style={{ background: 'none', border: 'none' }}
                        >
                          <p className="text-sm font-medium text-gray-900">{userName}</p>
                          <p className="text-xs text-gray-500">{userEmail}</p>
                        </button>
                        <Link 
                          to={
                            user.role === 'seller' ? '/profile' : 
                            user.role === 'admin' ? '/admin' : 
                            '/buyer-dashboard'
                          } 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t('navbar.profile')}
                        </Link>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          {t('navbar.settings')}
                        </a>
                        <Link to="/billings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          {t('navbar.billing')}
                        </Link>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            {t('navbar.sign_out')}
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
                  <Link to="/login">{t('navbar.sign_in')}</Link>
                </button>
                <button
                  onClick={() => setIsSignUpPopupOpen(true)}
                  className="px-4 py-2 text-sm font-medium text_white text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md transition-colors cursor-pointer"
                >
                  {t('navbar.sign_up')}
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Side (avatar and bell only, no hamburger) */}
          {!showMobileMenuButton && (
            <div className="flex md:hidden items-center space-x-4">
              {/* Language Switcher - Mobile */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-2 py-1 text-xs rounded-md border ${i18n.language.startsWith('en') ? 'bg-[#01257D] text-white border-[#01257D]' : 'border-gray-300 text-gray-700'} cursor-pointer`}
                  title="English"
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`px-2 py-1 text-xs rounded-md border ${i18n.language.startsWith('fr') ? 'bg-[#01257D] text-white border-[#01257D]' : 'border-gray-300 text-gray-700'} cursor-pointer`}
                  title="Français"
                >
                  FR
                </button>
              </div>
              {isSignedIn ? (
                <>
                  {/* Mobile Notification Bell with Dropdown */}
                  <div className="relative">
                    <button 
                      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                      onClick={() => setIsMobileNotifDropdownOpen(!isMobileNotifDropdownOpen)}
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {isMobileNotifDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                        <div className="py-2">{renderNotifications()}</div>
                      </div>
                    )}
                  </div>
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
                          <Link 
                            to={
                              user.role === 'seller' ? '/profile' : 
                              user.role === 'admin' ? '/admin' : 
                              '/buyer-dashboard'
                            } 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t('navbar.profile')}
                          </Link>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {t('navbar.settings')}
                          </a>
                          <Link to="/billings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {t('navbar.billing')}
                          </Link>
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('navbar.sign_out')}
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
                    <Link to="/login">{t('navbar.sign_in')}</Link>
                  </button>
                  <button
                    onClick={() => setIsSignUpPopupOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md transition-colors cursor-pointer"
                  >
                    {t('navbar.sign_up')}
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
                  {t(item.label)}
                </Link>
              ))}
              {canSeeAdminPanel && (
                <Link
                  to="/admin"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Admin Panel
                </Link>
              )}
              {canSeeProjectInvite && (
                <Link
                  to="/how-to-accept-project-invite"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  How to Accept Project Invite
                </Link>
              )}

              {/* Language Switcher - Mobile in menu */}
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1 text-xs rounded-md border ${i18n.language.startsWith('en') ? 'bg-[#01257D] text-white border-[#01257D]' : 'border-gray-300 text-gray-700'} cursor-pointer`}
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`px-3 py-1 text-xs rounded-md border ${i18n.language.startsWith('fr') ? 'bg-[#01257D] text-white border-[#01257D]' : 'border-gray-300 text-gray-700'} cursor-pointer`}
                >
                  Français
                </button>
              </div>

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
                    {/* Mobile Menu Notification Bell with Dropdown */}
                    <div className="ml-auto relative">
                      <button 
                        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded_full rounded-full cursor-pointer"
                        onClick={() => setIsMobileNotifDropdownOpen(!isMobileNotifDropdownOpen)}
                      >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      {isMobileNotifDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                          <div className="py-2">{renderNotifications()}</div>
                        </div>
                      )}
                    </div>
                    {/* Mobile Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-4 top-20 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                          </div>
                          <Link 
                            to={
                              user.role === 'seller' ? '/profile' : 
                              user.role === 'admin' ? '/admin' : 
                              '/buyer-dashboard'
                            } 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t('navbar.profile')}
                          </Link>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {t('navbar.settings')}
                          </a>
                          <Link to="/billings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {t('navbar.billing')}
                          </Link>
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('navbar.sign_out')}
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
                      <Link to="/login">{t('navbar.sign_in')}</Link>
                    </button>
                    <button
                      onClick={() => setIsSignUpPopupOpen(true)}
                      className="w-full px-3 py-2 text-base font-medium text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md"
                    >
                      {t('navbar.sign_up')}
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
      {isMobileNotifDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsMobileNotifDropdownOpen(false)}></div>}
      
      {/* Sign Up Popup */}
      <SignUpPopup 
        isOpen={isSignUpPopupOpen} 
        onClose={() => setIsSignUpPopupOpen(false)} 
      />
    </header>
  )
}