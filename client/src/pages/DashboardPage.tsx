import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Heart, MessageCircle, Star, ShoppingBag, Edit2, Trash2, CheckCircle, LayoutDashboard } from 'lucide-react';
import { usersAPI, listingsAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [stats, setStats] = useState<any>({});
  const [listings, setListings] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      usersAPI.getDashboard(),
      usersAPI.getMyListings(),
      usersAPI.getFavorites(),
      usersAPI.getNotifications(),
    ]).then(([dash, lst, fav, notif]) => {
      setStats(dash.data);
      setListings(lst.data.listings || []);
      setWishlist(fav.data.favorites || []);
      setNotifications(notif.data.notifications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const deleteListing = async (id: string) => {
    if (!confirm('Remove this listing?')) return;
    try {
      await listingsAPI.delete(id);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing removed');
    } catch { toast.error('Failed to remove'); }
  };

  const markSold = async (id: string) => {
    try {
      await listingsAPI.update(id, { status: 'sold' });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l));
      toast.success('Marked as sold');
    } catch { toast.error('Failed to update'); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'notifications', label: 'Notifications', icon: MessageCircle },
  ];

  const CONDITION_COLOR: Record<string, string> = {
    new: 'text-emerald-700 bg-emerald-50',
    like_new: 'text-blue-700 bg-blue-50',
    good: 'text-amber-700 bg-amber-50',
    fair: 'text-orange-700 bg-orange-50',
    poor: 'text-red-700 bg-red-50',
  };

  if (!user) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <Link to="/login" className="text-[#6b7c5e] hover:underline">Sign in to view dashboard</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1a1a1a]">My Dashboard</h1>
            <p className="text-sm text-[#8a8a8a] mt-0.5">Welcome back, {user.name.split(' ')[0]}</p>
          </div>
          <Link to="/sell" className="flex items-center gap-2 px-4 py-2.5 bg-[#6b7c5e] text-white text-sm font-medium rounded-xl hover:bg-[#4a5c40] transition-colors">
            <ShoppingBag className="w-4 h-4" /> New Listing
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-52 flex-shrink-0">
            <nav className="bg-white border border-[#e8e4de] rounded-xl p-2 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#6b7c5e]/10 text-[#4a5c40]'
                        : 'text-[#5c5c5c] hover:bg-[#f3f0eb] hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
              <div className="border-t border-[#e8e4de] pt-1 mt-1">
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#5c5c5c] hover:bg-[#f3f0eb] transition-colors">
                  <Star className="w-4 h-4" /> My Profile
                </Link>
                <Link to="/messages" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#5c5c5c] hover:bg-[#f3f0eb] transition-colors">
                  <MessageCircle className="w-4 h-4" /> Messages {stats.unread > 0 && <span className="ml-auto text-xs bg-[#6b7c5e] text-white w-4 h-4 rounded-full flex items-center justify-center">{stats.unread}</span>}
                </Link>
              </div>
            </nav>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Active Listings', value: stats.active || 0, color: 'text-[#6b7c5e]' },
                    { label: 'Items Sold', value: stats.sold || 0, color: 'text-emerald-600' },
                    { label: 'Drafts', value: stats.drafts || 0, color: 'text-amber-600' },
                    { label: 'Wishlist', value: stats.wishlist || 0, color: 'text-rose-500' },
                    { label: 'Unread Messages', value: stats.unread || 0, color: 'text-blue-600' },
                    { label: 'Reviews', value: stats.reviews || 0, color: 'text-purple-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white border border-[#e8e4de] rounded-xl p-4">
                      <p className={`text-2xl font-semibold font-serif ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent listings preview */}
                <div className="bg-white border border-[#e8e4de] rounded-xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e4de]">
                    <h3 className="font-medium text-[#1a1a1a]">Recent Listings</h3>
                    <button onClick={() => setSearchParams({ tab: 'listings' })} className="text-xs text-[#6b7c5e] hover:underline">View all</button>
                  </div>
                  {listings.slice(0, 4).map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f3f0eb] last:border-0">
                      <div className="w-12 h-12 bg-[#f3f0eb] rounded-lg overflow-hidden flex-shrink-0">
                        {l.primary_image && <img src={l.primary_image} alt={l.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/listing/${l.id}`} className="text-sm font-medium text-[#1a1a1a] hover:text-[#6b7c5e] truncate block transition-colors">{l.title}</Link>
                        <p className="text-xs text-[#8a8a8a]">₹{l.price?.toLocaleString('en-IN')} · {l.status}</p>
                      </div>
                    </div>
                  ))}
                  {listings.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-[#8a8a8a] mb-3">No listings yet</p>
                      <Link to="/sell" className="text-sm text-[#6b7c5e] hover:underline">Create your first listing</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div>
                <div className="bg-white border border-[#e8e4de] rounded-xl">
                  <div className="px-5 py-4 border-b border-[#e8e4de]">
                    <h3 className="font-medium text-[#1a1a1a]">My Listings ({listings.length})</h3>
                  </div>
                  {listings.length === 0 ? (
                    <div className="p-10 text-center">
                      <Package className="w-10 h-10 text-[#e8e4de] mx-auto mb-3" />
                      <p className="text-sm text-[#8a8a8a] mb-4">No listings yet</p>
                      <Link to="/sell" className="text-sm bg-[#6b7c5e] text-white px-4 py-2 rounded-lg hover:bg-[#4a5c40] transition-colors">Post First Item</Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f3f0eb]">
                      {listings.map(l => (
                        <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-14 h-14 bg-[#f3f0eb] rounded-lg overflow-hidden flex-shrink-0">
                            {l.primary_image ? <img src={l.primary_image} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-[#e8e4de] m-auto" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link to={`/listing/${l.id}`} className="text-sm font-medium text-[#1a1a1a] hover:text-[#6b7c5e] truncate block transition-colors">{l.title}</Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-medium text-[#1a1a1a]">₹{l.price?.toLocaleString('en-IN')}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${CONDITION_COLOR[l.condition] || 'bg-gray-50 text-gray-600'}`}>{l.condition?.replace('_', ' ')}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.status === 'active' ? 'bg-emerald-50 text-emerald-700' : l.status === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>{l.status}</span>
                            </div>
                            <p className="text-xs text-[#8a8a8a] mt-0.5">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {l.status === 'active' && (
                              <button onClick={() => markSold(l.id)} title="Mark as sold" className="p-1.5 text-[#8a8a8a] hover:text-emerald-600 transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <Link to={`/listing/${l.id}`} className="p-1.5 text-[#8a8a8a] hover:text-[#1a1a1a] transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button onClick={() => deleteListing(l.id)} className="p-1.5 text-[#8a8a8a] hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <div className="bg-white border border-[#e8e4de] rounded-xl">
                  <div className="px-5 py-4 border-b border-[#e8e4de]">
                    <h3 className="font-medium text-[#1a1a1a]">Wishlist ({wishlist.length})</h3>
                  </div>
                  {wishlist.length === 0 ? (
                    <div className="p-10 text-center">
                      <Heart className="w-10 h-10 text-[#e8e4de] mx-auto mb-3" />
                      <p className="text-sm text-[#8a8a8a] mb-2">Your loop is empty.</p>
                      <Link to="/marketplace" className="text-sm text-[#6b7c5e] hover:underline">Browse marketplace</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
                      {wishlist.map(item => (
                        <Link key={item.id} to={`/listing/${item.id}`} className="group">
                          <div className="aspect-[4/3] bg-[#f3f0eb] rounded-xl overflow-hidden mb-2">
                            {item.primary_image && <img src={item.primary_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                          </div>
                          <p className="text-sm font-medium text-[#1a1a1a] line-clamp-1">{item.title}</p>
                          <p className="text-sm text-[#6b7c5e] font-semibold">₹{item.price?.toLocaleString('en-IN')}</p>
                          {item.status === 'sold' && <span className="text-xs text-[#8a8a8a]">This item was sold</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <div className="bg-white border border-[#e8e4de] rounded-xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e4de]">
                    <h3 className="font-medium text-[#1a1a1a]">Notifications</h3>
                    <button
                      onClick={() => { usersAPI.markNotificationsRead(); setNotifications(n => n.map(x => ({ ...x, is_read: 1 }))); }}
                      className="text-xs text-[#6b7c5e] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-sm text-[#8a8a8a]">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f3f0eb]">
                      {notifications.map(n => (
                        <div key={n.id} className={`flex items-start gap-3 px-5 py-3.5 ${!n.is_read ? 'bg-[#faf8f5]' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-[#6b7c5e]' : 'bg-[#e8e4de]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1a1a1a]">{n.title}</p>
                            {n.body && <p className="text-xs text-[#8a8a8a] mt-0.5">{n.body}</p>}
                            <p className="text-xs text-[#c4c0bc] mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                          </div>
                          {n.link && (
                            <Link to={n.link} className="text-xs text-[#6b7c5e] hover:underline flex-shrink-0">View</Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
