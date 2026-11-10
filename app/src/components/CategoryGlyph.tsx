import type { Category } from '../domain/schema';

/** One line-art glyph per category, all on the same 32px grid and stroke weight. */
export function CategoryGlyph({ category, size = 28 }: { category: Category; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  switch (category) {
    case 'tops':
      return (
        <svg {...common}>
          <path d="M11 4 16 6l5-2 5 3 2 7-5 2v12H9V16l-5-2 2-7Z" />
        </svg>
      );
    case 'bottoms':
      return (
        <svg {...common}>
          <path d="M9 4h14l2 24h-6l-3-14-3 14H7Z" />
          <path d="M9 9h14" />
        </svg>
      );
    case 'outerwear':
      return (
        <svg {...common}>
          <path d="M11 4 16 7l5-3 5 4-2 20H8L6 8Z" />
          <path d="M16 7v21" />
        </svg>
      );
    case 'dresses':
      return (
        <svg {...common}>
          <path d="M12 3h8l2 7 4 18H6L10 10Z" />
          <path d="M12 3c1 2 2 3 4 3s3-1 4-3" />
        </svg>
      );
    case 'shoes':
      return (
        <svg {...common}>
          <path d="M4 25V14c2-2 5-1 7 1l4 4 8 2c3 0 5 1 5 4H4Z" />
          <path d="M11 19l2-2M15 21l2-2" />
        </svg>
      );
    case 'accessories':
      return (
        <svg {...common}>
          <path d="M8 11h16v17H8Z" />
          <path d="M12 11V9a4 4 0 0 1 8 0v2" />
        </svg>
      );
    default:
      return null;
  }
}
