import { Link } from 'react-router-dom';
import { Mail, Globe, MessageSquare, AtSign } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-[#8a8a8a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full border-2 border-[#6b7c5e] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6b7c5e]" />
              </div>
              <span className="font-serif text-white font-semibold">Campus Loop</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              The trusted student marketplace for buying, selling and exchanging campus essentials.
            </p>
            <p className="text-xs text-[#5c5c5c] font-serif italic">"Buy. Sell. Connect. On Campus."</p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Browse All', href: '/marketplace' },
                { label: 'Books', href: '/marketplace?category=books' },
                { label: 'Electronics', href: '/marketplace?category=electronics' },
                { label: 'Calculators', href: '/marketplace?category=calculators' },
                { label: 'Hostel Essentials', href: '/marketplace?category=hostel' },
              ].map(l => (
                <li key={l.href}><Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Your Account</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'My Listings', href: '/dashboard?tab=listings' },
                { label: 'Wishlist', href: '/wishlist' },
                { label: 'Messages', href: '/messages' },
                { label: 'Sell an Item', href: '/sell' },
              ].map(l => (
                <li key={l.href}><Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">About</h4>
            <ul className="space-y-2.5 text-sm mb-6">
              {[
                { label: 'How It Works', href: '/#how-it-works' },
                { label: 'Safety Tips', href: '#' },
                { label: 'Terms of Use', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Contact Us', href: 'mailto:hello@campusloop.in' },
              ].map(l => (
                <li key={l.href}><a href={l.href} className="hover:text-white transition-colors">{l.label}</a></li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              {[Globe, MessageSquare, AtSign, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center hover:border-[#6b7c5e] hover:text-[#6b7c5e] transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#2d2d2d] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2024 Campus Loop. Made with care for Indian students.</p>
          <p className="text-xs text-[#5c5c5c]">Reduce. Reuse. Reconnect. 🌿</p>
        </div>
      </div>
    </footer>
  );
}
