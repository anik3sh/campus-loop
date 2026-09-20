import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoopAI from './components/ui/LoopAI';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SellPage from './pages/SellPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CategoriesPage from './pages/CategoriesPage';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const { checkAuth } = useAuthStore();
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#faf8f5]">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/sell" element={
              <ProtectedRoute><SellPage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/messages/:conversationId" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute><Navigate to="/dashboard?tab=wishlist" replace /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Navigate to="/dashboard?tab=notifications" replace /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute><AdminPage /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />

        {/* Loop AI floating button */}
        {!aiOpen && (
          <button
            onClick={() => setAiOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#6b7c5e] text-white rounded-full shadow-lg hover:bg-[#4a5c40] transition-all hover:shadow-xl"
            aria-label="Open Loop AI"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Loop AI</span>
          </button>
        )}

        {aiOpen && <LoopAI onClose={() => setAiOpen(false)} />}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
