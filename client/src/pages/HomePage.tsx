import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Laptop, Calculator, FileText, Sofa, Bike, Package, Shirt, Dumbbell, Home, Headphones, Search, Star, CheckCircle } from 'lucide-react';
import { listingsAPI, categoriesAPI, marketplaceAPI } from '../api';
import ListingCard from '../components/listings/ListingCard';

const categoryIcons: Record<string, any> = {
  books: BookOpen,
  electronics: Laptop,
  calculators: Calculator,
  notes: FileText,
  furniture: Sofa,
  bikes: Bike,
  other: Package,
  clothing: Shirt,
  sports: Dumbbell,
  hostel: Home,
  accessories: Headphones,
};

const testimonials = [
  { name: 'Aryan S.', college: 'IIT Delhi', text: 'Sold my calculator and old textbooks in 2 days. Super easy and got a fair price!', rating: 5 },
  { name: 'Priya P.', college: 'Delhi University', text: 'Found all my semester books at half price. Campus Loop is literally every student\'s dream.', rating: 5 },
  { name: 'Rohan M.', college: 'BITS Pilani', text: 'The AI listing tool helped me write a perfect description. Got 3 enquiries the same day.', rating: 5 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalItems: 3240, soldItems: 1820, totalSavedAmount: 620000, userCount: 1250 });
  const [searchQuery, setSearchQuery] = useState('');
  const [_loading, setLoading] = useState(true); // eslint-disable-line

  useEffect(() => {
    Promise.all([
      categoriesAPI.getAll(),
      listingsAPI.getAll({ sort: 'popular', limit: 8 }),
      listingsAPI.getAll({ sort: 'newest', limit: 8 }),
      marketplaceAPI.getStats(),
    ]).then(([cats, pop, rec, st]) => {
      setCategories(cats.data.categories || []);
      setTrending(pop.data.listings || []);
      setRecent(rec.data.listings || []);
      if (st.data) setStats(st.data);
    }).catch(() => {}).finally(() => setLoading(false));
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#f3f0eb] border border-[#e8e4de] text-[#6b7c5e] text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <CheckCircle className="w-3.5 h-3.5" />
              Trusted by students across campus
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-[#1a1a1a] leading-tight mb-6">
              Give your campus<br />
              <span className="text-[#6b7c5e]">essentials</span> a<br />
              second life.
            </h1>

            <p className="text-lg text-[#5c5c5c] leading-relaxed mb-8 max-w-lg">
              Buy, sell and exchange books, electronics, furniture and more — directly with students around you.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for books, electronics, furniture..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#e8e4de] rounded-xl text-sm focus:outline-none focus:border-[#6b7c5e] shadow-sm"
                />
              </div>
              <button type="submit" className="px-6 py-3.5 bg-[#6b7c5e] text-white text-sm font-medium rounded-xl hover:bg-[#4a5c40] transition-colors">
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-xl hover:bg-[#2d2d2d] transition-colors"
              >
                Explore Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#e8e4de] text-[#1a1a1a] text-sm font-medium rounded-xl hover:border-[#6b7c5e] transition-colors"
              >
                Sell an Item
              </Link>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden lg:block relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-[#e8e4de] shadow-sm">
                  <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" alt="Laptop" className="w-full h-40 object-cover rounded-lg mb-3" />
                  <p className="text-sm font-medium text-[#1a1a1a]">HP Pavilion Laptop</p>
                  <p className="text-[#6b7c5e] font-semibold">₹28,000</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#e8e4de] shadow-sm">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400" alt="Books" className="w-full h-32 object-cover rounded-lg mb-3" />
                  <p className="text-sm font-medium text-[#1a1a1a]">Engineering Books</p>
                  <p className="text-[#6b7c5e] font-semibold">₹350</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white rounded-2xl p-4 border border-[#e8e4de] shadow-sm">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" alt="Headphones" className="w-full h-32 object-cover rounded-lg mb-3" />
                  <p className="text-sm font-medium text-[#1a1a1a]">Sony Headphones</p>
                  <p className="text-[#6b7c5e] font-semibold">₹8,500</p>
                </div>
                <div className="bg-[#6b7c5e] rounded-2xl p-4 text-white">
                  <p className="text-3xl font-semibold font-serif mb-1">{(stats.totalItems || 3240).toLocaleString('en-IN')}+</p>
                  <p className="text-sm text-[#c5d4b8]">Items available</p>
                </div>
              </div>
            </div>
          </div>
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
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#1a1a1a] mb-1">{s.value}</p>
                <p className="text-sm text-[#5c5c5c]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-2">Browse By</p>
            <h2 className="font-serif text-3xl font-semibold text-[#1a1a1a]">Featured Categories</h2>
          </div>
          <Link to="/categories" className="text-sm text-[#6b7c5e] hover:text-[#4a5c40] font-medium flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(categories.length > 0 ? categories : Array(12).fill(null)).slice(0, 12).map((cat, i) => {
            if (!cat) return (
              <div key={i} className="bg-white border border-[#e8e4de] rounded-xl p-4 animate-pulse">
                <div className="w-8 h-8 bg-[#f3f0eb] rounded-lg mb-2" />
                <div className="h-3 bg-[#f3f0eb] rounded w-3/4 mb-1" />
                <div className="h-2.5 bg-[#f3f0eb] rounded w-1/2" />
              </div>
            );
            const Icon = categoryIcons[cat.slug] || Package;
            return (
              <Link
                key={cat.id}
                to={`/marketplace?category=${cat.slug}`}
                className="bg-white border border-[#e8e4de] rounded-xl p-4 hover:border-[#6b7c5e] hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 bg-[#f3f0eb] group-hover:bg-[#6b7c5e]/10 rounded-lg flex items-center justify-center mb-2.5 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-[#6b7c5e]" />
                </div>
                <p className="text-xs font-medium text-[#1a1a1a] leading-snug">{cat.name}</p>
                <p className="text-xs text-[#8a8a8a] mt-0.5">{cat.listing_count || 0} items</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trending Listings */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-2">Popular Now</p>
              <h2 className="font-serif text-3xl font-semibold text-[#1a1a1a]">Trending Listings</h2>
            </div>
            <Link to="/marketplace?sort=popular" className="text-sm text-[#6b7c5e] hover:text-[#4a5c40] font-medium flex items-center gap-1 transition-colors">
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
                <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-2">Just Listed</p>
                <h2 className="font-serif text-3xl font-semibold text-[#1a1a1a]">Recently Added</h2>
              </div>
              <Link to="/marketplace?sort=newest" className="text-sm text-[#6b7c5e] hover:text-[#4a5c40] font-medium flex items-center gap-1 transition-colors">
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
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-2">Simple Process</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1a1a1a]">How Campus Loop Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { num: '01', title: 'List your item', desc: 'Take a photo, set your price and publish your listing in minutes. Our AI assistant helps you write the perfect description.' },
            { num: '02', title: 'Connect with buyers', desc: 'Interested buyers message you directly. Chat, negotiate and arrange a convenient meeting on campus.' },
            { num: '03', title: 'Complete the exchange', desc: 'Meet on campus, exchange the item, and mark it as sold. Both parties can then leave a review.' },
          ].map((step, i) => (
            <div key={i} className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 border-2 border-[#6b7c5e] text-[#6b7c5e] font-serif font-semibold text-sm rounded-full mb-4">
                {step.num}
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">{step.title}</h3>
              <p className="text-[#5c5c5c] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainability */}
      <section className="bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-4">Campus Impact</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">Reuse. Reduce. Reconnect.</h2>
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
                <p className="font-serif text-2xl font-semibold text-[#6b7c5e] mb-1">{s.value}</p>
                <p className="text-sm text-[#8a8a8a]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-2">What students say</p>
          <h2 className="font-serif text-3xl font-semibold text-[#1a1a1a]">Loved by campus communities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-[#e8e4de] rounded-xl p-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#c4a882] text-[#c4a882]" />
                ))}
              </div>
              <p className="text-sm text-[#5c5c5c] leading-relaxed mb-4 font-serif italic">"{t.text}"</p>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">{t.name}</p>
                <p className="text-xs text-[#8a8a8a]">{t.college}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#f3f0eb] border-t border-[#e8e4de]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1a1a1a] mb-4">
            Have something you're not using?
          </h2>
          <p className="text-[#5c5c5c] text-lg mb-8">Sell it on Campus Loop and let it find a new home.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/sell" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#6b7c5e] text-white font-medium rounded-xl hover:bg-[#4a5c40] transition-colors">
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-[#e8e4de] text-[#1a1a1a] font-medium rounded-xl hover:border-[#6b7c5e] transition-colors">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
