import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.6" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.7v1.8" />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10.6 6a10.7 10.7 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-2.6 3.3" />
      <path d="M6.3 7.3A16.6 16.6 0 0 0 2.5 12s3.5 6.1 9.5 6.1a9.7 9.7 0 0 0 4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3.5 3.5 17 17" />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  )
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 8v5" />
      <path d="M12 16.2h.01" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  )
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.2 12.4 2.5 2.5 5.2-5.4" />
    </svg>
  )
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3.2 19 6v5.4c0 4.2-2.9 7.4-7 8.9-4.1-1.5-7-4.7-7-8.9V6Z" />
      <path d="m9.2 11.9 2 2 3.6-3.8" />
    </svg>
  )
}

export function SproutIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.9-2.6-6.5-6.4-6.7C5.4 10 8 12.8 12 13Z" />
      <path d="M12 15.5c0-3.3 2.2-5.6 5.5-5.7-.3 3.4-2.4 5.6-5.5 5.7Z" />
    </svg>
  )
}

export function CloudSunIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M15.5 5.4a5 5 0 0 0-6.3 4.2" />
      <path d="M8.7 3.5v1.6M4.4 5.6l1.1 1.1M3 9.6h1.6" />
      <path d="M8 18.5a3.7 3.7 0 0 1-.5-7.4 5.2 5.2 0 0 1 9.9 1.1 3.1 3.1 0 0 1-.6 6.3Z" />
    </svg>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-4" />
      <path d="M12.5 16V8.5" />
      <path d="M17 16V6" />
    </svg>
  )
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3.5 13.4 8l4.5 1.4-4.5 1.4L12 15.3l-1.4-4.5L6.1 9.4 10.6 8Z" />
      <path d="M18.5 15.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14.5 8V6.2A2.2 2.2 0 0 0 12.3 4H6.2A2.2 2.2 0 0 0 4 6.2v11.6A2.2 2.2 0 0 0 6.2 20h6.1a2.2 2.2 0 0 0 2.2-2.2V16" />
      <path d="M10 12h10" />
      <path d="m16.8 8.5 3.5 3.5-3.5 3.5" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5" />
      <path d="M12 7.9h.01" />
    </svg>
  )
}
