import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Laptop, Calculator, FileText, Sofa, Bike, Package, Shirt, Dumbbell, Home, Headphones, ArrowRight } from 'lucide-react';
import { categoriesAPI } from '../api';

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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data.categories || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium text-[#6b7c5e] uppercase tracking-widest mb-2">Explore</p>
          <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">All Categories</h1>
          <p className="text-[#5c5c5c] text-sm mt-2">Browse campus essentials by category</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#e8e4de] rounded-2xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-[#f3f0eb] rounded-xl mb-3" />
                <div className="h-4 bg-[#f3f0eb] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[#f3f0eb] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => {
              const Icon = categoryIcons[cat.slug] || Package;
              return (
                <Link
                  key={cat.id}
                  to={`/marketplace?category=${cat.slug}`}
                  className="group bg-white border border-[#e8e4de] rounded-2xl p-6 hover:border-[#6b7c5e] hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 bg-[#f3f0eb] group-hover:bg-[#6b7c5e]/10 rounded-xl flex items-center justify-center mb-3 transition-colors">
                    <Icon className="w-6 h-6 text-[#6b7c5e]" />
                  </div>
                  <h3 className="font-medium text-[#1a1a1a] mb-1">{cat.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#8a8a8a]">{cat.listing_count} items</p>
                    <ArrowRight className="w-4 h-4 text-[#e8e4de] group-hover:text-[#6b7c5e] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
