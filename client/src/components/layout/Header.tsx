import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, Bell, MessageCircle, User, Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usersAPI } from '../../api';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      usersAPI.getNotifications().then(r => setUnread(r.data.unread || 0)).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Categories', href: '/categories' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About', href: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-[#e8e4de]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-full border-2 border-[#6b7c5e] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#6b7c5e] group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-serif text-lg font-semibold text-[#1a1a1a] tracking-tight">
              Campus Loop
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-[#6b7c5e]'
                    : 'text-[#5c5c5c] hover:text-[#1a1a1a]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="pl-9 pr-4 py-2 bg-[#f3f0eb] border border-[#e8e4de] rounded-full text-sm w-48 focus:w-64 focus:outline-none focus:border-[#6b7c5e] transition-all"
                />
              </div>
            </form>

            {user ? (
              <>
                {/* Messages */}
                <Link to="/messages" className="relative p-2 text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </Link>

                {/* Wishlist */}
                <Link to="/wishlist" className="p-2 text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#6b7c5e] rounded-full" />
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#f3f0eb] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#5c5c5c] hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white border border-[#e8e4de] rounded-xl shadow-lg py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-[#e8e4de]">
                        <p className="text-sm font-medium text-[#1a1a1a]">{user.name}</p>
                        <p className="text-xs text-[#8a8a8a] mt-0.5">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#5c5c5c] hover:bg-[#faf8f5] hover:text-[#1a1a1a] transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link to={`/profile/${user.id}`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#5c5c5c] hover:bg-[#faf8f5] hover:text-[#1a1a1a] transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      {user.is_admin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#5c5c5c] hover:bg-[#faf8f5] hover:text-[#1a1a1a] transition-colors">
                          <Settings className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-[#e8e4de] mt-1 pt-1">
                        <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sell CTA */}
                <Link
                  to="/sell"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#6b7c5e] text-white text-sm font-medium rounded-lg hover:bg-[#4a5c40] transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Sell
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-[#5c5c5c] hover:text-[#1a1a1a] px-3 py-2 transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="text-sm font-medium bg-[#6b7c5e] text-white px-4 py-2 rounded-lg hover:bg-[#4a5c40] transition-colors">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="md:hidden p-2 text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#e8e4de] py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f3f0eb] border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e]"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-[#5c5c5c] hover:text-[#1a1a1a] hover:bg-[#f3f0eb] rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link to="/sell" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center gap-2 px-3 py-2.5 bg-[#6b7c5e] text-white text-sm font-medium rounded-lg">
                  <ShoppingBag className="w-4 h-4" /> Sell an Item
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Backdrop for dropdowns */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
