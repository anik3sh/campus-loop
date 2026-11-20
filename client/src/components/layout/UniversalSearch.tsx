import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Tag, User, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { searchAPI } from '../../api';
import { CAMPUSES, SAMPLE_USERS, type Campus, type UserSearchResult } from '../../data/campusData';

interface SearchResultsState {
  listings: any[];
  users: UserSearchResult[];
  campuses: Campus[];
}

interface UniversalSearchProps {
  className?: string;
  inputClassName?: string;
  onSelect?: () => void;
  isMobile?: boolean;
}

export default function UniversalSearch({
  className = '',
  inputClassName = '',
  onSelect,
  isMobile = false,
}: UniversalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultsState>({
    listings: [],
    users: [],
    campuses: [],
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant local search + debounced backend search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ listings: [], users: [], campuses: [] });
      setIsLoading(false);
      return;
    }

    const qLower = trimmed.toLowerCase();

    // 1. Instant local match for campuses and users
    const matchedCampuses = CAMPUSES.filter(
      c =>
        c.name.toLowerCase().includes(qLower) ||
        c.fullName.toLowerCase().includes(qLower) ||
        c.city.toLowerCase().includes(qLower) ||
        c.location.toLowerCase().includes(qLower)
    ).slice(0, 4);

    const matchedUsers = SAMPLE_USERS.filter(
      u =>
        u.name.toLowerCase().includes(qLower) ||
        u.username.toLowerCase().includes(qLower) ||
        u.college.toLowerCase().includes(qLower) ||
        u.campus.toLowerCase().includes(qLower) ||
        u.location.toLowerCase().includes(qLower) ||
        (u.bio && u.bio.toLowerCase().includes(qLower))
    ).slice(0, 4);

    setResults(prev => ({
      listings: prev.listings,
      users: matchedUsers,
      campuses: matchedCampuses,
    }));

    // 2. Fetch from backend API
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchAPI.universalSearch(trimmed);

        // Merge backend and local results deduplicated
        const mergedCampuses = [...(data.campuses || [])];
        for (const localC of matchedCampuses) {
          if (!mergedCampuses.some(c => c.name.toLowerCase() === localC.name.toLowerCase())) {
            mergedCampuses.push(localC);
          }
        }

        const mergedUsers = [...(data.users || [])];
        for (const localU of matchedUsers) {
          if (!mergedUsers.some(u => u.id === localU.id || u.username === localU.username)) {
            mergedUsers.push(localU);
          }
        }

        setResults({
          listings: data.listings || [],
          users: mergedUsers.slice(0, 4),
          campuses: mergedCampuses.slice(0, 4),
        });
      } catch {
        // Keep local matches on error
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      onSelect?.();
    }
  };

  const handleSelectListing = (id: string) => {
    navigate(`/listing/${id}`);
    setIsOpen(false);
    onSelect?.();
  };

  const handleSelectUser = (id: string) => {
    navigate(`/profile/${id}`);
    setIsOpen(false);
    onSelect?.();
  };

  const handleSelectCampus = (campusName: string) => {
    navigate(`/marketplace?campus=${encodeURIComponent(campusName)}`);
    setIsOpen(false);
    onSelect?.();
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ listings: [], users: [], campuses: [] });
    inputRef.current?.focus();
  };

  const hasResults =
    results.listings.length > 0 || results.users.length > 0 || results.campuses.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search campus items or users..."
          className={`pl-9 pr-8 py-1.5 bg-[#f1ede6] border border-[#e2ddd5] rounded-full text-sm focus:outline-none focus:border-[#5f7754] focus:bg-white transition-all text-[#1a1a1a] placeholder-[#8a8a8a] ${
            isMobile
              ? 'w-full py-2.5 rounded-xl'
              : 'w-48 sm:w-60 md:w-72 lg:w-80 focus:w-80 lg:focus:w-96'
          } ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8a8a8a] hover:text-[#1a1a1a] rounded-full"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Universal Search Results Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 bg-white border border-[#e8e4de] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150 ${
            isMobile
              ? 'left-0 right-0 max-h-[60vh] overflow-y-auto'
              : 'right-0 sm:left-0 sm:right-auto w-80 sm:w-96 md:w-[420px] max-h-[75vh] overflow-y-auto'
          }`}
        >
          {/* Header indicator while loading */}
          {isLoading && (
            <div className="px-4 py-2 bg-[#faf8f5] border-b border-[#f1ede6] flex items-center justify-between text-xs text-[#8a8a8a]">
              <span>Searching across campus...</span>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b7c5e]" />
            </div>
          )}

          {/* When query is empty: popular campus chips */}
          {!query.trim() && (
            <div className="p-4">
              <p className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider mb-2.5">
                Popular Campuses
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CAMPUSES.slice(0, 6).map(campus => (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => handleSelectCampus(campus.name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f3f0eb] hover:bg-[#e8e4de] text-[#1a1a1a] text-xs rounded-full transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-[#6b7c5e]" />
                    <span>{campus.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#8a8a8a]">
                Type an item name (e.g. <span className="text-[#6b7c5e] font-medium">calculator</span>), a student (e.g. <span className="text-[#6b7c5e] font-medium">Abhishek</span>), or a college.
              </p>
            </div>
          )}

          {/* Categorized results when query is present */}
          {query.trim() && hasResults && (
            <div className="py-2 divide-y divide-[#f3f0eb]">
              {/* 1. LISTINGS */}
              {results.listings.length > 0 && (
                <div className="py-1.5">
                  <div className="px-4 py-1 flex items-center gap-1.5 text-[11px] font-bold text-[#6b7c5e] uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    <span>Listings</span>
                  </div>
                  <div className="space-y-0.5">
                    {results.listings.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectListing(item.id)}
                        className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-[#faf8f5] transition-colors group"
                      >
                        {item.primary_image ? (
                          <img
                            src={item.primary_image}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#e8e4de]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#f3f0eb] flex items-center justify-center flex-shrink-0 border border-[#e8e4de]">
                            <Tag className="w-4 h-4 text-[#8a8a8a]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#6b7c5e] transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#8a8a8a] mt-0.5">
                            <span className="font-semibold text-[#6b7c5e]">
                              ₹{Number(item.price).toLocaleString('en-IN')}
                            </span>
                            {item.campus && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-0.5 text-[#5c5c5c]">
                                  <MapPin className="w-3 h-3 text-[#6b7c5e]" />
                                  {item.campus}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#c0bcb5] group-hover:text-[#6b7c5e] transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. USERS */}
              {results.users.length > 0 && (
                <div className="py-1.5">
                  <div className="px-4 py-1 flex items-center gap-1.5 text-[11px] font-bold text-[#6b7c5e] uppercase tracking-wider">
                    <User className="w-3 h-3" />
                    <span>Users</span>
                  </div>
                  <div className="space-y-0.5">
                    {results.users.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u.id)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#faf8f5] transition-colors group"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#5f7754] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-2xs">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* User Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#6b7c5e] transition-colors">
                              {u.name}
                            </span>
                            {u.username && (
                              <span className="text-xs text-[#8a8a8a]">
                                @{u.username}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5c5c5c] truncate mt-0.5">
                            <span className="font-medium text-[#1a1a1a]">{u.campus || u.college}</span>
                            {u.location && <span> · {u.location}</span>}
                          </p>
                          {u.bio && (
                            <p className="text-[11px] text-[#8a8a8a] truncate mt-0.5">
                              {u.bio}
                            </p>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-[#c0bcb5] group-hover:text-[#6b7c5e] transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CAMPUSES */}
              {results.campuses.length > 0 && (
                <div className="py-1.5">
                  <div className="px-4 py-1 flex items-center gap-1.5 text-[11px] font-bold text-[#6b7c5e] uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    <span>Campuses</span>
                  </div>
                  <div className="space-y-0.5">
                    {results.campuses.map(campus => (
                      <button
                        key={campus.id}
                        type="button"
                        onClick={() => handleSelectCampus(campus.name)}
                        className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-[#faf8f5] transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#6b7c5e]/10 text-[#6b7c5e] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#6b7c5e] transition-colors">
                            {campus.name}
                          </p>
                          <p className="text-xs text-[#8a8a8a] truncate">
                            {campus.fullName} · {campus.location}
                          </p>
                        </div>
                        <span className="text-xs text-[#6b7c5e] font-medium hidden sm:inline">
                          View listings
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results state */}
          {query.trim() && !hasResults && !isLoading && (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-[#c0bcb5] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1a1a1a]">
                No items or users matching "{query}"
              </p>
              <p className="text-xs text-[#8a8a8a] mt-1 mb-4">
                Try searching for calculators, books, electronics, or student names.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1 text-xs text-[#6b7c5e] font-medium hover:underline"
              >
                Search all marketplace listings for "{query}" <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Footer view all link */}
          {query.trim() && (
            <div className="px-4 py-2.5 bg-[#faf8f5] border-t border-[#e8e4de] flex items-center justify-between">
              <span className="text-xs text-[#8a8a8a]">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-[#e2ddd5] rounded text-[10px] font-mono">Enter</kbd> to search marketplace
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                className="text-xs font-semibold text-[#6b7c5e] hover:text-[#4a5c40] flex items-center gap-1 transition-colors"
              >
                View all results <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
