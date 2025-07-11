"use client"

import { useState } from "react"
import { Bell, Menu, X } from "lucide-react"

export default function SafeBillHeader({
  isSignedIn = false,
  userAvatar,
  userName = "User",
  onSignIn,
  onJoinNow,
  onSignOut,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const signedOutNavItems = [
    { label: "Browse Categories", href: "#" },
    { label: "How It Works", href: "#" },
    { label: "Success Stories", href: "#" },
    { label: "Support", href: "#" },
  ]

  const signedInNavItems = [
    { label: "Find Professionals", href: "#" },
    { label: "How it Works", href: "#" },
    { label: "For Professionals", href: "#" },
  ]

  const navItems = isSignedIn ? signedInNavItems : signedOutNavItems

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-semibold text-gray-900">Safe Bill</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn ? (
              <>
                {/* Notification Bell */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>

                {/* User Avatar with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
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
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{userName}</p>
                          <p className="text-xs text-gray-500">user@example.com</p>
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
                            onClick={onSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onJoinNow}
                  className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
                >
                  Join Now
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  {item.label}
                </a>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                {isSignedIn ? (
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
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
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{userName}</div>
                      <div className="text-sm font-medium text-gray-500">user@example.com</div>
                    </div>
                    <button className="ml-auto relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 px-3">
                    <button
                      onClick={onSignIn}
                      className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={onJoinNow}
                      className="w-full px-3 py-2 text-base font-medium text-white bg-black hover:bg-gray-800 rounded-md"
                    >
                      Join Now
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
    </header>
  )
}
