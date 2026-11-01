/**
 * Logo component — renders the bespoke professional vector SVG logo for each WildBook portal.
 * Prop  portal: 'user' | 'admin' | 'owner'
 * Prop  size:   'sm' | 'md' | 'lg' | number (default 'md')
 * Prop  light:  boolean — use light (cream/gold) version on dark bg (default false)
 * Prop  showText: boolean — show brand name alongside mark (default true)
 */
export default function Logo({ portal = 'user', size = 'md', light = false, showText = true }) {
  const sizes = { sm: 28, md: 38, lg: 52 };
  const h = typeof size === 'number' ? size : (sizes[size] ?? sizes.md);
  const textColor = light ? '#F6F1E7' : 'var(--color-forest, #1F3D2B)';
  const accentColor = '#D9A441';

  const configs = {
    user: {
      subtitle: null,
      mark: <UserMark h={h} light={light} />,
    },
    admin: {
      subtitle: 'Sanctuary Operator',
      mark: <AdminMark h={h} light={light} />,
    },
    owner: {
      subtitle: 'Authority Clearance',
      mark: <OwnerMark h={h} light={light} />,
    },
  };

  const cfg = configs[portal] ?? configs.user;

  const fontSizes = {
    sm: '1.05rem',
    md: '1.3rem',
    lg: '1.75rem',
  };
  const titleFontSize = typeof size === 'number' 
    ? (size < 32 ? '1rem' : size < 45 ? '1.3rem' : '1.75rem')
    : (fontSizes[size] ?? fontSizes.md);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '11px', userSelect: 'none' }} className="group">
      {cfg.mark}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          <span
            style={{
              fontSize: titleFontSize,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: textColor,
              lineHeight: 1.05,
            }}
          >
            Wild<span style={{ color: accentColor }}>Book</span>
          </span>
          {cfg.subtitle && (
            <span
              style={{
                fontSize: '0.62rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: accentColor,
                marginTop: '1px',
                opacity: light ? 0.95 : 0.85,
              }}
            >
              {cfg.subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Professional Vector SVG Marks ────────────────────────────────────────── */

/**
 * User / Explorer Mark
 * High-end wildlife chronicle emblem:
 * An open explorer's chronicle merging into wings of nature and a majestic stag leaf crest with rising golden sun.
 */
function UserMark({ h, light }) {
  const primary = light ? '#F6F1E7' : '#1F3D2B';
  const secondary = light ? '#E5DAC6' : '#2D573E';
  const gold = '#D9A441';
  const goldLight = '#F3C368';

  return (
    <svg
      width={h}
      height={h}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <linearGradient id="wb-user-gold" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
        <linearGradient id="wb-user-base" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>

      {/* Hexagonal Botanical Framing Ring */}
      <path
        d="M32 4L54 16.5V41.5L32 54L10 41.5V16.5L32 4Z"
        fill="url(#wb-user-gold)"
        fillOpacity={light ? "0.15" : "0.08"}
        stroke="url(#wb-user-gold)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Radiant Sun Horizon Arc */}
      <circle cx="32" cy="24" r="11" fill="url(#wb-user-gold)" fillOpacity="0.22" />
      <path d="M32 9V14" stroke={gold} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M22 13L25 17" stroke={gold} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M42 13L39 17" stroke={gold} strokeWidth="1.75" strokeLinecap="round" />

      {/* Open Book Wings / Botanical Leaves */}
      <path
        d="M32 45C32 45 22 41 14 43V25C22 23 30 27 32 30C34 27 42 23 50 25V43C42 41 32 45 32 45Z"
        fill={primary}
        fillOpacity={light ? "0.95" : "0.85"}
      />

      {/* Golden Book Spine & Sprout Leaf */}
      <path
        d="M32 21C32 21 29 26 29 32C29 39 32 46 32 46C32 46 35 39 35 32C35 26 32 21 32 21Z"
        fill="url(#wb-user-gold)"
      />
      <line x1="32" y1="21" x2="32" y2="46" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />

      {/* Leaf-rib pages */}
      <path d="M19 32C23 32 28 34 30 37" stroke={light ? '#1F3D2B' : '#F6F1E7'} strokeWidth="1.25" strokeLinecap="round" />
      <path d="M45 32C41 32 36 34 34 37" stroke={light ? '#1F3D2B' : '#F6F1E7'} strokeWidth="1.25" strokeLinecap="round" />

      {/* Apex Crown Star */}
      <polygon points="32,6 33.5,10.5 38,10.5 34.5,13 36,17.5 32,15 28,17.5 29.5,13 26,10.5 30.5,10.5" fill="url(#wb-user-gold)" />
    </svg>
  );
}

/**
 * Admin / Sanctuary Operator Mark
 * Architectural wildlife badge:
 * Crisp wildlife track, pine tree canopy crest, and sanctuary perimeter shield.
 */
function AdminMark({ h, light }) {
  const primary = light ? '#F6F1E7' : '#1F3D2B';
  const gold = '#D9A441';
  const goldLight = '#F3C368';

  return (
    <svg
      width={h}
      height={h}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <linearGradient id="wb-admin-gold" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
      </defs>

      {/* Outer Shield Shield with Corner Notches */}
      <path
        d="M32 4L54 11V30C54 44.5 44.5 54.5 32 59C19.5 54.5 10 44.5 10 30V11L32 4Z"
        fill={primary}
        fillOpacity={light ? "0.15" : "0.08"}
        stroke="url(#wb-admin-gold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Inner Sanctuary Mountain & Pine Trees */}
      <path
        d="M17 38L25 26L31 34L37 24L47 38H17Z"
        fill={primary}
        fillOpacity={light ? "0.3" : "0.2"}
      />

      {/* Iconic Tiger / Wildlife Paw Centerpiece */}
      {/* Main central pad */}
      <path
        d="M32 49C27.5 49 24 45.8 24 42.5C24 39.5 27 38 32 38C37 38 40 39.5 40 42.5C40 45.8 36.5 49 32 49Z"
        fill="url(#wb-admin-gold)"
      />
      {/* 4 Majestic Paw Toes */}
      <ellipse cx="23" cy="33.5" rx="3.2" ry="4.5" transform="rotate(-20 23 33.5)" fill={primary} />
      <ellipse cx="29" cy="29" rx="3.2" ry="4.8" transform="rotate(-6 29 29)" fill={primary} />
      <ellipse cx="35" cy="29" rx="3.2" ry="4.8" transform="rotate(6 35 29)" fill={primary} />
      <ellipse cx="41" cy="33.5" rx="3.2" ry="4.5" transform="rotate(20 41 33.5)" fill={primary} />

      {/* Central Gold Accent Inside Toes */}
      <circle cx="29" cy="29" r="1.3" fill="url(#wb-admin-gold)" />
      <circle cx="35" cy="29" r="1.3" fill="url(#wb-admin-gold)" />

      {/* Top Sanctuary Compass Star */}
      <path d="M32 10L33.8 15.2L39 17L33.8 18.8L32 24L30.2 18.8L25 17L30.2 15.2L32 10Z" fill="url(#wb-admin-gold)" />
    </svg>
  );
}

/**
 * Owner / Authority Mark
 * Royal State Wildlife Authority Insignia:
 * Regal heraldic shield crowned with stag antlers, dual judicial authority stars, and gold laurels.
 */
function OwnerMark({ h, light }) {
  const primary = light ? '#F6F1E7' : '#162B1D';
  const gold = '#C8922A';
  const goldLight = '#F5BE58';

  return (
    <svg
      width={h}
      height={h}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <linearGradient id="wb-owner-gold" x1="12" y1="4" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
      </defs>

      {/* Authority Heraldic Shield Frame */}
      <path
        d="M32 6L54 13V29C54 44 44.5 54 32 58C19.5 54 10 44 10 29V13L32 6Z"
        fill={primary}
        fillOpacity={light ? "0.2" : "0.12"}
        stroke="url(#wb-owner-gold)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Inner Concentric Shield Rim */}
      <path
        d="M32 11L49 16.5V28C49 40.5 41.5 49 32 52.5C22.5 49 15 40.5 15 28V16.5L32 11Z"
        stroke="url(#wb-owner-gold)"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.6"
      />

      {/* Crowned Royal Stag Antlers */}
      <path
        d="M19 23C19 17 23 15 26 18C28 20 29 23 32 23C35 23 36 20 38 18C41 15 45 17 45 23"
        stroke="url(#wb-owner-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Antler tines */}
      <path d="M22 17L21 13" stroke="url(#wb-owner-gold)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26 18L27 13" stroke="url(#wb-owner-gold)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M42 17L43 13" stroke="url(#wb-owner-gold)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M38 18L37 13" stroke="url(#wb-owner-gold)" strokeWidth="1.8" strokeLinecap="round" />

      {/* Majestic Stag Head Profile / Silhouette */}
      <path
        d="M32 22C28.5 22 26 25 26 29C26 33.5 29 38 32 41C35 38 38 33.5 38 29C38 25 35.5 22 32 22Z"
        fill={primary}
        stroke="url(#wb-owner-gold)"
        strokeWidth="1.5"
      />

      {/* Authority Coronet Crown at Top */}
      <path
        d="M27 10L29.5 13L32 9L34.5 13L37 10V14H27V10Z"
        fill="url(#wb-owner-gold)"
      />

      {/* Twin Stars of High Jurisdiction */}
      <polygon points="21,34 22,36 24,36 22.5,37.5 23,39.5 21,38 19,39.5 19.5,37.5 18,36 20,36" fill="url(#wb-owner-gold)" />
      <polygon points="43,34 44,36 46,36 44.5,37.5 45,39.5 43,38 41,39.5 41.5,37.5 40,36 42,36" fill="url(#wb-owner-gold)" />

      {/* Gold Base Seal / Laurel Knot */}
      <circle cx="32" cy="46" r="3" fill="url(#wb-owner-gold)" />
      <path d="M28 47C29.5 49 34.5 49 36 47" stroke="url(#wb-owner-gold)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
