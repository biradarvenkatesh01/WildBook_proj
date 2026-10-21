/**
 * Card — a styled container with the portal's card-radius and card-shadow.
 * Props:
 *  - className: extra classes
 *  - padding:   tailwind padding class (default 'p-6')
 *  - hover:     boolean — adds hover lift effect
 */
export default function Card({ children, className = '', padding = 'p-6', hover = false, style }) {
  return (
    <div
      className={[
        'card',
        padding,
        hover ? 'transition-transform duration-200 hover:-translate-y-1 cursor-pointer' : '',
        className,
      ].join(' ')}
      style={style}
    >
      {children}
    </div>
  );
}
