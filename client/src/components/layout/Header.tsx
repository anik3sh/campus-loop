import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Heart, Bell, MessageCircle, User, Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usersAPI } from '../../api';
import Logo from '../ui/Logo';
import UniversalSearch from './UniversalSearch';

export default function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      usersAPI.getNotifications().then(r => setUnread(r.data.unread || 0)).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (location.pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', href);
        }
      }
    }
  };

  const navLinks = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About', href: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#e8e4de]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[74px]">
          {/* LEFT & CENTER-LEFT: Logo + Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-9">
            {/* Campus Loop Logo */}
            <Link to="/" className="flex items-center group flex-shrink-0" aria-label="Campus Loop Home">
              <Logo size="compact" showTagline={false} />
            </Link>

            {/* Navigation Links directly after Logo */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7">
              {navLinks.map(link => {
                const isHash = link.href.includes('#');
                const isActive = isHash
                  ? location.pathname === '/' && location.hash === link.href.replace('/', '')
                  : location.pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={e => handleNavLinkClick(e, link.href)}
                    className={`text-[15px] font-medium tracking-normal transition-colors relative py-1 cursor-pointer ${
                      isActive
                        ? 'text-[#5f7754] font-semibold'
                        : 'text-[#3a3a3a] hover:text-[#1c2e1b]'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5f7754] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT: Search + Utility Icons + Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Universal Search Bar */}
            <UniversalSearch className="hidden sm:block" />

            {user ? (
              <>
                {/* Chat / Message */}
                <Link
                  to="/messages"
                  className="relative p-2 text-[#4a4a4a] hover:text-[#1c2e1b] hover:bg-[#eae6df] rounded-full transition-colors"
                  title="Messages"
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>

                {/* Wishlist / Heart */}
                <Link
                  to="/wishlist"
                  className="p-2 text-[#4a4a4a] hover:text-[#1c2e1b] hover:bg-[#eae6df] rounded-full transition-colors"
                  title="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Link>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-[#4a4a4a] hover:text-[#1c2e1b] hover:bg-[#eae6df] rounded-full transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#5f7754] ring-2 ring-[#faf8f5] rounded-full" />
                  )}
                </Link>

                {/* User Profile / Avatar + Dropdown Arrow */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[#eae6df] transition-colors focus:outline-none"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-[#5f7754] text-white text-xs font-semibold rounded-full flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#5c5c5c]" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-11 w-56 bg-white border border-[#e8e4de] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2.5 border-b border-[#e8e4de] bg-[#faf8f5]/60">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{user.name}</p>
                        <p className="text-xs text-[#8a8a8a] truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#4a4a4a] hover:bg-[#faf8f5] hover:text-[#1a1a1a] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#5f7754]" /> Dashboard
                      </Link>
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#4a4a4a] hover:bg-[#faf8f5] hover:text-[#1a1a1a] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#5f7754]" /> My Profile
                      </Link>
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#4a4a4a] hover:bg-[#faf8f5] hover:text-[#1a1a1a] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#5f7754]" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-[#e8e4de] mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#4a4a4a] hover:text-[#1c2e1b] px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-[#5f7754] text-white px-4 py-1.5 rounded-lg hover:bg-[#4a5f41] transition-colors shadow-2xs"
                >
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="md:hidden p-2 text-[#4a4a4a] hover:text-[#1c2e1b] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#e8e4de] py-4">
            <div className="mb-3 sm:hidden">
              <UniversalSearch isMobile={true} onSelect={() => setMobileOpen(false)} />
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => {
                const isHash = link.href.includes('#');
                const isActive = isHash
                  ? location.pathname === '/' && location.hash === link.href.replace('/', '')
                  : location.pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={e => {
                      setMobileOpen(false);
                      handleNavLinkClick(e, link.href);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#5f7754] font-semibold bg-[#f1ede6]'
                        : 'text-[#4a4a4a] hover:text-[#1c2e1b] hover:bg-[#f1ede6]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Backdrop for profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
