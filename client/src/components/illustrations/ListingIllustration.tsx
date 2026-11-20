export type IllustrationType =
  | 'calculator'
  | 'laptop'
  | 'book'
  | 'math-book'
  | 'calculus-book'
  | 'python-book'
  | 'chemistry-book'
  | 'headphones'
  | 'keyboard'
  | 'mouse'
  | 'table'
  | 'lamp'
  | 'drawing-kit'
  | 'notes'
  | 'physics-notes'
  | 'backpack'
  | 'cycle'
  | 'clothing'
  | 'sports'
  | 'hostel'
  | 'package';

interface ListingLike {
  id?: string;
  title?: string;
  category_slug?: string;
  category_name?: string;
  tags?: string | string[];
  primary_image?: string;
}

export function getIllustrationType(listing?: ListingLike | null, explicitType?: IllustrationType): IllustrationType {
  if (explicitType) return explicitType;
  if (!listing) return 'package';

  const id = (listing.id || '').toLowerCase();
  // Specific seed listings by ID
  if (id === 'lst-001') return 'calculator';
  if (id === 'lst-002') return 'math-book';
  if (id === 'lst-003') return 'laptop';
  if (id === 'lst-004') return 'calculus-book';
  if (id === 'lst-005') return 'table';
  if (id === 'lst-006') return 'headphones';
  if (id === 'lst-007') return 'drawing-kit';
  if (id === 'lst-008') return 'mouse';
  if (id === 'lst-009') return 'physics-notes';
  if (id === 'lst-010') return 'backpack';
  if (id === 'lst-011') return 'lamp';
  if (id === 'lst-012') return 'python-book';
  if (id === 'lst-013') return 'keyboard';
  if (id === 'lst-014') return 'chemistry-book';
  if (id === 'lst-015') return 'cycle';

  const title = (listing.title || '').toLowerCase();
  const cat = (listing.category_slug || listing.category_name || '').toLowerCase();
  const tagsStr = Array.isArray(listing.tags) ? listing.tags.join(' ') : (listing.tags || '');
  const searchStr = `${title} ${cat} ${tagsStr}`.toLowerCase();

  // Keyword Matching
  if (searchStr.includes('calculator') || searchStr.includes('casio')) return 'calculator';
  if (searchStr.includes('python')) return 'python-book';
  if (searchStr.includes('calculus') || searchStr.includes('stewart')) return 'calculus-book';
  if (searchStr.includes('chemistry') || searchStr.includes('ncert')) return 'chemistry-book';
  if (searchStr.includes('math') || searchStr.includes('jain') || searchStr.includes('textbook')) return 'math-book';
  if (searchStr.includes('book') || cat.includes('book')) return 'book';
  if (searchStr.includes('laptop') || searchStr.includes('macbook') || searchStr.includes('pavilion') || searchStr.includes('computer')) return 'laptop';
  if (searchStr.includes('headphone') || searchStr.includes('earphone') || searchStr.includes('sony') || searchStr.includes('audio')) return 'headphones';
  if (searchStr.includes('keyboard') || searchStr.includes('redragon') || searchStr.includes('keychron')) return 'keyboard';
  if (searchStr.includes('mouse') || searchStr.includes('logitech')) return 'mouse';
  if (searchStr.includes('table') || searchStr.includes('desk') || searchStr.includes('chair') || searchStr.includes('furniture') || cat.includes('furniture')) return 'table';
  if (searchStr.includes('lamp') || searchStr.includes('light') || searchStr.includes('led')) return 'lamp';
  if (searchStr.includes('drawing') || searchStr.includes('compass') || searchStr.includes('drafter') || searchStr.includes('scale')) return 'drawing-kit';
  if (searchStr.includes('note') || searchStr.includes('handwritten') || cat.includes('note')) return 'physics-notes';
  if (searchStr.includes('backpack') || searchStr.includes('bag') || searchStr.includes('contra')) return 'backpack';
  if (searchStr.includes('cycle') || searchStr.includes('bicycle') || searchStr.includes('bike') || cat.includes('bike')) return 'cycle';
  if (searchStr.includes('shirt') || searchStr.includes('hoodie') || searchStr.includes('cloth') || cat.includes('cloth')) return 'clothing';
  if (searchStr.includes('sport') || searchStr.includes('football') || searchStr.includes('badminton') || cat.includes('sport')) return 'sports';
  if (searchStr.includes('hostel') || cat.includes('hostel')) return 'hostel';

  // Category Slugs
  if (cat.includes('elect')) return 'laptop';
  if (cat.includes('access')) return 'backpack';

  return 'package';
}

interface IllustrationProps {
  type?: IllustrationType;
  listing?: ListingLike | null;
  title?: string;
  className?: string;
  isMini?: boolean;
}

export default function ListingIllustration({
  type,
  listing,
  title,
  className = '',
  isMini = false,
}: IllustrationProps) {
  // Check if listing has a genuine user-uploaded photo (not unsplash)
  const imageUrl = listing?.primary_image;
  const isRealUpload =
    imageUrl &&
    !imageUrl.includes('unsplash.com') &&
    (imageUrl.startsWith('/uploads/') ||
      imageUrl.startsWith('blob:') ||
      imageUrl.startsWith('data:image/') ||
      imageUrl.includes('localhost:5000/uploads/'));

  if (isRealUpload) {
    return (
      <img
        src={imageUrl}
        alt={title || listing?.title || 'Listing item'}
        className={`w-full h-full object-cover ${className}`}
        loading="lazy"
        onError={(e) => {
          // If image fails to load, replace with illustration
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  const illustrationType = getIllustrationType(listing, type);
  const displayTitle = title || listing?.title || 'Campus item';

  return (
    <div
      className={`relative w-full h-full select-none flex items-center justify-center overflow-hidden ${
        isMini ? 'p-1' : ''
      } ${className}`}
      role="img"
      aria-label={displayTitle}
    >
      <VectorCanvas type={illustrationType} />
    </div>
  );
}

function VectorCanvas({ type }: { type: IllustrationType }) {
  switch (type) {
    case 'calculator':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle minimal background */}
          <rect width="240" height="180" rx="16" fill="#F2F5F0" />
          <circle cx="120" cy="90" r="64" fill="#E2EBE0" opacity="0.65" />

          {/* Calculator Chassis */}
          <g transform="translate(75, 22)">
            <rect x="0" y="0" width="90" height="136" rx="12" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            
            {/* Top brand accent */}
            <circle cx="15" cy="14" r="3" fill="#556947" />
            <line x1="24" y1="14" x2="42" y2="14" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Solar cell */}
            <rect x="52" y="9" width="28" height="10" rx="2" fill="#3F3F46" />
            <line x1="61" y1="9" x2="61" y2="19" stroke="#52525B" strokeWidth="1" />
            <line x1="70" y1="9" x2="70" y2="19" stroke="#52525B" strokeWidth="1" />

            {/* LCD Display */}
            <rect x="8" y="26" width="74" height="26" rx="4" fill="#EDF2EA" stroke="#27272A" strokeWidth="1.6" />
            <path d="M14 42 Q28 34 42 42 T70 36" stroke="#556947" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <line x1="14" y1="33" x2="32" y2="33" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />

            {/* Directional Pad */}
            <circle cx="45" cy="62" r="7" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.4" />
            <circle cx="45" cy="62" r="2.5" fill="#556947" />

            {/* Keypad Grid */}
            {/* Row 1 */}
            <rect x="10" y="74" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="25" y="74" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="40" y="74" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="55" y="74" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="70" y="74" width="10" height="7" rx="2" fill="#E2876B" stroke="#27272A" strokeWidth="1.2" />

            {/* Row 2 */}
            <rect x="10" y="85" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="25" y="85" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="40" y="85" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="55" y="85" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="70" y="85" width="10" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />

            {/* Row 3 */}
            <rect x="10" y="96" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="25" y="96" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="40" y="96" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="55" y="96" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="70" y="96" width="10" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />

            {/* Row 4 */}
            <rect x="10" y="107" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="25" y="107" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="40" y="107" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="55" y="107" width="12" height="7" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="70" y="107" width="10" height="7" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.2" />

            {/* Row 5 - Bottom */}
            <rect x="10" y="118" width="18" height="8" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="32" y="118" width="18" height="8" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
            <rect x="54" y="118" width="26" height="8" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'laptop':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F0F3F7" />
          <circle cx="120" cy="85" r="66" fill="#DEE5EF" opacity="0.6" />

          {/* Screen / Bezel */}
          <rect x="52" y="28" width="136" height="92" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="2" />
          <rect x="58" y="34" width="124" height="80" rx="4" fill="#24272E" />

          {/* Web camera dot */}
          <circle cx="120" cy="31" r="1.5" fill="#71717A" />

          {/* Screen Content - Minimal code / UI */}
          <circle cx="67" cy="42" r="2.2" fill="#E2876B" />
          <circle cx="74" cy="42" r="2.2" fill="#E5A93C" />
          <circle cx="81" cy="42" r="2.2" fill="#556947" />

          <line x1="67" y1="55" x2="115" y2="55" stroke="#556947" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="75" y1="65" x2="140" y2="65" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />
          <line x1="75" y1="74" x2="110" y2="74" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="67" y1="84" x2="98" y2="84" stroke="#556947" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="75" y1="94" x2="150" y2="94" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />

          {/* Subtle cursor */}
          <rect x="154" y="90" width="3" height="8" rx="1" fill="#FFFFFF" />

          {/* Base / Chassis */}
          <path
            d="M36 120 L204 120 C207 120 209 123 207 126 L196 142 C194 144 191 146 188 146 L52 146 C49 146 46 144 44 142 L33 126 C31 123 33 120 36 120 Z"
            fill="#FFFFFF"
            stroke="#27272A"
            strokeWidth="2"
          />

          {/* Trackpad */}
          <rect x="102" y="125" width="36" height="14" rx="3" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />

          {/* Front opening notch */}
          <rect x="110" y="145" width="20" height="2" rx="1" fill="#71717A" />
        </svg>
      );

    case 'math-book':
    case 'book':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F7F4EE" />
          <circle cx="120" cy="90" r="64" fill="#EFE8DB" opacity="0.75" />

          {/* Stack of books */}
          {/* Bottom Book */}
          <g transform="translate(48, 114)">
            <rect x="0" y="0" width="144" height="26" rx="4" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <rect x="0" y="0" width="20" height="26" rx="4" fill="#556947" stroke="#27272A" strokeWidth="2" />
            <line x1="28" y1="8" x2="136" y2="8" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="28" y1="13" x2="136" y2="13" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="28" y1="18" x2="136" y2="18" stroke="#E4E4E7" strokeWidth="1.5" />
          </g>

          {/* Middle Book */}
          <g transform="translate(56, 82)">
            <rect x="0" y="0" width="132" height="24" rx="4" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <rect x="0" y="0" width="18" height="24" rx="4" fill="#8B7355" stroke="#27272A" strokeWidth="2" />
            <line x1="26" y1="7" x2="124" y2="7" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="26" y1="12" x2="124" y2="12" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="26" y1="17" x2="124" y2="17" stroke="#E4E4E7" strokeWidth="1.5" />
          </g>

          {/* Top Book - Slanted / Displayed */}
          <g transform="translate(62, 50)">
            <rect x="0" y="0" width="120" height="24" rx="4" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <rect x="0" y="0" width="16" height="24" rx="4" fill="#556947" stroke="#27272A" strokeWidth="2" />

            {/* Embossed Math Sigma / Integral symbol */}
            <path d="M42 7 L55 7 L46 12 L55 17 L42 17" stroke="#27272A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="64" y1="9" x2="108" y2="9" stroke="#71717A" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="64" y1="15" x2="94" y2="15" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" />

            {/* Ribbon Bookmark */}
            <path d="M96 22 L96 46 L101 41 L106 46 L106 22 Z" fill="#E2876B" stroke="#27272A" strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'calculus-book':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F8F5EE" />
          <circle cx="120" cy="90" r="64" fill="#EFE8DB" opacity="0.7" />

          {/* Upright Calculus Book */}
          <g transform="translate(72, 28)">
            {/* Book Pages Block */}
            <rect x="12" y="10" width="94" height="116" rx="4" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.5" />
            
            {/* Front Cover */}
            <rect x="0" y="0" width="96" height="124" rx="6" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            {/* Spine */}
            <rect x="0" y="0" width="14" height="124" rx="4" fill="#9E6746" stroke="#27272A" strokeWidth="2" />

            {/* Cover Design - Cartesian Grid & Parabola */}
            <rect x="22" y="24" width="66" height="54" rx="4" fill="#FAF8F5" stroke="#E4E4E7" strokeWidth="1.2" />
            <line x1="26" y1="64" x2="84" y2="64" stroke="#71717A" strokeWidth="1.2" />
            <line x1="36" y1="28" x2="36" y2="74" stroke="#71717A" strokeWidth="1.2" />
            <path d="M36 64 Q50 64 62 46 T82 32" stroke="#556947" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Calculus Text Header lines */}
            <line x1="22" y1="88" x2="82" y2="88" stroke="#27272A" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="96" x2="68" y2="96" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="22" y1="104" x2="54" y2="104" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'python-book':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#EFF5F1" />
          <circle cx="120" cy="90" r="64" fill="#DFECE2" opacity="0.75" />

          <g transform="translate(70, 26)">
            {/* Pages Edge */}
            <rect x="14" y="8" width="94" height="120" rx="4" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.5" />
            {/* Cover */}
            <rect x="0" y="0" width="98" height="128" rx="8" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            {/* Header Brand Band */}
            <path d="M0 8 C0 3.5 3.5 0 8 0 L90 0 C94.5 0 98 3.5 98 8 L98 34 L0 34 Z" fill="#4A7C59" />

            {/* Terminal prompt symbol on band */}
            <path d="M14 13 L21 17 L14 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="25" y1="21" x2="35" y2="21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

            {/* Python Brackets Illustration on cover */}
            <rect x="20" y="48" width="58" height="42" rx="6" fill="#F4F9F5" stroke="#E2EBE4" strokeWidth="1.4" />
            <path d="M36 62 L28 69 L36 76" stroke="#556947" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M62 62 L70 69 L62 76" stroke="#556947" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="43" y1="78" x2="55" y2="60" stroke="#27272A" strokeWidth="1.8" strokeLinecap="round" />

            {/* Textbook metadata lines */}
            <line x1="20" y1="102" x2="78" y2="102" stroke="#27272A" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="110" x2="60" y2="110" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'chemistry-book':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#EEF4F8" />
          <circle cx="120" cy="90" r="64" fill="#DDE8F1" opacity="0.7" />

          <g transform="translate(68, 28)">
            {/* Book Body */}
            <rect x="12" y="8" width="98" height="120" rx="4" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.5" />
            <rect x="0" y="0" width="102" height="126" rx="6" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <rect x="0" y="0" width="14" height="126" rx="4" fill="#4A6FA5" stroke="#27272A" strokeWidth="2" />

            {/* Chemistry Flask Illustration */}
            <g transform="translate(36, 32)">
              <rect x="0" y="0" width="46" height="52" rx="6" fill="#F0F5FA" stroke="#D3E2EE" strokeWidth="1.2" />
              <path d="M20 12 L20 19 L10 37 A3 3 0 0 0 13 41 L33 41 A3 3 0 0 0 36 37 L26 19 L26 12" stroke="#27272A" strokeWidth="1.8" fill="#FFFFFF" strokeLinejoin="round" />
              <line x1="18" y1="12" x2="28" y2="12" stroke="#27272A" strokeWidth="1.8" strokeLinecap="round" />
              {/* Liquid level */}
              <path d="M13 36 Q23 33 33 36 L33 40 A2 2 0 0 1 31 41 L15 41 A2 2 0 0 1 13 40 Z" fill="#4A6FA5" />
              <circle cx="21" cy="28" r="1.5" fill="#4A6FA5" />
              <circle cx="27" cy="24" r="1.2" fill="#4A6FA5" />
            </g>

            <line x1="24" y1="96" x2="86" y2="96" stroke="#27272A" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="104" x2="72" y2="104" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="24" y1="112" x2="52" y2="112" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'headphones':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F3F1F6" />
          <circle cx="120" cy="90" r="64" fill="#E6E2EE" opacity="0.65" />

          {/* Headband Outer Arc */}
          <path d="M64 110 C64 48 176 48 176 110" stroke="#27272A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {/* Inner Cushion Padding */}
          <path d="M78 98 C78 60 162 60 162 98" stroke="#D4D0DE" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Left Earcup */}
          <g transform="translate(50, 96)">
            {/* Pivot hinge */}
            <rect x="10" y="0" width="8" height="10" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.5" />
            {/* Earcup cushion */}
            <rect x="0" y="8" width="28" height="44" rx="14" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <line x1="14" y1="18" x2="14" y2="42" stroke="#E4E4E7" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Right Earcup */}
          <g transform="translate(162, 96)">
            <rect x="10" y="0" width="8" height="10" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.5" />
            <rect x="0" y="8" width="28" height="44" rx="14" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <line x1="14" y1="18" x2="14" y2="42" stroke="#E4E4E7" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Minimal sound wave ripples */}
          <path d="M198 108 C204 114 204 126 198 132" stroke="#556947" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M206 102 C214 112 214 128 206 138" stroke="#556947" strokeWidth="2" opacity="0.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'keyboard':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F4F4F5" />
          <circle cx="120" cy="90" r="66" fill="#E4E4E7" opacity="0.6" />

          {/* USB Cable from top */}
          <path d="M120 48 L120 32 C120 24 136 24 136 34 L136 40" stroke="#27272A" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Keyboard Chassis */}
          <rect x="36" y="48" width="168" height="92" rx="10" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />

          {/* Top Row - Esc and F-keys */}
          <rect x="46" y="56" width="12" height="10" rx="2" fill="#E2876B" stroke="#27272A" strokeWidth="1.2" />
          <rect x="63" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="76" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="89" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="107" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="120" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="133" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="151" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="164" y="56" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="180" y="56" width="14" height="10" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.2" />

          {/* Row 2 */}
          <rect x="46" y="70" width="14" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="63" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="76" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="89" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="102" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="115" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="128" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="141" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="154" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="167" y="70" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="180" y="70" width="14" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />

          {/* Row 3 */}
          <rect x="46" y="84" width="16" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="65" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="78" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="91" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="104" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="117" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="130" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="143" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="156" y="84" width="10" height="10" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="169" y="84" width="25" height="10" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.2" />

          {/* Row 4 - Bottom with Spacebar */}
          <rect x="46" y="98" width="18" height="12" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="68" y="98" width="12" height="12" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="84" y="98" width="70" height="12" rx="3" fill="#556947" stroke="#27272A" strokeWidth="1.2" />
          <rect x="158" y="98" width="12" height="12" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />
          <rect x="174" y="98" width="20" height="12" rx="2" fill="#F4F4F5" stroke="#27272A" strokeWidth="1.2" />

          {/* Status LEDs */}
          <circle cx="186" cy="122" r="1.5" fill="#556947" />
          <circle cx="192" cy="122" r="1.5" fill="#A1A1AA" />
        </svg>
      );

    case 'mouse':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F5F4F0" />
          <circle cx="120" cy="90" r="64" fill="#E8E5DD" opacity="0.65" />

          {/* Wireless Waves */}
          <path d="M112 36 C117 32 123 32 128 36" stroke="#556947" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M106 28 C115 22 125 22 134 28" stroke="#556947" strokeWidth="2" opacity="0.5" strokeLinecap="round" fill="none" />

          {/* Mouse Pebble Body */}
          <g transform="translate(82, 46)">
            <path
              d="M38 0 C16 0 0 24 0 54 L0 76 C0 106 16 122 38 122 C60 122 76 106 76 76 L76 54 C76 24 60 0 38 0 Z"
              fill="#FFFFFF"
              stroke="#27272A"
              strokeWidth="2"
            />
            {/* Split Line between buttons */}
            <line x1="38" y1="0" x2="38" y2="44" stroke="#27272A" strokeWidth="1.6" />

            {/* Scroll Wheel */}
            <rect x="33" y="16" width="10" height="20" rx="5" fill="#27272A" />
            <line x1="35" y1="23" x2="41" y2="23" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
            <line x1="35" y1="28" x2="41" y2="28" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />

            {/* Minimal Brand Accent / Sensor */}
            <circle cx="38" cy="85" r="4" fill="#556947" opacity="0.8" />
          </g>
        </svg>
      );

    case 'table':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F7F2EB" />
          <circle cx="120" cy="90" r="66" fill="#ECE3D6" opacity="0.75" />

          {/* Ceramic Cup on table */}
          <rect x="70" y="58" width="14" height="16" rx="2" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.6" />
          <path d="M84 62 Q90 66 84 70" stroke="#27272A" strokeWidth="1.4" fill="none" />
          <line x1="72" y1="52" x2="75" y2="47" stroke="#A1A1AA" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="78" y1="52" x2="81" y2="47" stroke="#A1A1AA" strokeWidth="1.2" strokeLinecap="round" />

          {/* Table Top (Solid Wood) */}
          <path d="M42 74 L198 74 L208 84 L32 84 Z" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" strokeLinejoin="round" />

          {/* Table Apron / Drawer Frame */}
          <rect x="44" y="84" width="152" height="24" rx="2" fill="#F4EFE6" stroke="#27272A" strokeWidth="2" />

          {/* Pull Drawer on right */}
          <rect x="134" y="88" width="56" height="16" rx="2" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.6" />
          <circle cx="162" cy="96" r="2.5" fill="#8B7355" />

          {/* Tapered Legs */}
          {/* Back Left Leg */}
          <line x1="62" y1="108" x2="58" y2="148" stroke="#A1A1AA" strokeWidth="2.5" strokeLinecap="round" />
          {/* Back Right Leg */}
          <line x1="178" y1="108" x2="182" y2="148" stroke="#A1A1AA" strokeWidth="2.5" strokeLinecap="round" />

          {/* Front Left Leg */}
          <line x1="52" y1="108" x2="42" y2="152" stroke="#27272A" strokeWidth="3" strokeLinecap="round" />
          {/* Front Right Leg */}
          <line x1="188" y1="108" x2="198" y2="152" stroke="#27272A" strokeWidth="3" strokeLinecap="round" />

          {/* Floor Shadow line */}
          <ellipse cx="120" cy="154" rx="84" ry="4" fill="#E4DCD0" opacity="0.6" />
        </svg>
      );

    case 'lamp':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#FAF5ED" />
          <circle cx="120" cy="90" r="64" fill="#EFE5D4" opacity="0.65" />

          {/* Soft ambient warm light cone */}
          <path d="M68 62 L105 66 L130 152 L30 152 Z" fill="#FBBF24" opacity="0.14" />

          {/* Lamp Base */}
          <ellipse cx="152" cy="144" rx="28" ry="8" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
          {/* Touch button on base */}
          <circle cx="152" cy="144" r="3" fill="#556947" />

          {/* Articulated Arm */}
          <path d="M152 140 L152 102 L105 66" stroke="#27272A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Mid Joint Hinge */}
          <circle cx="152" cy="102" r="4.5" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />

          {/* Lamp Head Joint */}
          <circle cx="105" cy="66" r="4" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />

          {/* Sleek Horizontal Lamp Head */}
          <path d="M105 66 L62 62 L62 55 L105 59 Z" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" strokeLinejoin="round" />
          {/* LED Strip underside */}
          <line x1="66" y1="62" x2="101" y2="65" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'drawing-kit':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F0F4F8" />
          <circle cx="120" cy="90" r="64" fill="#DFE8F1" opacity="0.75" />

          {/* Set Square 45° Drafting Triangle */}
          <path d="M54 138 L142 138 L54 50 Z" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" strokeLinejoin="round" />
          <path d="M68 126 L124 126 L68 70 Z" fill="#E8F0F7" stroke="#27272A" strokeWidth="1.4" strokeLinejoin="round" />

          {/* Metric Marks along edge */}
          <line x1="60" y1="138" x2="60" y2="132" stroke="#71717A" strokeWidth="1.2" />
          <line x1="70" y1="138" x2="70" y2="134" stroke="#71717A" strokeWidth="1" />
          <line x1="80" y1="138" x2="80" y2="132" stroke="#71717A" strokeWidth="1.2" />
          <line x1="90" y1="138" x2="90" y2="134" stroke="#71717A" strokeWidth="1" />
          <line x1="100" y1="138" x2="100" y2="132" stroke="#71717A" strokeWidth="1.2" />
          <line x1="110" y1="138" x2="110" y2="134" stroke="#71717A" strokeWidth="1" />
          <line x1="120" y1="138" x2="120" y2="132" stroke="#71717A" strokeWidth="1.2" />

          {/* Precision Drafting Compass */}
          <g transform="translate(142, 38)">
            <circle cx="20" cy="10" r="5" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
            <line x1="20" y1="0" x2="20" y2="5" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />

            {/* Left needle leg */}
            <line x1="17" y1="14" x2="-8" y2="98" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Right pencil leg */}
            <line x1="23" y1="14" x2="48" y2="98" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />

            {/* Adjustment screw spindle */}
            <line x1="2" y1="52" x2="38" y2="52" stroke="#556947" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="52" r="3" fill="#8B7355" />

            {/* Lead tip & needle point */}
            <circle cx="-8" cy="98" r="1.5" fill="#27272A" />
            <polygon points="46,96 50,96 48,103" fill="#27272A" />
          </g>
        </svg>
      );

    case 'physics-notes':
    case 'notes':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#FBF8EF" />
          <circle cx="120" cy="90" r="64" fill="#F2EBD7" opacity="0.75" />

          <g transform="translate(68, 26)">
            {/* Spiral Bound Notebook Body */}
            <rect x="10" y="0" width="104" height="128" rx="6" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />

            {/* Sticky Marker Tab */}
            <rect x="94" y="16" width="16" height="14" rx="2" fill="#E2876B" />

            {/* Ruled Notebook Lines */}
            <line x1="24" y1="26" x2="88" y2="26" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="38" x2="98" y2="38" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="50" x2="98" y2="50" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="62" x2="98" y2="62" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="74" x2="98" y2="74" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="86" x2="98" y2="86" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="98" x2="98" y2="98" stroke="#E4E4E7" strokeWidth="1.5" />
            <line x1="24" y1="110" x2="84" y2="110" stroke="#E4E4E7" strokeWidth="1.5" />

            {/* Physics Harmonic Wave sketched */}
            <path d="M26 62 Q42 42 58 62 T90 62" stroke="#556947" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="58" cy="62" r="2" fill="#556947" />

            {/* Formula notations */}
            <line x1="26" y1="86" x2="68" y2="86" stroke="#27272A" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="26" y1="98" x2="52" y2="98" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />

            {/* Metallic Spiral Rings on left */}
            {[14, 28, 42, 56, 70, 84, 98, 112].map((y) => (
              <g key={y}>
                <rect x="6" y={y} width="9" height="5" rx="2.5" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
              </g>
            ))}

            {/* Ballpoint Pen leaning */}
            <g transform="translate(78, 70) rotate(-22)">
              <rect x="0" y="0" width="6" height="52" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.4" />
              <rect x="0" y="0" width="6" height="14" rx="2" fill="#556947" />
              <line x1="1" y1="4" x2="1" y2="12" stroke="#27272A" strokeWidth="1" />
              <polygon points="1,52 5,52 3,57" fill="#27272A" />
            </g>
          </g>
        </svg>
      );

    case 'backpack':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#EFF3EE" />
          <circle cx="120" cy="90" r="66" fill="#DFE9DD" opacity="0.75" />

          <g transform="translate(76, 26)">
            {/* Top Grab Handle */}
            <path d="M28 24 C28 10 60 10 60 24" stroke="#27272A" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Main Backpack Body */}
            <path
              d="M10 40 C10 20 78 20 78 40 L84 116 C84 126 4 126 4 116 Z"
              fill="#FFFFFF"
              stroke="#27272A"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Side Water Bottle Holder */}
            <path d="M84 76 C92 76 92 108 84 112" stroke="#27272A" strokeWidth="1.8" fill="#F4F4F5" />

            {/* Front Utility Compartment */}
            <path
              d="M12 70 C12 60 76 60 76 70 L76 118 C76 124 12 124 12 118 Z"
              fill="#F2F6F0"
              stroke="#27272A"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Front Zipper Accent */}
            <line x1="20" y1="72" x2="68" y2="72" stroke="#556947" strokeWidth="2.5" strokeLinecap="round" />

            {/* Minimal Campus Brand Tag */}
            <rect x="38" y="86" width="12" height="12" rx="3" fill="#556947" />
            <circle cx="44" cy="92" r="2" fill="#FFFFFF" />

            {/* Bottom Lash Straps */}
            <line x1="22" y1="120" x2="32" y2="120" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="120" x2="66" y2="120" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'cycle':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F8F3F0" />
          <circle cx="120" cy="90" r="66" fill="#EFE3DD" opacity="0.75" />

          {/* Rear Wheel */}
          <circle cx="64" cy="112" r="26" fill="#FFFFFF" stroke="#27272A" strokeWidth="2.5" />
          <circle cx="64" cy="112" r="22" fill="#F8F5F2" stroke="#27272A" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx="64" cy="112" r="4" fill="#27272A" />

          {/* Front Wheel */}
          <circle cx="176" cy="112" r="26" fill="#FFFFFF" stroke="#27272A" strokeWidth="2.5" />
          <circle cx="176" cy="112" r="22" fill="#F8F5F2" stroke="#27272A" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx="176" cy="112" r="4" fill="#27272A" />

          {/* Pedal Center Bracket */}
          <circle cx="112" cy="112" r="6" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
          <line x1="108" y1="118" x2="116" y2="106" stroke="#27272A" strokeWidth="2" strokeLinecap="round" />

          {/* Frame Tubes */}
          {/* Chainstay */}
          <line x1="64" y1="112" x2="112" y2="112" stroke="#27272A" strokeWidth="2" />
          {/* Seatstay */}
          <line x1="64" y1="112" x2="94" y2="68" stroke="#27272A" strokeWidth="2" />
          {/* Seat Tube */}
          <line x1="112" y1="112" x2="91" y2="58" stroke="#556947" strokeWidth="3" strokeLinecap="round" />
          {/* Top Tube */}
          <line x1="94" y1="68" x2="150" y2="68" stroke="#556947" strokeWidth="3" strokeLinecap="round" />
          {/* Down Tube */}
          <line x1="112" y1="112" x2="150" y2="68" stroke="#556947" strokeWidth="3" strokeLinecap="round" />
          {/* Fork */}
          <line x1="150" y1="68" x2="176" y2="112" stroke="#27272A" strokeWidth="2.2" strokeLinecap="round" />

          {/* Handlebar stem & grips */}
          <path d="M150 68 L148 54 L158 52" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line x1="156" y1="52" x2="162" y2="52" stroke="#556947" strokeWidth="3.5" strokeLinecap="round" />

          {/* Minimal Saddle */}
          <path d="M80 56 Q92 54 104 56 L100 61 L85 61 Z" fill="#27272A" />
        </svg>
      );

    case 'clothing':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F5F3F6" />
          <circle cx="120" cy="90" r="64" fill="#E7E3EA" opacity="0.75" />

          {/* Folded Crewneck / Campus T-Shirt */}
          <g transform="translate(64, 34)">
            {/* Main Folded Garment */}
            <path
              d="M32 20 L0 44 L16 62 L26 54 L26 112 L86 112 L86 54 L96 62 L112 44 L80 20 Z"
              fill="#FFFFFF"
              stroke="#27272A"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Ribbed Collar */}
            <path d="M34 20 C42 32 70 32 78 20" stroke="#27272A" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Pocket / Minimalist Chest Insignia */}
            <rect x="42" y="48" width="28" height="24" rx="4" fill="#F2F0F5" stroke="#27272A" strokeWidth="1.5" />
            <circle cx="56" cy="60" r="3" fill="#556947" />

            {/* Fold Hemline */}
            <line x1="26" y1="102" x2="86" y2="102" stroke="#E4E4E7" strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'sports':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F0F5EC" />
          <circle cx="120" cy="90" r="64" fill="#DFEBD8" opacity="0.75" />

          {/* Sports Ball Geometry */}
          <circle cx="120" cy="90" r="42" fill="#FFFFFF" stroke="#27272A" strokeWidth="2.2" />

          {/* Center Pentagon */}
          <polygon
            points="120,74 133,83 128,98 112,98 107,83"
            fill="#556947"
            stroke="#27272A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Seam Lines extending to perimeter */}
          <line x1="120" y1="74" x2="120" y2="48" stroke="#27272A" strokeWidth="1.8" />
          <line x1="133" y1="83" x2="158" y2="76" stroke="#27272A" strokeWidth="1.8" />
          <line x1="128" y1="98" x2="146" y2="124" stroke="#27272A" strokeWidth="1.8" />
          <line x1="112" y1="98" x2="94" y2="124" stroke="#27272A" strokeWidth="1.8" />
          <line x1="107" y1="83" x2="82" y2="76" stroke="#27272A" strokeWidth="1.8" />
        </svg>
      );

    case 'hostel':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F5F2EE" />
          <circle cx="120" cy="90" r="64" fill="#E8E1D9" opacity="0.75" />

          {/* Electric Hostel Kettle */}
          <g transform="translate(80, 36)">
            {/* Kettle Base */}
            <rect x="8" y="102" width="64" height="8" rx="3" fill="#3F3F46" stroke="#27272A" strokeWidth="1.8" />
            <line x1="12" y1="106" x2="68" y2="106" stroke="#52525B" strokeWidth="1" />

            {/* Kettle Body */}
            <path
              d="M16 102 L14 44 C14 36 66 36 66 44 L64 102 Z"
              fill="#FFFFFF"
              stroke="#27272A"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Spout on left */}
            <path d="M14 46 L2 42 L14 56 Z" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.8" />

            {/* Lid & Handle */}
            <rect x="22" y="32" width="36" height="6" rx="2" fill="#556947" stroke="#27272A" strokeWidth="1.6" />
            <circle cx="40" cy="30" r="3" fill="#27272A" />

            {/* Handle on right */}
            <path d="M65 48 C82 48 82 92 64 96" stroke="#27272A" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Water level indicator gauge */}
            <rect x="36" y="54" width="8" height="38" rx="4" fill="#EDF3F7" stroke="#27272A" strokeWidth="1.2" />
            <rect x="37" y="70" width="6" height="21" rx="3" fill="#556947" />
          </g>
        </svg>
      );

    case 'package':
    default:
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="180" rx="16" fill="#F7F4EC" />
          <circle cx="120" cy="90" r="64" fill="#ECE5D6" opacity="0.75" />

          {/* Minimal 3D Isometric Craft Box */}
          <g transform="translate(120, 92)">
            {/* Top Face */}
            <path d="M0 -46 L54 -20 L0 6 L-54 -20 Z" fill="#FDFBF7" stroke="#27272A" strokeWidth="2" strokeLinejoin="round" />
            {/* Left Face */}
            <path d="M-54 -20 L0 6 L0 52 L-54 26 Z" fill="#F4EFE6" stroke="#27272A" strokeWidth="2" strokeLinejoin="round" />
            {/* Right Face */}
            <path d="M0 6 L54 -20 L54 26 L0 52 Z" fill="#E8DFD3" stroke="#27272A" strokeWidth="2" strokeLinejoin="round" />

            {/* Packaging Tape */}
            <path d="M-7 -43 L7 -36 L7 9 L-7 3 Z" fill="#556947" opacity="0.85" />

            {/* Shipping Label on right face */}
            <polygon points="12,12 36,0 36,18 12,30" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.2" />
            <line x1="16" y1="16" x2="30" y2="9" stroke="#71717A" strokeWidth="1.2" />
            <line x1="16" y1="22" x2="26" y2="17" stroke="#71717A" strokeWidth="1.2" />
          </g>
        </svg>
      );
  }
}
