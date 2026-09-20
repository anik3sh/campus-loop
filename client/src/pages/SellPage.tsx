import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ChevronLeft, ChevronRight, CheckCircle, Loader2, Plus } from 'lucide-react';
import { listingsAPI, categoriesAPI, aiAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const STEPS = ['Photos', 'Details', 'Category', 'Condition', 'Price', 'Description', 'AI Enhance', 'Preview', 'Publish'];

const CONDITIONS = [
  { value: 'new', label: 'New', desc: 'Never used, original packaging' },
  { value: 'like_new', label: 'Like New', desc: 'Barely used, excellent condition' },
  { value: 'good', label: 'Good', desc: 'Normal use, works perfectly' },
  { value: 'fair', label: 'Fair', desc: 'Some wear, fully functional' },
  { value: 'poor', label: 'Poor', desc: 'Heavy use, needs attention' },
];

export default function SellPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    original_price: '',
    condition: '',
    category_id: '',
    campus: user?.campus || '',
    is_negotiable: false,
    tags: '',
    selling_highlights: '',
  });
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [priceAI, setPriceAI] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    categoriesAPI.getAll().then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 8 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, j) => j !== i));
    setImagePreviews(prev => prev.filter((_, j) => j !== i));
  };

  const fetchPriceAI = async () => {
    if (!form.title || !form.condition) return;
    setPriceLoading(true);
    try {
      const { data } = await aiAPI.suggestPrice({
        title: form.title,
        condition: form.condition,
        original_price: form.original_price ? parseFloat(form.original_price) : undefined,
      });
      setPriceAI(data);
    } catch {
      setPriceAI(null);
    } finally {
      setPriceLoading(false);
    }
  };

  const runAIEnhance = async () => {
    if (!form.title) { toast.error('Enter product name first'); return; }
    setAiLoading(true);
    try {
      const { data } = await aiAPI.enhanceListing({
        name: form.title,
        condition: form.condition || 'good',
        description: form.description || '',
      });
      setAiResult(data);
    } catch (err: any) {
      if (err.response?.data?.fallback) {
        toast.error('AI is not configured. Add your GROQ_API_KEY to use AI features.');
      } else {
        toast.error('AI enhancement failed. Please try again.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAI = () => {
    if (!aiResult) return;
    update('title', aiResult.title);
    update('description', aiResult.description);
    if (aiResult.tags) update('tags', aiResult.tags.join(', '));
    if (aiResult.highlights) update('selling_highlights', JSON.stringify(aiResult.highlights));
    if (aiResult.price_min && !form.price) {
      update('price', String(Math.round((aiResult.price_min + aiResult.price_max) / 2)));
    }
    // Find matching category
    if (aiResult.category && categories.length) {
      const match = categories.find(c => c.name.toLowerCase() === aiResult.category.toLowerCase() || c.slug === aiResult.category.toLowerCase().replace(/\s+/g, '_'));
      if (match) update('category_id', match.id);
    }
    toast.success('AI suggestions applied!');
    setStep(7); // Go to preview
  };

  const handlePublish = async () => {
    if (!form.title || !form.price || !form.condition || !form.category_id) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      images.forEach(img => fd.append('images', img));
      const { data } = await listingsAPI.create(fd);
      toast.success('Listing published! 🎉');
      navigate(`/listing/${data.listing.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // images optional
      case 1: return !!form.title;
      case 2: return !!form.category_id;
      case 3: return !!form.condition;
      case 4: return !!form.price;
      case 5: return !!form.description;
      default: return true;
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a1a] mb-2">List Your Item</h1>
          <p className="text-sm text-[#8a8a8a]">Step {step + 1} of {STEPS.length}: <strong className="text-[#1a1a1a]">{STEPS[step]}</strong></p>
          <div className="mt-3 h-1.5 bg-[#e8e4de] rounded-full">
            <div
              className="h-full bg-[#6b7c5e] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex mt-2 overflow-x-auto gap-2">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${
                  i === step
                    ? 'bg-[#6b7c5e] text-white'
                    : i < step
                    ? 'bg-[#e8e4de] text-[#4a5c40] cursor-pointer hover:bg-[#d4d0ca]'
                    : 'text-[#8a8a8a]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e8e4de] rounded-2xl p-6 min-h-80">
          {/* Step 0: Photos */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Add Photos</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">Add up to 8 photos. First photo will be the cover image.</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImages(e.target.files)} />
              <div className="grid grid-cols-3 gap-3 mb-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#f3f0eb]">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute bottom-1.5 left-1.5 text-xs bg-[#6b7c5e] text-white px-1.5 py-0.5 rounded">Cover</span>}
                    <button onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#e8e4de] flex flex-col items-center justify-center gap-2 hover:border-[#6b7c5e] hover:bg-[#faf8f5] transition-colors text-[#8a8a8a]"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">{imagePreviews.length === 0 ? 'Add Photos' : 'Add More'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8a8a8a]">JPG, PNG or WebP. Max 10MB each.</p>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Item Details</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">What are you selling? Give it a clear, searchable name.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    placeholder="e.g. Casio FX-991EX Scientific Calculator"
                    className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Campus / Location</label>
                  <input
                    type="text"
                    value={form.campus}
                    onChange={e => update('campus', e.target.value)}
                    placeholder="e.g. IIT Delhi, Hauz Khas"
                    className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Original Price (₹)</label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={e => update('original_price', e.target.value)}
                    placeholder="What you paid originally (optional)"
                    className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Select Category</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">Choose the most relevant category for your item.</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => update('category_id', c.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      form.category_id === c.id
                        ? 'border-[#6b7c5e] bg-[#6b7c5e]/10 text-[#4a5c40]'
                        : 'border-[#e8e4de] hover:border-[#6b7c5e] text-[#5c5c5c]'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Condition */}
          {step === 3 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Item Condition</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">Be honest — buyers trust accurate condition ratings.</p>
              <div className="space-y-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => update('condition', c.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                      form.condition === c.value
                        ? 'border-[#6b7c5e] bg-[#6b7c5e]/10'
                        : 'border-[#e8e4de] hover:border-[#6b7c5e]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{c.label}</p>
                      <p className="text-xs text-[#8a8a8a]">{c.desc}</p>
                    </div>
                    {form.condition === c.value && <CheckCircle className="w-5 h-5 text-[#6b7c5e] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Price */}
          {step === 4 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Set Your Price</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">Price it fairly to sell quickly.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Asking Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8a8a8a]">₹</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => update('price', e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.is_negotiable} onChange={e => update('is_negotiable', e.target.checked)}
                    className="w-4 h-4 accent-[#6b7c5e]" />
                  <span className="text-sm text-[#5c5c5c]">Price is negotiable</span>
                </label>

                {/* AI Price suggestion */}
                <div className="border border-[#e8e4de] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#6b7c5e]" />
                      <span className="text-sm font-medium text-[#1a1a1a]">AI Price Suggestion</span>
                    </div>
                    <button
                      onClick={fetchPriceAI}
                      disabled={priceLoading || !form.title || !form.condition}
                      className="text-xs text-[#6b7c5e] border border-[#6b7c5e]/30 px-3 py-1 rounded-full hover:bg-[#6b7c5e]/10 transition-colors disabled:opacity-50"
                    >
                      {priceLoading ? 'Getting...' : 'Get Suggestion'}
                    </button>
                  </div>
                  {priceAI ? (
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                        Suggested range: <span className="text-[#6b7c5e]">₹{priceAI.price_min?.toLocaleString('en-IN')} – ₹{priceAI.price_max?.toLocaleString('en-IN')}</span>
                      </p>
                      <p className="text-xs text-[#8a8a8a] mb-2">{priceAI.explanation}</p>
                      <button
                        onClick={() => update('price', String(priceAI.suggested_price))}
                        className="text-xs text-[#6b7c5e] hover:underline"
                      >
                        Use suggested price (₹{priceAI.suggested_price?.toLocaleString('en-IN')})
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#8a8a8a]">Get AI-powered pricing advice based on similar campus listings.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Description */}
          {step === 5 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Describe Your Item</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">More detail = more trust. Mention age, usage, any defects.</p>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={8}
                placeholder="Describe your item. Include age, usage, any wear or defects, what's included, etc."
                className="w-full px-4 py-3 border border-[#e8e4de] rounded-xl text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5] resize-none leading-relaxed"
              />
              <p className="text-xs text-[#8a8a8a] mt-2">{form.description.length} characters — aim for 50–200 words</p>
            </div>
          )}

          {/* Step 6: AI Enhancement */}
          {step === 6 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">✨ Improve with Loop AI</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">Let AI generate a better title, description, and tags for your listing.</p>

              <div className="bg-[#f3f0eb] rounded-xl p-4 mb-5">
                <p className="text-xs text-[#8a8a8a] mb-1">Current title</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{form.title || '(not set)'}</p>
              </div>

              {!aiResult ? (
                <button
                  onClick={runAIEnhance}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6b7c5e] text-white font-medium rounded-xl hover:bg-[#4a5c40] transition-colors disabled:opacity-70"
                >
                  {aiLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enhancing with Loop AI...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Enhance with AI</>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="border border-[#6b7c5e]/20 bg-[#6b7c5e]/5 rounded-xl p-4">
                    <p className="text-xs text-[#6b7c5e] font-medium mb-2">AI Suggested Title</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{aiResult.title}</p>
                  </div>
                  <div className="border border-[#6b7c5e]/20 bg-[#6b7c5e]/5 rounded-xl p-4">
                    <p className="text-xs text-[#6b7c5e] font-medium mb-2">AI Description</p>
                    <p className="text-sm text-[#5c5c5c] leading-relaxed">{aiResult.description}</p>
                  </div>
                  {aiResult.highlights?.length > 0 && (
                    <div className="border border-[#6b7c5e]/20 bg-[#6b7c5e]/5 rounded-xl p-4">
                      <p className="text-xs text-[#6b7c5e] font-medium mb-2">Selling Highlights</p>
                      <ul className="space-y-1">
                        {aiResult.highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-[#5c5c5c]">
                            <CheckCircle className="w-3 h-3 text-[#6b7c5e]" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiResult.price_min && (
                    <div className="border border-[#6b7c5e]/20 bg-[#6b7c5e]/5 rounded-xl p-4">
                      <p className="text-xs text-[#6b7c5e] font-medium mb-1">Price Suggestion</p>
                      <p className="text-sm text-[#5c5c5c]">₹{aiResult.price_min?.toLocaleString('en-IN')} – ₹{aiResult.price_max?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-[#8a8a8a] mt-1">{aiResult.price_note}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={applyAI} className="flex-1 py-2.5 bg-[#6b7c5e] text-white text-sm font-medium rounded-xl hover:bg-[#4a5c40] transition-colors">
                      Apply AI Suggestions
                    </button>
                    <button onClick={() => setAiResult(null)} className="px-4 py-2.5 border border-[#e8e4de] text-sm text-[#5c5c5c] rounded-xl hover:border-[#1a1a1a] transition-colors">
                      Redo
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setStep(7)} className="mt-4 w-full py-2.5 border border-[#e8e4de] text-sm text-[#5c5c5c] rounded-xl hover:border-[#1a1a1a] transition-colors">
                Skip AI, continue →
              </button>
            </div>
          )}

          {/* Step 7: Preview */}
          {step === 7 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2">Preview Your Listing</h2>
              <p className="text-sm text-[#8a8a8a] mb-5">Review everything before publishing.</p>
              <div className="space-y-3">
                {imagePreviews[0] && (
                  <img src={imagePreviews[0]} alt="" className="w-full h-48 object-cover rounded-xl" />
                )}
                <div className="bg-[#f3f0eb] rounded-xl p-4 space-y-2">
                  <h3 className="font-serif text-lg font-semibold text-[#1a1a1a]">{form.title || '(no title)'}</h3>
                  <p className="text-2xl font-semibold text-[#1a1a1a]">₹{parseFloat(form.price || '0').toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-2 text-xs text-[#8a8a8a]">
                    <span className="bg-white border border-[#e8e4de] px-2 py-0.5 rounded-full capitalize">{form.condition?.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>{categories.find(c => c.id === form.category_id)?.name || 'No category'}</span>
                    <span>·</span>
                    <span>{form.campus}</span>
                  </div>
                  {form.is_negotiable && <span className="text-xs text-[#6b7c5e]">Negotiable</span>}
                </div>
                {form.description && (
                  <div>
                    <p className="text-xs text-[#8a8a8a] mb-1">Description</p>
                    <p className="text-sm text-[#5c5c5c] leading-relaxed">{form.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 8: Publish */}
          {step === 8 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#6b7c5e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#6b7c5e]" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a] mb-2">Ready to Publish!</h2>
              <p className="text-sm text-[#8a8a8a] mb-6">Your listing will be visible to all campus students immediately.</p>
              <div className="bg-[#f3f0eb] rounded-xl p-4 text-left mb-6 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8a8a8a]">Title</span>
                  <span className="font-medium text-[#1a1a1a] truncate max-w-48">{form.title}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8a8a8a]">Price</span>
                  <span className="font-medium text-[#1a1a1a]">₹{parseFloat(form.price || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8a8a8a]">Photos</span>
                  <span className="font-medium text-[#1a1a1a]">{images.length} uploaded</span>
                </div>
              </div>
              <button
                onClick={handlePublish}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#6b7c5e] text-white font-semibold rounded-xl hover:bg-[#4a5c40] transition-colors disabled:opacity-70 text-base"
              >
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</> : '🚀 Publish Listing'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#e8e4de] rounded-xl text-sm text-[#5c5c5c] hover:border-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
