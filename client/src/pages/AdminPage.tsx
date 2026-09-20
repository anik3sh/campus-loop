import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, Flag, BarChart3, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { adminAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) { navigate('/'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [s, u, l, r] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getListings(),
        adminAPI.getReports(),
      ]);
      setStats(s.data);
      setUsers(u.data.users || []);
      setListings(l.data.listings || []);
      setReports(r.data.reports || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const suspendUser = async (id: string, suspend: boolean) => {
    await adminAPI.suspendUser(id, suspend);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: suspend ? 1 : 0 } : u));
    toast.success(suspend ? 'User suspended' : 'User unsuspended');
  };

  const updateListingStatus = async (id: string, status: string) => {
    await adminAPI.updateListing(id, status);
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast.success('Listing updated');
  };

  const resolveReport = async (id: string, status: string) => {
    await adminAPI.updateReport(id, { status });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Report updated');
  };

  const tabs = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'listings', label: 'Listings', icon: Package },
    { id: 'reports', label: `Reports ${reports.filter(r => r.status === 'pending').length > 0 ? `(${reports.filter(r => r.status === 'pending').length})` : ''}`, icon: Flag },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a1a]">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-[#e8e4de] rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-[#6b7c5e] text-white' : 'text-[#5c5c5c] hover:text-[#1a1a1a]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        {tab === 'stats' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Users', value: stats.totalUsers || 0 },
                { label: 'Active Listings', value: stats.activeListings || 0 },
                { label: 'Items Sold', value: stats.soldListings || 0 },
                { label: 'Pending Reports', value: stats.pendingReports || 0, alert: stats.pendingReports > 0 },
              ].map((s, i) => (
                <div key={i} className={`bg-white border rounded-xl p-4 ${s.alert ? 'border-red-200 bg-red-50' : 'border-[#e8e4de]'}`}>
                  <p className={`text-2xl font-semibold font-serif ${s.alert ? 'text-red-600' : 'text-[#6b7c5e]'}`}>{s.value.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[#8a8a8a] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-[#e8e4de] rounded-xl p-4">
                <p className="text-sm font-medium text-[#8a8a8a] mb-2">Marketplace Value</p>
                <p className="font-serif text-2xl font-semibold text-[#1a1a1a]">₹{(stats.totalValue || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-[#8a8a8a] mt-1">Total value of active listings</p>
              </div>
              <div className="bg-white border border-[#e8e4de] rounded-xl p-4">
                <p className="text-sm font-medium text-[#8a8a8a] mb-2">Flagged Content</p>
                <p className="font-serif text-2xl font-semibold text-red-600">{stats.flaggedListings || 0}</p>
                <p className="text-xs text-[#8a8a8a] mt-1">Listings pending review</p>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white border border-[#e8e4de] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e8e4de]">
              <h3 className="font-medium text-[#1a1a1a]">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5] border-b border-[#e8e4de]">
                    {['Name', 'Email', 'College', 'Listings', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#8a8a8a] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f0eb]">
                  {users.map(u => (
                    <tr key={u.id} className={u.is_suspended ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-medium text-[#1a1a1a]">{u.name}</span>
                          {u.is_admin ? <span className="text-xs bg-[#1a1a1a] text-white px-1.5 rounded">Admin</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#5c5c5c]">{u.email}</td>
                      <td className="px-4 py-3 text-[#5c5c5c] truncate max-w-32">{u.college}</td>
                      <td className="px-4 py-3 text-[#5c5c5c]">{u.listing_count}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_suspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {u.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!u.is_admin && (
                          <button
                            onClick={() => suspendUser(u.id, !u.is_suspended)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                              u.is_suspended
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'border-red-300 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div className="bg-white border border-[#e8e4de] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e8e4de]">
              <h3 className="font-medium text-[#1a1a1a]">All Listings ({listings.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5] border-b border-[#e8e4de]">
                    {['Item', 'Seller', 'Price', 'Status', 'Views', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#8a8a8a] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f0eb]">
                  {listings.map(l => (
                    <tr key={l.id} className={l.status === 'flagged' ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {l.primary_image && <img src={l.primary_image} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                          <span className="font-medium text-[#1a1a1a] truncate max-w-40">{l.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#5c5c5c]">{l.seller_name}</td>
                      <td className="px-4 py-3 font-medium">₹{l.price?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          l.status === 'active' ? 'bg-emerald-100 text-emerald-700'
                          : l.status === 'flagged' ? 'bg-amber-100 text-amber-700'
                          : l.status === 'sold' ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-700'
                        }`}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[#5c5c5c]">{l.views}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {l.status !== 'active' && (
                            <button onClick={() => updateListingStatus(l.id, 'active')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {l.status !== 'removed' && (
                            <button onClick={() => updateListingStatus(l.id, 'removed')} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="bg-white border border-[#e8e4de] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e8e4de]">
              <h3 className="font-medium text-[#1a1a1a]">Reports ({reports.length})</h3>
            </div>
            <div className="divide-y divide-[#f3f0eb]">
              {reports.map(r => (
                <div key={r.id} className={`px-5 py-4 ${r.status === 'pending' ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.status === 'pending' ? 'bg-amber-100 text-amber-700'
                          : r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>{r.status}</span>
                        <span className="text-sm font-medium text-[#1a1a1a]">{r.reason}</span>
                      </div>
                      {r.listing_title && <p className="text-xs text-[#8a8a8a]">Listing: {r.listing_title}</p>}
                      <p className="text-xs text-[#8a8a8a]">By: {r.reporter_name}</p>
                      {r.description && <p className="text-sm text-[#5c5c5c] mt-1">{r.description}</p>}
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => resolveReport(r.id, 'resolved')} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                          Resolve
                        </button>
                        <button onClick={() => resolveReport(r.id, 'dismissed')} className="text-xs px-3 py-1.5 border border-[#e8e4de] text-[#5c5c5c] rounded-lg hover:border-[#1a1a1a] transition-colors">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#8a8a8a]">No reports yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
