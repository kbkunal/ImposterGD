import React from 'react';

export interface AvatarProps {
  avatarId?: string;
  avatarBackground?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
  isSpeaking?: boolean;
  onClick?: () => void;
}

export const AVATAR_OPTIONS = [
  { id: 'detective', name: 'Detective', description: 'Keen eye for deception' },
  { id: 'astronaut', name: 'Astronaut', description: 'Venturing into the unknown' },
  { id: 'ninja', name: 'Ninja', description: 'Silent and observant' },
  { id: 'robot', name: 'Robot', description: 'Calculating every clue' },
  { id: 'fox', name: 'Sly Fox', description: 'Clever and quick-witted' },
  { id: 'alien', name: 'Alien', description: 'Blends in from outer space' },
  { id: 'cat', name: 'Mystery Cat', description: 'Curious and suspicious' },
  { id: 'wizard', name: 'Wizard', description: 'Weaving magical bluffs' },
  { id: 'pirate', name: 'Pirate', description: 'Loves high-stakes treasure' },
  { id: 'vampire', name: 'Vampire', description: 'Lurks in the shadows' },
  { id: 'bear', name: 'Cool Bear', description: 'Chill but alert' },
  { id: 'clown', name: 'Jester', description: 'Playful mind games' },
];

export const BACKGROUND_COLORS = [
  '#8B5CF6', // Neon Violet
  '#0EA5E9', // Electric Sky
  '#F43F5E', // Rose Coral
  '#F59E0B', // Amber Gold
  '#10B981', // Emerald Mint
  '#6366F1', // Royal Indigo
  '#EC4899', // Hot Pink
  '#14B8A6', // Cyan Teal
  '#3B82F6', // Cobalt Blue
  '#D946EF', // Fuchsia
];

export const Avatar: React.FC<AvatarProps> = ({
  avatarId = 'detective',
  avatarBackground = '#8B5CF6',
  avatarUrl,
  size = 'md',
  className = '',
  showBorder = true,
  borderColor,
  isSpeaking = false,
  onClick,
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-28 h-28 text-2xl',
    '2xl': 'w-36 h-36 text-3xl',
  }[size];

  // If user uploaded an image URL, render the image with fallback
  if (avatarUrl) {
    return (
      <div
        onClick={onClick}
        className={`relative rounded-full overflow-hidden flex items-center justify-center transition-transform ${sizeClasses} ${className} ${
          isSpeaking ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#080B14] scale-105 animate-pulse' : ''
        }`}
        style={{
          backgroundColor: avatarBackground,
          border: showBorder ? `2px solid ${borderColor || 'rgba(255,255,255,0.2)'}` : 'none',
        }}
      >
        <img
          src={avatarUrl}
          alt="Player avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback to SVG if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Render Illustrated SVG
  return (
    <div
      onClick={onClick}
      className={`relative rounded-full overflow-hidden flex items-center justify-center transition-all ${sizeClasses} ${className} ${
        isSpeaking ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#080B14] scale-105 animate-pulse' : ''
      }`}
      style={{
        backgroundColor: avatarBackground,
        border: showBorder ? `2px solid ${borderColor || 'rgba(255,255,255,0.2)'}` : 'none',
        boxShadow: isSpeaking ? '0 0 20px rgba(245, 158, 11, 0.6)' : '0 4px 14px rgba(0,0,0,0.3)',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[82%] h-[82%] drop-shadow-md select-none"
      >
        {renderAvatarSvg(avatarId)}
      </svg>
    </div>
  );
};

function renderAvatarSvg(id: string) {
  switch (id) {
    case 'detective':
      return (
        <g>
          {/* Trench collar */}
          <path d="M25 88 L38 65 L62 65 L75 88 Z" fill="#2E384D" />
          <path d="M42 65 L50 78 L58 65 Z" fill="#E2E8F0" />
          <polygon points="48,72 52,72 51,82 49,82" fill="#E11D48" />
          {/* Head */}
          <circle cx="50" cy="46" r="22" fill="#FCD34D" />
          {/* Fedora hat */}
          <ellipse cx="50" cy="30" rx="36" ry="7" fill="#1E293B" />
          <path d="M30 30 C30 14 38 10 50 10 C62 10 70 14 70 30 Z" fill="#334155" />
          <rect x="30" y="26" width="40" height="4" fill="#F43F5E" />
          {/* Shadow over eyes */}
          <path d="M28 32 C38 38 62 38 72 32 C70 42 60 48 50 48 C40 48 30 42 28 32 Z" fill="#0F172A" opacity="0.4" />
          {/* Eyes / Monocle */}
          <circle cx="40" cy="45" r="3.5" fill="#0F172A" />
          <circle cx="60" cy="45" r="7" stroke="#FBBF24" strokeWidth="2.5" fill="rgba(56,189,248,0.3)" />
          <circle cx="60" cy="45" r="3.5" fill="#0F172A" />
          <line x1="66" y1="48" x2="72" y2="60" stroke="#FBBF24" strokeWidth="2" />
          {/* Smirk */}
          <path d="M44 58 C47 61 54 61 57 58" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'astronaut':
      return (
        <g>
          {/* Suit body */}
          <path d="M20 90 C22 68 78 68 80 90 Z" fill="#E2E8F0" />
          <rect x="42" y="72" width="16" height="14" rx="3" fill="#3B82F6" />
          {/* Helmet base */}
          <circle cx="50" cy="45" r="28" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="3" />
          {/* Visor */}
          <ellipse cx="50" cy="45" rx="20" ry="16" fill="#0F172A" />
          {/* Gold Visor Gradient Reflection */}
          <path d="M34 40 C36 34 44 32 58 32 C50 34 38 38 34 40 Z" fill="#38BDF8" opacity="0.8" />
          <circle cx="62" cy="40" r="2" fill="#F59E0B" />
          {/* Cute antenna */}
          <line x1="50" y1="17" x2="50" y2="8" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="7" r="4" fill="#F43F5E" />
        </g>
      );

    case 'ninja':
      return (
        <g>
          {/* Dark robes */}
          <path d="M22 88 L50 64 L78 88 Z" fill="#090D16" />
          {/* Hood */}
          <circle cx="50" cy="45" r="27" fill="#111827" />
          {/* Mask slit */}
          <rect x="30" y="38" width="40" height="15" rx="5" fill="#FED7AA" />
          {/* Headband */}
          <rect x="23" y="27" width="54" height="9" rx="2" fill="#DC2626" />
          <circle cx="50" cy="31.5" r="3" fill="#FBBF24" />
          {/* Intense ninja eyes */}
          <polygon points="36,44 45,46 38,48" fill="#0F172A" />
          <polygon points="64,44 55,46 62,48" fill="#0F172A" />
        </g>
      );

    case 'robot':
      return (
        <g>
          {/* Neck & Shoulders */}
          <rect x="44" y="66" width="12" height="10" fill="#64748B" />
          <path d="M24 90 C26 76 74 76 76 90 Z" fill="#475569" />
          {/* Head block */}
          <rect x="28" y="24" width="44" height="42" rx="8" fill="#94A3B8" stroke="#334155" strokeWidth="3" />
          {/* Screen face */}
          <rect x="34" y="32" width="32" height="24" rx="4" fill="#0F172A" />
          {/* Digital LED Eyes */}
          <rect x="38" y="38" width="7" height="7" rx="1.5" fill="#38BDF8" />
          <rect x="55" y="38" width="7" height="7" rx="1.5" fill="#38BDF8" />
          {/* LED smile */}
          <path d="M42 49 H58" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
          {/* Bolts on ears */}
          <rect x="22" y="38" width="6" height="12" rx="2" fill="#F59E0B" />
          <rect x="72" y="38" width="6" height="12" rx="2" fill="#F59E0B" />
          {/* Antenna */}
          <line x1="50" y1="24" x2="50" y2="12" stroke="#64748B" strokeWidth="3" />
          <circle cx="50" cy="10" r="4.5" fill="#38BDF8" />
        </g>
      );

    case 'fox':
      return (
        <g>
          {/* Ears */}
          <polygon points="26,16 42,34 22,38" fill="#EA580C" />
          <polygon points="28,20 38,32 26,35" fill="#FED7AA" />
          <polygon points="74,16 58,34 78,38" fill="#EA580C" />
          <polygon points="72,20 62,32 74,35" fill="#FED7AA" />
          {/* Head */}
          <circle cx="50" cy="48" r="25" fill="#F97316" />
          {/* White cheeks */}
          <path d="M28 50 C26 64 45 74 50 74 C55 74 74 64 72 50 C65 52 58 48 50 56 C42 48 35 52 28 50 Z" fill="#FFF7ED" />
          {/* Eyes */}
          <ellipse cx="40" cy="46" rx="3" ry="4.5" fill="#1C1917" />
          <ellipse cx="60" cy="46" rx="3" ry="4.5" fill="#1C1917" />
          <circle cx="41" cy="44" r="1.2" fill="#FFFFFF" />
          <circle cx="61" cy="44" r="1.2" fill="#FFFFFF" />
          {/* Nose */}
          <polygon points="47,62 53,62 50,66" fill="#1C1917" />
        </g>
      );

    case 'alien':
      return (
        <g>
          {/* Slender neck and shoulders */}
          <path d="M28 90 C32 76 68 76 72 90 Z" fill="#6EE7B7" />
          {/* Alien Head (tear-drop inverted) */}
          <path d="M26 38 C24 18 76 18 74 38 C72 58 58 72 50 72 C42 72 28 58 26 38 Z" fill="#10B981" />
          {/* Big cosmic eyes */}
          <ellipse cx="38" cy="38" rx="8" ry="12" transform="rotate(-15 38 38)" fill="#0F172A" />
          <ellipse cx="62" cy="38" rx="8" ry="12" transform="rotate(15 62 38)" fill="#0F172A" />
          <ellipse cx="50" cy="26" rx="4" ry="5" fill="#0F172A" />
          {/* Eye shines */}
          <circle cx="36" cy="34" r="2.5" fill="#38BDF8" />
          <circle cx="64" cy="34" r="2.5" fill="#38BDF8" />
          <circle cx="50" cy="24" r="1.5" fill="#38BDF8" />
          {/* Small smile */}
          <path d="M46 58 C48 60 52 60 54 58" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'cat':
      return (
        <g>
          {/* Cat Ears */}
          <polygon points="26,18 42,32 20,38" fill="#374151" />
          <polygon points="28,22 38,31 24,35" fill="#F472B6" />
          <polygon points="74,18 58,32 80,38" fill="#374151" />
          <polygon points="72,22 62,31 76,35" fill="#F472B6" />
          {/* Head */}
          <circle cx="50" cy="48" r="26" fill="#4B5563" />
          {/* Cat Eyes */}
          <ellipse cx="38" cy="44" rx="5" ry="6" fill="#FDE047" />
          <ellipse cx="62" cy="44" rx="5" ry="6" fill="#FDE047" />
          <ellipse cx="38" cy="44" rx="1.5" ry="5" fill="#111827" />
          <ellipse cx="62" cy="44" rx="1.5" ry="5" fill="#111827" />
          {/* Cute pink nose & mouth */}
          <polygon points="48,53 52,53 50,56" fill="#F472B6" />
          <path d="M45 58 C47 60 50 60 50 56 C50 60 53 60 55 58" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
          {/* Whiskers */}
          <line x1="28" y1="52" x2="16" y2="50" stroke="#E5E7EB" strokeWidth="1.5" />
          <line x1="28" y1="56" x2="16" y2="58" stroke="#E5E7EB" strokeWidth="1.5" />
          <line x1="72" y1="52" x2="84" y2="50" stroke="#E5E7EB" strokeWidth="1.5" />
          <line x1="72" y1="56" x2="84" y2="58" stroke="#E5E7EB" strokeWidth="1.5" />
        </g>
      );

    case 'wizard':
      return (
        <g>
          {/* Head & Beard */}
          <circle cx="50" cy="44" r="20" fill="#FED7AA" />
          <path d="M30 46 C30 76 50 82 50 82 C50 82 70 76 70 46 C60 54 40 54 30 46 Z" fill="#F1F5F9" />
          {/* Wizard Hat */}
          <ellipse cx="50" cy="30" rx="34" ry="7" fill="#4338CA" />
          <path d="M30 28 L48 4 L70 28 Z" fill="#4F46E5" />
          {/* Star on hat */}
          <polygon points="50,14 51.5,18 56,18.5 52.5,21.5 54,26 50,23 46,26 47.5,21.5 44,18.5 48.5,18" fill="#FBBF24" />
          {/* Eyes */}
          <circle cx="42" cy="42" r="2.5" fill="#1E1B4B" />
          <circle cx="58" cy="42" r="2.5" fill="#1E1B4B" />
          {/* Eyebrows */}
          <path d="M38 38 L46 39" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 38 L54 39" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );

    case 'pirate':
      return (
        <g>
          {/* Bandana */}
          <circle cx="50" cy="46" r="22" fill="#FED7AA" />
          <path d="M28 38 C32 22 68 22 72 38 Z" fill="#DC2626" />
          <circle cx="72" cy="42" r="5" fill="#DC2626" />
          {/* Eyepatch */}
          <line x1="28" y1="36" x2="68" y2="48" stroke="#1E293B" strokeWidth="2.5" />
          <circle cx="42" cy="44" r="6" fill="#0F172A" />
          {/* Left good eye */}
          <circle cx="58" cy="45" r="3" fill="#0F172A" />
          {/* Gold earring */}
          <circle cx="74" cy="52" r="4.5" stroke="#FBBF24" strokeWidth="2.5" fill="none" />
          {/* Stubble / beard */}
          <path d="M36 56 C44 64 56 64 64 56" stroke="#78350F" strokeWidth="3" strokeDasharray="2 3" />
        </g>
      );

    case 'vampire':
      return (
        <g>
          {/* High vampire cape collar */}
          <polygon points="20,86 16,36 34,60 50,68 66,60 84,36 80,86" fill="#881337" stroke="#4C0519" strokeWidth="2" />
          {/* Pale face */}
          <circle cx="50" cy="44" r="21" fill="#E2E8F0" />
          {/* Widow peak hairline */}
          <path d="M29 36 C38 24 45 28 50 36 C55 28 62 24 71 36 Z" fill="#090D16" />
          {/* Piercing crimson eyes */}
          <circle cx="42" cy="44" r="3" fill="#DC2626" />
          <circle cx="58" cy="44" r="3" fill="#DC2626" />
          {/* Fangs smile */}
          <path d="M42 54 C46 58 54 58 58 54" stroke="#0F172A" strokeWidth="1.5" />
          <polygon points="44,54 46,58 48,54" fill="#FFFFFF" />
          <polygon points="52,54 54,58 56,54" fill="#FFFFFF" />
        </g>
      );

    case 'bear':
      return (
        <g>
          {/* Round bear ears */}
          <circle cx="28" cy="26" r="11" fill="#78350F" />
          <circle cx="28" cy="26" r="6" fill="#FDE68A" />
          <circle cx="72" cy="26" r="11" fill="#78350F" />
          <circle cx="72" cy="26" r="6" fill="#FDE68A" />
          {/* Bear head */}
          <circle cx="50" cy="48" r="26" fill="#92400E" />
          {/* Cool sunglasses */}
          <rect x="30" y="38" width="18" height="12" rx="3" fill="#0F172A" />
          <rect x="52" y="38" width="18" height="12" rx="3" fill="#0F172A" />
          <line x1="48" y1="42" x2="52" y2="42" stroke="#0F172A" strokeWidth="3" />
          <line x1="33" y1="41" x2="43" y2="47" stroke="#38BDF8" strokeWidth="1.5" opacity="0.6" />
          <line x1="55" y1="41" x2="65" y2="47" stroke="#38BDF8" strokeWidth="1.5" opacity="0.6" />
          {/* Muzzle */}
          <ellipse cx="50" cy="58" rx="11" ry="8" fill="#FDE68A" />
          <ellipse cx="50" cy="55" rx="4.5" ry="3" fill="#1C1917" />
          <path d="M50 58 V62" stroke="#1C1917" strokeWidth="1.5" />
        </g>
      );

    case 'clown':
    default:
      return (
        <g>
          {/* Colorful curly hair */}
          <circle cx="26" cy="38" r="10" fill="#3B82F6" />
          <circle cx="26" cy="50" r="9" fill="#06B6D4" />
          <circle cx="74" cy="38" r="10" fill="#EC4899" />
          <circle cx="74" cy="50" r="9" fill="#F43F5E" />
          {/* Face */}
          <circle cx="50" cy="46" r="22" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          {/* Happy eyes with face paint */}
          <polygon points="40,32 43,38 37,38" fill="#3B82F6" />
          <polygon points="40,50 43,44 37,44" fill="#3B82F6" />
          <polygon points="60,32 63,38 57,38" fill="#EC4899" />
          <polygon points="60,50 63,44 57,44" fill="#EC4899" />
          {/* Big red clown nose */}
          <circle cx="50" cy="46" r="7" fill="#EF4444" />
          <circle cx="48" cy="44" r="2" fill="#FCA5A5" />
          {/* Big happy smile */}
          <path d="M38 56 C44 66 56 66 62 56" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
  }
}
