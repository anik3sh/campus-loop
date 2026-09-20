import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Flag, MapPin, Calendar, Star, MessageCircle, ChevronLeft, ChevronRight, Tag, CheckCircle } from 'lucide-react';
import { listingsAPI, messagesAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import ListingCard from '../components/listings/ListingCard';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  like_new: { label: 'Like New', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  good: { label: 'Good', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  fair: { label: 'Fair', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  poor: { label: 'Poor', color: 'text-red-700 bg-red-50 border-red-200' },
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [listing, setListing] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    listingsAPI.getOne(id).then(({ data }) => {
      setListing(data.listing);
      setSimilar(data.similar || []);
      setFavorited(data.listing.is_favorited || false);
    }).catch(() => navigate('/marketplace')).finally(() => setLoading(false));
  }, [id]);

  const handleFavorite = async () => {
    if (!user) { toast.error('Sign in to save items'); return; }
    try {
      const { data } = await listingsAPI.favorite(id!);
      setFavorited(data.favorited);
      toast.success(data.favorited ? 'Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Something went wrong'); }
  };

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (listing.seller_id === user.id) { toast.error("You can't message yourself"); return; }
    setMessaging(true);
    try {
      const { data } = await messagesAPI.startConversation(listing.seller_id, listing.id);
      navigate(`/messages/${data.conversation.id}`);
    } catch { toast.error('Could not start conversation'); }
    finally { setMessaging(false); }
  };

  const handleReport = async () => {
    if (!reportReason) { toast.error('Select a reason'); return; }
    try {
      await listingsAPI.report(id!, { reason: reportReason });
      toast.success('Report submitted. We\'ll review it.');
      setReportOpen(false);
    } catch { toast.error('Could not submit report'); }
  };

  const handleShare = () => {
    navigator.share?.({ title: listing.title, url: window.location.href })
      .catch(() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!')));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-[#f3f0eb] rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-[#f3f0eb] rounded w-2/3" />
            <div className="h-6 bg-[#f3f0eb] rounded w-1/4" />
            <div className="h-20 bg-[#f3f0eb] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const cond = CONDITION_LABELS[listing.condition] || { label: listing.condition, color: 'text-gray-600 bg-gray-50 border-gray-200' };
  const images = listing.images || [];
  const discount = listing.original_price && listing.original_price > listing.price
    ? Math.round((1 - listing.price / listing.original_price) * 100)
    : null;
  const tags = JSON.parse(listing.tags || '[]');
  const highlights = JSON.parse(listing.selling_highlights || '[]');
  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#8a8a8a] mb-6">
          <Link to="/marketplace" className="hover:text-[#1a1a1a] transition-colors">Marketplace</Link>
          <span>/</span>
          <Link to={`/marketplace?category=${listing.category_slug}`} className="hover:text-[#1a1a1a] transition-colors">{listing.category_name}</Link>
          <span>/</span>
          <span className="text-[#1a1a1a] truncate max-w-xs">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Images */}
          <div>
            <div className="relative aspect-[4/3] bg-[#f3f0eb] rounded-2xl overflow-hidden mb-3">
              {images.length > 0 ? (
                <img
                  src={images[activeImage]?.url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tag className="w-16 h-16 text-[#e8e4de]" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage ? 'border-[#6b7c5e]' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1a1a1a] leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={handleFavorite} className={`p-2 rounded-full border transition-colors ${favorited ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-[#e8e4de] text-[#5c5c5c] hover:text-rose-500'}`}>
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                </button>
                <button onClick={handleShare} className="p-2 rounded-full border border-[#e8e4de] text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-semibold text-[#1a1a1a]">₹{listing.price.toLocaleString('en-IN')}</span>
              {listing.original_price > listing.price && (
                <>
                  <span className="text-lg text-[#8a8a8a] line-through">₹{listing.original_price.toLocaleString('en-IN')}</span>
                  <span className="bg-[#6b7c5e] text-white text-xs font-medium px-2 py-0.5 rounded-full">{discount}% off</span>
                </>
              )}
              {listing.is_negotiable ? <span className="text-xs text-[#6b7c5e] border border-[#6b7c5e]/30 px-2 py-0.5 rounded-full">Negotiable</span> : null}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#f3f0eb] rounded-lg px-3 py-2.5">
                <p className="text-xs text-[#8a8a8a] mb-0.5">Condition</p>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full border ${cond.color}`}>{cond.label}</span>
              </div>
              <div className="bg-[#f3f0eb] rounded-lg px-3 py-2.5">
                <p className="text-xs text-[#8a8a8a] mb-0.5">Category</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{listing.category_name}</p>
              </div>
              <div className="bg-[#f3f0eb] rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3 text-[#8a8a8a]" />
                  <p className="text-xs text-[#8a8a8a]">Campus</p>
                </div>
                <p className="text-sm font-medium text-[#1a1a1a]">{listing.campus}</p>
              </div>
              <div className="bg-[#f3f0eb] rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3 text-[#8a8a8a]" />
                  <p className="text-xs text-[#8a8a8a]">Posted</p>
                </div>
                <p className="text-sm font-medium text-[#1a1a1a]">
                  {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-[#8a8a8a] uppercase tracking-wide mb-2">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((h: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-[#4a5c40] bg-[#6b7c5e]/10 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-5">
              <p className="text-xs text-[#8a8a8a] uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-[#5c5c5c] leading-relaxed">{listing.description}</p>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs text-[#8a8a8a] border border-[#e8e4de] px-2.5 py-1 rounded-full">#{tag}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            {!isOwner && (
              <div className="flex gap-3">
                <button
                  onClick={handleMessage}
                  disabled={messaging}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#6b7c5e] text-white font-medium rounded-xl hover:bg-[#4a5c40] transition-colors disabled:opacity-70"
                >
                  <MessageCircle className="w-5 h-5" />
                  {messaging ? 'Opening...' : 'Message Seller'}
                </button>
                <button onClick={handleFavorite} className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-xl font-medium transition-colors ${favorited ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-[#e8e4de] text-[#5c5c5c] hover:border-[#6b7c5e]'}`}>
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                  {favorited ? 'Saved' : 'Save'}
                </button>
              </div>
            )}

            {isOwner && (
              <div className="flex gap-3">
                <Link to={`/listing/${id}/edit`} className="flex-1 text-center py-3 border border-[#e8e4de] text-[#5c5c5c] font-medium rounded-xl hover:border-[#6b7c5e] transition-colors">
                  Edit Listing
                </Link>
                <button
                  onClick={async () => {
                    if (!confirm('Mark this as sold?')) return;
                    await listingsAPI.update(id!, { status: 'sold' });
                    toast.success('Marked as sold');
                    setListing((l: any) => ({ ...l, status: 'sold' }));
                  }}
                  className="flex-1 py-3 bg-[#1a1a1a] text-white font-medium rounded-xl hover:bg-[#2d2d2d] transition-colors"
                >
                  Mark as Sold
                </button>
              </div>
            )}

            {listing.status === 'sold' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[#8a8a8a] bg-[#f3f0eb] px-4 py-2.5 rounded-lg">
                <CheckCircle className="w-4 h-4 text-[#6b7c5e]" /> This item has been sold
              </div>
            )}

            {/* Report */}
            {!isOwner && (
              <button
                onClick={() => setReportOpen(true)}
                className="mt-3 flex items-center gap-1.5 text-xs text-[#8a8a8a] hover:text-red-600 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" /> Report this listing
              </button>
            )}
          </div>
        </div>

        {/* Seller profile snippet */}
        <div className="bg-white border border-[#e8e4de] rounded-xl p-5 mb-10">
          <h3 className="text-sm font-medium text-[#8a8a8a] mb-3">Seller Information</h3>
          <div className="flex items-center gap-4">
            <Link to={`/profile/${listing.seller_id}`} className="flex items-center gap-3 flex-1 group">
              <div className="w-12 h-12 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white font-medium text-lg overflow-hidden flex-shrink-0">
                {listing.seller_avatar ? (
                  <img src={listing.seller_avatar} alt={listing.seller_name} className="w-full h-full object-cover" />
                ) : listing.seller_name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-[#1a1a1a] group-hover:text-[#6b7c5e] transition-colors">{listing.seller_name}</p>
                <p className="text-sm text-[#8a8a8a]">{listing.seller_college}</p>
              </div>
            </Link>
            <div className="flex items-center gap-4 text-sm text-[#8a8a8a]">
              {listing.seller_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#c4a882] text-[#c4a882]" />
                  <span className="font-medium text-[#1a1a1a]">{Number(listing.seller_rating).toFixed(1)}</span>
                  <span>({listing.seller_review_count})</span>
                </div>
              )}
              <div>
                <span className="text-[#1a1a1a] font-medium">{listing.response_rate}%</span> response rate
              </div>
              <div>
                <span className="text-[#1a1a1a] font-medium">{listing.total_sold}</span> items sold
              </div>
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a] mb-6">Similar Items</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similar.map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4">Report Listing</h3>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#e8e4de] rounded-lg text-sm mb-4 focus:outline-none focus:border-[#6b7c5e]"
            >
              <option value="">Select reason...</option>
              <option value="spam">Spam or misleading</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="scam">Possible scam</option>
              <option value="prohibited">Prohibited item</option>
              <option value="fake">Fake listing</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setReportOpen(false)} className="flex-1 py-2.5 border border-[#e8e4de] rounded-lg text-sm text-[#5c5c5c] hover:border-[#1a1a1a] transition-colors">Cancel</button>
              <button onClick={handleReport} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
