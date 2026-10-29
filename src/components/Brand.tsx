import { useId } from 'react'

/**
 * Marque RizConnect : un épi de riz stylisé dans un carré arrondi.
 */
export function Brand() {
  const gradientId = useId()

  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f7a4d" />
            <stop offset="100%" stopColor="#1a4d32" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="42" height="42" rx="13" fill={`url(#${gradientId})`} />
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="13"
          fill="none"
          stroke="rgba(246, 233, 201, 0.3)"
        />
        <path d="M22 33.5V18" stroke="#f6e9c9" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M22 23.5c-1.1-4.5-4.4-7.1-9.2-7.3.5 4.7 4 7.5 9.2 7.3Z"
          fill="#f6e9c9"
        />
        <path d="M22 28.3c1.1-3.8 4-6 8.2-6.2-.4 4-3.5 6.3-8.2 6.2Z" fill="#e0b25a" />
        <circle cx="22" cy="14.2" r="2.1" fill="#e0b25a" />
      </svg>
      <span className="brand__name">
        Riz<strong>Connect</strong>
      </span>
    </span>
  )
}
