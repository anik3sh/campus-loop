import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid, List, X, Sparkles, MapPin, ChevronDown, Check } from 'lucide-react';
import { listingsAPI, categoriesAPI, aiAPI } from '../api';
import ListingCard from '../components/listings/ListingCard';
import { useDebounce } from '../hooks/useDebounce';

const CONDITIONS = [
  { value: '', label: 'Any Condition' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

const CAMPUS_OPTIONS = [
  { value: '', label: 'All Campuses', location: 'Show all colleges' },
  { value: 'SSTC', label: 'SSTC', location: 'Bhilai, Chhattisgarh' },
  { value: 'SSPU', label: 'SSPU', location: 'Pune, Maharashtra' },
  { value: 'IIT Delhi', label: 'IIT Delhi', location: 'New Delhi, Delhi' },
  { value: 'BIT Durg', label: 'BIT Durg', location: 'Durg, Chhattisgarh' },
  { value: 'SSIPMT Raipur', label: 'SSIPMT Raipur', location: 'Raipur, Chhattisgarh' },
  { value: 'NIT Raipur', label: 'NIT Raipur', location: 'Raipur, Chhattisgarh' },
  { value: 'IIT Bombay', label: 'IIT Bombay', location: 'Mumbai, Maharashtra' },
  { value: 'Delhi University', label: 'Delhi University', location: 'New Delhi, Delhi' },
  { value: 'Other', label: 'Other', location: 'Other Campuses' },
];

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [gridView, setGridView] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  // Filters
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [campus, setCampus] = useState(searchParams.get('campus') || '');
  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  const campusRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  // Close campus dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (campusRef.current && !campusRef.current.contains(event.target as Node)) {
        setCampusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setAiExplanation('');
    try {
      if (aiMode && debouncedQuery.length > 5) {
        const { data } = await aiAPI.smartSearch(debouncedQuery);
        let list = data.listings || [];
        if (campus && campus !== 'All Campuses') {
          const cLower = campus.toLowerCase();
          list = list.filter((l: any) =>
            (l.campus && l.campus.toLowerCase().includes(cLower)) ||
            (l.college && l.college.toLowerCase().includes(cLower))
          );
        }
        setListings(list);
        setTotal(list.length);
        setPages(1);
        setAiExplanation(data.explanation || '');
      } else {
        const params: any = { page, limit: 20, sort };
        if (debouncedQuery) params.q = debouncedQuery;
        if (category) params.category = category;
        if (condition) params.condition = condition;
        if (campus && campus !== 'All Campuses') params.campus = campus;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        const { data } = await listingsAPI.getAll(params);
        setListings(data.listings || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, condition, campus, minPrice, maxPrice, sort, page, aiMode]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (category) params.category = category;
    if (campus && campus !== 'All Campuses') params.campus = campus;
    if (sort !== 'newest') params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [query, category, campus, sort]);

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setCondition('');
    setCampus('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
  };

  const hasFilters = query || category || condition || campus || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4de]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mb-0.5">Marketplace</h1>
              <p className="text-sm text-[#8a8a8a]">{total.toLocaleString('en-IN')} listings available</p>
            </div>

            {/* Controls: [ Search listings... ] [ Select Campus / Location ▼ ] [ AI ] [ Filters ] */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              {/* Search listings */}
              <div className="relative flex-1 min-w-[160px] sm:w-56 lg:w-64">
                {aiMode ? (
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7c5e]" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
                )}
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setPage(1); }}
                  placeholder={aiMode ? 'Ask Loop AI anything...' : 'Search listings...'}
                  className="w-full pl-9 pr-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
                />
              </div>

              {/* Select Campus / Location Dropdown */}
              <div className="relative" ref={campusRef}>
                <button
                  type="button"
                  onClick={() => setCampusDropdownOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    campus && campus !== 'All Campuses'
                      ? 'bg-[#6b7c5e]/10 text-[#6b7c5e] border-[#6b7c5e]'
                      : 'bg-white text-[#5c5c5c] border-[#e8e4de] hover:border-[#6b7c5e]'
                  }`}
                  aria-expanded={campusDropdownOpen}
                  title="Select Campus / Location"
                >
                  <MapPin className="w-4 h-4 text-[#6b7c5e] flex-shrink-0" />
                  <span className="max-w-[120px] sm:max-w-[150px] truncate">
                    {campus && campus !== 'All Campuses' ? campus : 'Select Campus / Location'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8a8a8a] flex-shrink-0" />
                </button>

                {campusDropdownOpen && (
                  <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 bg-white border border-[#e8e4de] rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in duration-100 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider border-b border-[#f3f0eb] mb-1">
                      Select Campus / Location
                    </div>
                    {CAMPUS_OPTIONS.map(c => {
                      const isSelected = (!campus && c.value === '') || campus === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setCampus(c.value);
                            setCampusDropdownOpen(false);
                            setPage(1);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm hover:bg-[#faf8f5] transition-colors ${
                            isSelected ? 'text-[#5f7754] font-semibold bg-[#faf8f5]' : 'text-[#3a3a3a]'
                          }`}
                        >
                          <div>
                            <p className="leading-snug">{c.label}</p>
                            {c.location && <p className="text-[11px] text-[#8a8a8a] font-normal">{c.location}</p>}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#5f7754] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Toggle */}
              <button
                onClick={() => setAiMode(v => !v)}
                title={aiMode ? 'Switch to normal search' : 'Switch to AI search'}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  aiMode
                    ? 'bg-[#6b7c5e] text-white border-[#6b7c5e]'
                    : 'bg-white text-[#5c5c5c] border-[#e8e4de] hover:border-[#6b7c5e]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </button>

              {/* Filters toggle */}
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border border-[#e8e4de] bg-white text-[#5c5c5c] hover:border-[#6b7c5e] transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* View toggle */}
              <div className="hidden sm:flex items-center border border-[#e8e4de] rounded-lg overflow-hidden">
                <button onClick={() => setGridView(true)} className={`p-2.5 ${gridView ? 'bg-[#f3f0eb] text-[#1a1a1a]' : 'bg-white text-[#8a8a8a]'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setGridView(false)} className={`p-2.5 ${!gridView ? 'bg-[#f3f0eb] text-[#1a1a1a]' : 'bg-white text-[#8a8a8a]'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="mt-4 pt-4 border-t border-[#e8e4de] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Campus */}
              <div>
                <label className="text-xs text-[#8a8a8a] mb-1 block">Campus / Location</label>
                <select
                  value={campus}
                  onChange={e => { setCampus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm bg-white focus:outline-none focus:border-[#6b7c5e]"
                >
                  {CAMPUS_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-[#8a8a8a] mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={e => { setCategory(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm bg-white focus:outline-none focus:border-[#6b7c5e]"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs text-[#8a8a8a] mb-1 block">Condition</label>
                <select
                  value={condition}
                  onChange={e => { setCondition(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm bg-white focus:outline-none focus:border-[#6b7c5e]"
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Price range */}
              <div>
                <label className="text-xs text-[#8a8a8a] mb-1 block">Min Price (₹)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm bg-white focus:outline-none focus:border-[#6b7c5e]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8a8a8a] mb-1 block">Max Price (₹)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                  placeholder="Any"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm bg-white focus:outline-none focus:border-[#6b7c5e]"
                />
              </div>
            </div>
          )}

          {/* Active filters + sort */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#8a8a8a] hover:text-[#1a1a1a] transition-colors">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
              {campus && campus !== 'All Campuses' && (
                <span className="flex items-center gap-1 text-xs bg-[#6b7c5e]/10 text-[#6b7c5e] px-2 py-1 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {campus}
                  <button onClick={() => setCampus('')} title="Remove campus filter"><X className="w-3 h-3" /></button>
                </span>
              )}
              {category && (
                <span className="flex items-center gap-1 text-xs bg-[#6b7c5e]/10 text-[#6b7c5e] px-2 py-1 rounded-full">
                  {categories.find(c => c.slug === category)?.name}
                  <button onClick={() => setCategory('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {aiMode && (
                <span className="flex items-center gap-1 text-xs bg-[#6b7c5e] text-white px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI Search Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8a8a8a]">Sort:</span>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
                className="text-xs border border-[#e8e4de] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#6b7c5e]"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* AI explanation */}
          {aiExplanation && (
            <div className="mt-3 p-3 bg-[#6b7c5e]/10 border border-[#6b7c5e]/20 rounded-lg flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#6b7c5e] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#4a5c40]">{aiExplanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className={`grid gap-4 ${gridView ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#e8e4de] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#f3f0eb]" />
                <div className="p-3.5">
                  <div className="h-3.5 bg-[#f3f0eb] rounded mb-2 w-3/4" />
                  <div className="h-4 bg-[#f3f0eb] rounded mb-3 w-1/3" />
                  <div className="h-3 bg-[#f3f0eb] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#f3f0eb] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#8a8a8a]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#1a1a1a] mb-2">No listings found</h3>
            <p className="text-[#8a8a8a] text-sm mb-4">Try adjusting your filters or search query</p>
            <button onClick={clearFilters} className="text-sm text-[#6b7c5e] hover:underline">Clear all filters</button>
          </div>
        ) : (
          <>
            <div className={`grid gap-4 ${
              gridView
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 max-w-2xl'
            }`}>
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-[#e8e4de] rounded-lg text-sm text-[#5c5c5c] hover:border-[#6b7c5e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = i + Math.max(1, page - 2);
                  if (p > pages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page ? 'bg-[#6b7c5e] text-white' : 'border border-[#e8e4de] text-[#5c5c5c] hover:border-[#6b7c5e]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 border border-[#e8e4de] rounded-lg text-sm text-[#5c5c5c] hover:border-[#6b7c5e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
