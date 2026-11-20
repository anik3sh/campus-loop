import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Star, GraduationCap, ShieldCheck, RefreshCw } from 'lucide-react';
import { listingsAPI, marketplaceAPI } from '../api';
import ListingCard from '../components/listings/ListingCard';

const testimonials = [
  { name: 'Aryan S.', college: 'IIT Delhi', text: 'Sold my calculator and old textbooks in 2 days. Super easy and got a fair price!', rating: 5 },
  { name: 'Priya P.', college: 'Delhi University', text: 'Found all my semester books at half price. Campus Loop is literally every student\'s dream.', rating: 5 },
  { name: 'Rohan M.', college: 'BITS Pilani', text: 'The AI listing tool helped me write a perfect description. Got 3 enquiries the same day.', rating: 5 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalItems: 3240, soldItems: 1820, totalSavedAmount: 620000, userCount: 1250 });
  const [searchQuery, setSearchQuery] = useState('');
  const [_loading, setLoading] = useState(true); // eslint-disable-line

  useEffect(() => {
    Promise.all([
      listingsAPI.getAll({ sort: 'popular', limit: 8 }),
      listingsAPI.getAll({ sort: 'newest', limit: 8 }),
      marketplaceAPI.getStats(),
    ]).then(([pop, rec, st]) => {
      setTrending(pop.data.listings || []);
      setRecent(rec.data.listings || []);
      if (st.data) setStats(st.data);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#f3f0eb] border border-[#e8e4de] text-[#4a5c40] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#556947] animate-pulse" />
          Trusted by students across campus
        </div>

        <h1 className="font-display text-4xl sm:text-6xl lg:text-[62px] font-extrabold text-[#1a1a1a] leading-[1.1] tracking-[-0.035em] mb-6">
          Give your campus essentials a{' '}
          <span className="text-[#556947] relative inline-block">
            second life
            <svg className="absolute -bottom-1 left-0 w-full h-2 text-[#c4a882]/60" viewBox="0 0 100 8" preserveAspectRatio="none">
              <path d="M0 7 C 30 1, 70 1, 100 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          .
        </h1>

        <p className="text-base sm:text-lg text-[#5c5c5c] leading-relaxed mb-8 max-w-2xl mx-auto">
          Buy, sell and exchange books, electronics, furniture and more — directly with students around you.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for books, electronics, furniture..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#e8e4de] rounded-xl text-sm focus:outline-none focus:border-[#556947] focus:ring-2 focus:ring-[#556947]/10 shadow-xs transition-all placeholder:text-[#8a8a8a]"
            />
          </div>
          <button type="submit" className="px-6 py-3.5 bg-[#556947] text-white text-sm font-semibold rounded-xl hover:bg-[#435337] transition-all shadow-xs active:scale-[0.98]">
            Search
          </button>
        </form>

        {/* Quick Category Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs text-[#5c5c5c]">
          <span className="text-[#8a8a8a]">Popular:</span>
          {['Books', 'Electronics', 'Calculators', 'Notes', 'Bikes'].map((cat) => (
            <Link
              key={cat}
              to={`/marketplace?q=${encodeURIComponent(cat)}`}
              className="px-2.5 py-1 bg-white border border-[#e8e4de] rounded-full hover:border-[#556947] hover:text-[#556947] transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1a1a1a] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d2d] transition-all shadow-xs hover:shadow-md active:scale-[0.98]"
          >
            Explore Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-[#e8e4de] text-[#1a1a1a] text-sm font-semibold rounded-xl hover:border-[#556947] hover:bg-[#faf8f5] transition-all shadow-xs active:scale-[0.98]"
          >
            Sell an Item
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f3f0eb] border-y border-[#e8e4de]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-3 gap-6 sm:gap-8">
            {[
              { value: `${(stats.totalItems || 3240).toLocaleString('en-IN')}+`, label: 'Items reused' },
              { value: `₹${((stats.totalSavedAmount || 620000) / 100000).toFixed(1)}L+`, label: 'Saved by students' },
              { value: `${(stats.userCount || 1250).toLocaleString('en-IN')}+`, label: 'Student members' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">{s.value}</p>
                <p className="text-sm font-medium text-[#5c5c5c]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Listings */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#556947] uppercase tracking-widest mb-2">Popular Now</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1a1a1a]">Trending Listings</h2>
            </div>
            <Link to="/marketplace?sort=popular" className="text-sm text-[#556947] hover:text-[#435337] font-semibold flex items-center gap-1 transition-colors">
              See more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trending.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Listings */}
      {recent.length > 0 && (
        <section className="bg-[#f3f0eb] border-y border-[#e8e4de]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-[#556947] uppercase tracking-widest mb-2">Just Listed</p>
                <h2 className="font-display text-3xl font-bold tracking-tight text-[#1a1a1a]">Recently Added</h2>
              </div>
              <Link to="/marketplace?sort=newest" className="text-sm text-[#556947] hover:text-[#435337] font-semibold flex items-center gap-1 transition-colors">
                See more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recent.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#556947] uppercase tracking-widest mb-2">Simple Process</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">How Campus Loop Works</h2>
          <p className="text-[#5c5c5c] text-sm sm:text-base max-w-xl mx-auto mt-3">
            A simple, safe, and transparent cycle to buy, sell, and circulate items within your campus.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '01',
              title: 'Browse campus items',
              desc: 'Explore textbooks, lab gear, notes, electronics, and hostel essentials listed by verified students.',
            },
            {
              num: '02',
              title: 'Find an item you need',
              desc: 'Filter by category, price, condition, or use AI smart search to quickly find exactly what you want.',
            },
            {
              num: '03',
              title: 'Connect with the student',
              desc: 'Message directly through real-time chat, discuss details, negotiate price, and arrange a campus meetup.',
            },
            {
              num: '04',
              title: 'Buy, sell, or exchange safely',
              desc: 'Meet up safely in a familiar campus spot, inspect the item in person, and complete your exchange.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e4de] rounded-2xl p-6 relative hover:border-[#556947]/50 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 border-2 border-[#556947] text-[#556947] font-display font-bold text-sm rounded-full mb-4 bg-[#faf8f5]">
                  {step.num}
                </div>
                <h3 className="font-display text-lg font-bold text-[#1a1a1a] mb-2">{step.title}</h3>
                <p className="text-[#5c5c5c] text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Campus Loop */}
      <section id="about" className="scroll-mt-24 bg-[#f3f0eb] border-y border-[#e8e4de] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xs font-semibold text-[#556947] uppercase tracking-widest mb-2">Our Mission</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a] mb-4">
              About Campus Loop
            </h2>
            <p className="text-[#5c5c5c] text-base sm:text-lg leading-relaxed">
              Campus Loop is a student-focused marketplace designed for college communities to buy, sell, and exchange useful items. By connecting verified students on the same campus, we make it effortless to pass on textbooks, electronics, notes, and dorm essentials—saving money and building a sustainable campus circle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#faf8f5] border border-[#e8e4de] rounded-2xl p-6 text-center hover:border-[#556947]/50 hover:shadow-xs transition-all">
              <div className="w-12 h-12 mx-auto bg-[#556947]/10 text-[#556947] rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1a1a1a] mb-2">Student-Focused Community</h3>
              <p className="text-[#5c5c5c] text-sm leading-relaxed">
                Exclusively for campus students. Connect with trusted peers using official college emails and verified profiles.
              </p>
            </div>

            <div className="bg-[#faf8f5] border border-[#e8e4de] rounded-2xl p-6 text-center hover:border-[#556947]/50 hover:shadow-xs transition-all">
              <div className="w-12 h-12 mx-auto bg-[#556947]/10 text-[#556947] rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1a1a1a] mb-2">Safe Campus Exchanges</h3>
              <p className="text-[#5c5c5c] text-sm leading-relaxed">
                Built-in real-time chat, transparent seller reviews, and familiar on-campus meetups without shipping hassle or strangers.
              </p>
            </div>

            <div className="bg-[#faf8f5] border border-[#e8e4de] rounded-2xl p-6 text-center hover:border-[#556947]/50 hover:shadow-xs transition-all">
              <div className="w-12 h-12 mx-auto bg-[#556947]/10 text-[#556947] rounded-xl flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1a1a1a] mb-2">Circular Campus Economy</h3>
              <p className="text-[#5c5c5c] text-sm leading-relaxed">
                Keep useful items in circulation semester after semester, drastically cutting student expenses and reducing waste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className="bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-xs font-semibold text-[#8fa07a] uppercase tracking-widest mb-4">Campus Impact</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Reuse. Reduce. Reconnect.</h2>
          <p className="text-[#8a8a8a] text-lg max-w-2xl mx-auto mb-10">
            Every item sold on Campus Loop is one less thing in a landfill. Together, we're building a more sustainable campus culture.
          </p>
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
            {[
              { value: `${(stats.totalItems || 3240).toLocaleString('en-IN')}+`, label: 'Items reused' },
              { value: `₹${((stats.totalSavedAmount || 620000) / 100000).toFixed(1)}L+`, label: 'Student savings' },
              { value: '1.8T+', label: 'Waste avoided' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-2xl font-bold text-[#8fa07a] mb-1">{s.value}</p>
                <p className="text-sm text-[#8a8a8a]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#556947] uppercase tracking-widest mb-2">What students say</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#1a1a1a]">Loved by campus communities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-[#e8e4de] rounded-xl p-6 shadow-2xs">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#c4a882] text-[#c4a882]" />
                ))}
              </div>
              <p className="text-sm text-[#3a3a3a] leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{t.name}</p>
                <p className="text-xs text-[#8a8a8a]">{t.college}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#f3f0eb] border-t border-[#e8e4de]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a] mb-4">
            Have something you're not using?
          </h2>
          <p className="text-[#5c5c5c] text-lg mb-8">Sell it on Campus Loop and let it find a new home.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/sell" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#556947] text-white font-semibold rounded-xl hover:bg-[#435337] transition-all shadow-xs active:scale-[0.98]">
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-[#e8e4de] text-[#1a1a1a] font-semibold rounded-xl hover:border-[#556947] hover:bg-[#faf8f5] transition-all shadow-xs active:scale-[0.98]">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
