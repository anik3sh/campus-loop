interface LogoProps {
  className?: string;
  size?: 'sm' | 'compact' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
}

export function LogoIcon({ className = "h-7 w-auto", color = "#5f7754" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 120 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Infinity Loop */}
      <path
        d="M 60 38 C 72 20, 102 18, 102 38 C 102 58, 72 56, 60 38 C 48 20, 18 18, 18 38 C 18 58, 48 56, 60 38 Z"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Organic Leaf at top-right */}
      <path
        d="M 97 19 C 97 10, 105 6, 110 5 C 109 12, 103 20, 97 19 Z"
        fill={color}
      />
    </svg>
  );
}

export default function Logo({
  className = "",
  size = 'compact',
  showText = true,
  showTagline = false,
  variant = 'dark',
  layout = 'horizontal',
}: LogoProps) {
  const sizeMap = {
    sm: { icon: 'h-6 w-auto', text: 'text-lg', tagline: 'text-[9px] tracking-wider' },
    compact: { icon: 'h-7 w-auto', text: 'text-xl', tagline: 'text-[8.5px] tracking-[0.16em]' },
    md: { icon: 'h-8.5 w-auto', text: 'text-2xl', tagline: 'text-[10px] tracking-widest' },
    lg: { icon: 'h-12 w-auto', text: 'text-3xl', tagline: 'text-xs tracking-widest' },
    xl: { icon: 'h-16 w-auto', text: 'text-4xl', tagline: 'text-sm tracking-widest' },
  };

  const currentSize = sizeMap[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1c2e1b]';
  const accentColor = variant === 'light' ? 'text-[#a3b899]' : 'text-[#5f7754]';
  const taglineColor = variant === 'light' ? 'text-[#a3b899]/90' : 'text-[#5f7754]';
  const iconColor = variant === 'light' ? '#8fae82' : '#5f7754';

  if (!showText) {
    return <LogoIcon className={`${currentSize.icon} ${className}`} color={iconColor} />;
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        <LogoIcon className={`${currentSize.icon} transition-transform group-hover:scale-105 duration-200`} color={iconColor} />
        <div className="flex flex-col items-center">
          <span className={`font-display font-extrabold leading-tight ${textColor} ${currentSize.text} tracking-[-0.035em]`}>
            Campus<span className={accentColor}>Loop</span>
          </span>
          {showTagline && (
            <span className={`font-display font-semibold uppercase ${taglineColor} ${currentSize.tagline} mt-1`}>
              Buy · Sell · Connect
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon className={`${currentSize.icon} flex-shrink-0 transition-transform group-hover:scale-105 duration-200`} color={iconColor} />
      <div className="flex flex-col justify-center">
        <span className={`font-display font-extrabold leading-none ${textColor} ${currentSize.text} tracking-[-0.035em]`}>
          Campus<span className={accentColor}>Loop</span>
        </span>
        {showTagline && (
          <span className={`font-display font-semibold uppercase ${taglineColor} ${currentSize.tagline} mt-0.5`}>
            Buy · Sell · Connect
          </span>
        )}
      </div>
    </div>
  );
}
