/**
 * Logo component — renders the correct WildBook logo for each portal.
 * Prop  portal: 'user' | 'admin' | 'owner'
 * Prop  size:   'sm' | 'md' | 'lg'  (default 'md')
 * Prop  light:  boolean — use light (cream) version on dark bg (default false)
 *
 * Each portal has its own SVG so they can diverge visually later.
 * Currently they share a common base mark but differ in subtitle and gold accent usage.
 */
export default function Logo({ portal = 'user', size = 'md', light = false }) {
  const sizes = { sm: 28, md: 38, lg: 52 };
  const h = sizes[size] ?? sizes.md;
  const textColor  = light ? '#F6F1E7' : 'var(--color-forest, #1F3D2B)';
  const accentColor = '#D9A441'; // Amber — shared across all portals

  const configs = {
    user: {
      subtitle: null,
      mark: <UserMark h={h} accent={accentColor} light={light} />,
    },
    admin: {
      subtitle: 'Admin Portal',
      mark: <AdminMark h={h} accent={accentColor} light={light} />,
    },
    owner: {
      subtitle: 'Authority Portal',
      mark: <OwnerMark h={h} accent={accentColor} light={light} />,
    },
  };

  const cfg = configs[portal] ?? configs.user;

  const textBase = {
    fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.6rem' : '1.25rem',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 600,
    color: textColor,
    lineHeight: 1,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {cfg.mark}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={textBase}>WildBook</span>
        {cfg.subtitle && (
          <span style={{
            fontSize: '0.65rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: accentColor,
          }}>
            {cfg.subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Mark sub-components ──────────────────────────────────────────────────── */

function UserMark({ h, accent, light }) {
  const fill = light ? '#F6F1E7' : '#1F3D2B';
  return (
    <svg width={h} height={h} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Leaf / book shape */}
      <path d="M24 4C24 4 8 14 8 28C8 36.8 15.2 44 24 44C32.8 44 40 36.8 40 28C40 14 24 4 24 4Z" fill={fill} opacity="0.12"/>
      <path d="M24 6C24 6 10 15.5 10 28C10 36.4 16.3 43 24 43C31.7 43 38 36.4 38 28C38 15.5 24 6 24 6Z" stroke={fill} strokeWidth="2" fill="none"/>
      {/* Spine */}
      <line x1="24" y1="6" x2="24" y2="43" stroke={accent} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Vein lines */}
      <path d="M24 16 L16 22" stroke={fill} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M24 22 L32 28" stroke={fill} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M24 28 L16 34" stroke={fill} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      {/* Dot */}
      <circle cx="24" cy="7" r="2.5" fill={accent}/>
    </svg>
  );
}

function AdminMark({ h, accent, light }) {
  const fill = light ? '#F6F1E7' : '#1F3D2B';
  return (
    <svg width={h} height={h} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Paw print */}
      <circle cx="24" cy="30" r="12" fill={fill} opacity="0.10"/>
      <ellipse cx="24" cy="30" rx="10" ry="9" stroke={fill} strokeWidth="2" fill="none"/>
      {/* Toes */}
      <circle cx="17" cy="20" r="3.5" fill={fill}/>
      <circle cx="31" cy="20" r="3.5" fill={fill}/>
      <circle cx="13" cy="27" r="3" fill={fill}/>
      <circle cx="35" cy="27" r="3" fill={fill}/>
      {/* Centre pad */}
      <ellipse cx="24" cy="30" rx="5" ry="4" fill={accent} opacity="0.85"/>
      {/* Small inner toes */}
      <circle cx="20" cy="26" r="2" fill={fill} opacity="0.8"/>
      <circle cx="28" cy="26" r="2" fill={fill} opacity="0.8"/>
      <circle cx="24" cy="25" r="2" fill={fill} opacity="0.8"/>
    </svg>
  );
}

function OwnerMark({ h, accent, light }) {
  const fill = light ? '#F6F1E7' : '#1F3D2B';
  return (
    <svg width={h} height={h} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield */}
      <path d="M24 4L6 12V26C6 35.4 14 43.2 24 46C34 43.2 42 35.4 42 26V12L24 4Z"
            fill={fill} opacity="0.12" stroke={fill} strokeWidth="2"/>
      {/* Crown / antler inside */}
      <path d="M15 22V16L19 20L24 14L29 20L33 16V22" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Deer head */}
      <ellipse cx="24" cy="27" rx="6" ry="7" fill={fill} opacity="0.85"/>
      {/* Ears */}
      <ellipse cx="18.5" cy="22" rx="2.5" ry="3.5" fill={fill} opacity="0.7"/>
      <ellipse cx="29.5" cy="22" rx="2.5" ry="3.5" fill={fill} opacity="0.7"/>
      {/* Eyes */}
      <circle cx="21.5" cy="26" r="1" fill={accent}/>
      <circle cx="26.5" cy="26" r="1" fill={accent}/>
    </svg>
  );
}
