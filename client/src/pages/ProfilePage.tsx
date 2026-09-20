import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Calendar, Package, MessageCircle } from 'lucide-react';
import { usersAPI, messagesAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import ListingCard from '../components/listings/ListingCard';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    usersAPI.getProfile(id).then(({ data }) => {
      setProfile(data.user);
      setListings(data.listings || []);
      setReviews(data.reviews || []);
    }).catch(() => navigate('/marketplace')).finally(() => setLoading(false));
  }, [id]);

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await messagesAPI.startConversation(id!);
      navigate(`/messages/${data.conversation.id}`);
    } catch { toast.error('Could not start conversation'); }
  };

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await usersAPI.submitReview({ reviewee_id: id, rating: reviewForm.rating, comment: reviewForm.comment });
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      // Reload reviews
      const { data } = await usersAPI.getProfile(id!);
      setReviews(data.reviews || []);
    } catch { toast.error('Could not submit review'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-40 bg-[#f3f0eb] rounded-2xl mb-6" />
      </div>
    </div>
  );

  if (!profile) return null;
  const isOwn = user?.id === id;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile header */}
        <div className="bg-white border border-[#e8e4de] rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white text-2xl font-semibold overflow-hidden flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-semibold text-[#1a1a1a]">{profile.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#8a8a8a]">
                <span>{profile.college}</span>
                {profile.campus && (
                  <>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.campus}
                    </div>
                  </>
                )}
              </div>
              {profile.bio && <p className="text-sm text-[#5c5c5c] mt-2 max-w-lg">{profile.bio}</p>}

              <div className="flex items-center gap-4 mt-3">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#c4a882] text-[#c4a882]" />
                    <span className="text-sm font-medium text-[#1a1a1a]">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-[#8a8a8a]">({reviews.length} reviews)</span>
                  </div>
                )}
                <span className="text-sm text-[#8a8a8a]">{profile.total_sold} sold</span>
                <span className="text-sm text-[#8a8a8a]">{profile.response_rate}% response</span>
                <div className="flex items-center gap-1 text-sm text-[#8a8a8a]">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>

            {!isOwn && user && (
              <button
                onClick={handleMessage}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#e8e4de] text-sm font-medium text-[#5c5c5c] rounded-xl hover:border-[#6b7c5e] hover:text-[#6b7c5e] transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Message
              </button>
            )}
            {isOwn && (
              <Link to="/dashboard?tab=overview" className="px-4 py-2.5 border border-[#e8e4de] text-sm font-medium text-[#5c5c5c] rounded-xl hover:border-[#6b7c5e] transition-colors">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-[#e8e4de] rounded-xl p-1 w-fit">
          {['listings', 'reviews'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-[#6b7c5e] text-white' : 'text-[#5c5c5c] hover:text-[#1a1a1a]'
              }`}
            >
              {t} {t === 'listings' ? `(${listings.length})` : `(${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'listings' && (
          listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-[#e8e4de] mx-auto mb-3" />
              <p className="text-sm text-[#8a8a8a]">No active listings</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white border border-[#e8e4de] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {r.reviewer_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1a1a1a]">{r.reviewer_name}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`w-3.5 h-3.5 ${star <= r.rating ? 'fill-[#c4a882] text-[#c4a882]' : 'text-[#e8e4de]'}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-[#5c5c5c] leading-relaxed">{r.comment}</p>}
                    <p className="text-xs text-[#c4c0bc] mt-1">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Leave review */}
            {user && !isOwn && (
              <div className="bg-white border border-[#e8e4de] rounded-xl p-5">
                <h3 className="font-medium text-[#1a1a1a] mb-3">Leave a Review</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                      <Star className={`w-6 h-6 transition-colors ${s <= reviewForm.rating ? 'fill-[#c4a882] text-[#c4a882]' : 'text-[#e8e4de] hover:text-[#c4a882]'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  rows={3}
                  placeholder="Share your experience with this seller..."
                  className="w-full px-3 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5] resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="mt-3 px-5 py-2.5 bg-[#6b7c5e] text-white text-sm font-medium rounded-lg hover:bg-[#4a5c40] transition-colors disabled:opacity-70"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}

            {reviews.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#8a8a8a]">No reviews yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
