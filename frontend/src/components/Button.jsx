/**
 * Button — themed button component.
 * Props:
 *  - variant:  'primary' | 'secondary' | 'danger' | 'ghost'
 *  - size:     'sm' | 'md' | 'lg'
 *  - loading:  boolean — shows a spinner and disables
 *  - icon:     ReactNode — prepended icon
 *  - ...rest forwarded to <button>
 */
export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none';

  const variants = {
    primary:   'bg-[var(--btn-primary-bg,#D9A441)] text-[var(--btn-primary-text,#1F3D2B)] hover:bg-[var(--btn-primary-hover,#b8872e)] focus-visible:ring-amber-400 active:scale-95',
    secondary: 'bg-transparent text-[var(--color-forest,#1F3D2B)] border border-[var(--color-forest,#1F3D2B)] hover:bg-[var(--color-forest,#1F3D2B)] hover:text-white focus-visible:ring-[var(--color-forest)] active:scale-95',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:scale-95',
    ghost:     'bg-transparent text-[var(--color-forest,#1F3D2B)] hover:bg-[var(--color-sage,#A9BFA0)]/20 focus-visible:ring-[var(--color-sage)] active:scale-95',
    approve:   'bg-[var(--btn-approve-bg,#3a7d44)] text-white hover:opacity-90 active:scale-95',
    reject:    'bg-[var(--btn-reject-bg,#c0392b)] text-white hover:opacity-90 active:scale-95',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        base,
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : (
        icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
