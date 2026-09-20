import { Link } from 'react-router-dom';
import { Heart, MapPin, Tag } from 'lucide-react';
import { useState } from 'react';
import { listingsAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Listing {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  condition: string;
  campus: string;
  category_name: string;
  seller_name: string;
  seller_avatar?: string;
  primary_image?: string;
  is_favorited?: boolean;
  favorites_count?: number;
}

const conditionLabel: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-emerald-50 text-emerald-700' },
  like_new: { label: 'Like New', color: 'bg-blue-50 text-blue-700' },
  good: { label: 'Good', color: 'bg-amber-50 text-amber-700' },
  fair: { label: 'Fair', color: 'bg-orange-50 text-orange-700' },
  poor: { label: 'Poor', color: 'bg-red-50 text-red-700' },
};

export default function ListingCard({ listing, onFavoriteChange }: {
  listing: Listing;
  onFavoriteChange?: (id: string, favorited: boolean) => void;
}) {
  const { user } = useAuthStore();
  const [favorited, setFavorited] = useState(listing.is_favorited || false);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to save items');
      return;
    }
    setLoading(true);
    try {
      const { data } = await listingsAPI.favorite(listing.id);
      setFavorited(data.favorited);
      onFavoriteChange?.(listing.id, data.favorited);
      toast.success(data.favorited ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const cond = conditionLabel[listing.condition] || { label: listing.condition, color: 'bg-gray-100 text-gray-600' };
  const discount = listing.original_price && listing.original_price > listing.price
    ? Math.round((1 - listing.price / listing.original_price) * 100)
    : null;

  return (
    <Link to={`/listing/${listing.id}`} className="group block">
      <div className="bg-white border border-[#e8e4de] rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#f3f0eb] overflow-hidden">
          {listing.primary_image ? (
            <img
              src={listing.primary_image}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-12 h-12 text-[#e8e4de]" />
            </div>
          )}

          {/* Discount badge */}
          {discount && (
            <span className="absolute top-2 left-2 bg-[#6b7c5e] text-white text-xs font-medium px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            disabled={loading}
            className={`absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-colors ${
              favorited ? 'text-rose-500' : 'text-[#8a8a8a] hover:text-rose-500'
            }`}
            aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-2 leading-snug flex-1">
              {listing.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-base font-semibold text-[#1a1a1a]">₹{listing.price.toLocaleString('en-IN')}</span>
            {listing.original_price && listing.original_price > listing.price && (
              <span className="text-xs text-[#8a8a8a] line-through">₹{listing.original_price.toLocaleString('en-IN')}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cond.color}`}>
              {cond.label}
            </span>
            <div className="flex items-center gap-1 text-xs text-[#8a8a8a]">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-24">{listing.campus}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[#f3f0eb]">
            <div className="w-5 h-5 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
              {listing.seller_name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-[#8a8a8a] truncate">{listing.seller_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
