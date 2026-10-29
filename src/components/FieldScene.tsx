/**
 * Illustration de rizière en SVG : soleil levant, collines en terrasses,
 * lignes de culture et épis de riz. Aucune image externe n'est nécessaire.
 */
export function FieldScene() {
  return (
    <svg
      className="field-scene"
      viewBox="0 0 900 1000"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="scene-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0cf86" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#f0cf86" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f0cf86" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="scene-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7dda0" />
          <stop offset="100%" stopColor="#e0b25a" />
        </linearGradient>
        <linearGradient id="scene-hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b6a46" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#16442c" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="scene-hill-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#235c3b" />
          <stop offset="100%" stopColor="#123a27" />
        </linearGradient>
        <linearGradient id="scene-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4c31" />
          <stop offset="100%" stopColor="#0b2a1c" />
        </linearGradient>
        <linearGradient id="scene-foreground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2517" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#071e13" />
        </linearGradient>

        <g id="scene-stalk">
          <path
            d="M0 0C-7-38 5-78 0-126"
            stroke="#cfa658"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M-1-44c-16-5-25-15-27-30 15 1 25 11 27 30Z" fill="#cfa658" />
          <path d="M1-66c15-5 24-15 26-30-15 1-24 11-26 30Z" fill="#cfa658" />
          <ellipse cx="-10" cy="-103" rx="4.4" ry="12" fill="#d9b264" transform="rotate(-26 -10 -103)" />
          <ellipse cx="9" cy="-96" rx="4.4" ry="12" fill="#d9b264" transform="rotate(24 9 -96)" />
          <ellipse cx="-8" cy="-84" rx="4.2" ry="11" fill="#d9b264" transform="rotate(-24 -8 -84)" />
          <ellipse cx="8" cy="-78" rx="4.2" ry="11" fill="#d9b264" transform="rotate(22 8 -78)" />
          <ellipse cx="0" cy="-113" rx="4.2" ry="11" fill="#e3bf70" transform="rotate(2 0 -113)" />
        </g>
      </defs>

      {/* Soleil et halo */}
      <circle cx="640" cy="292" r="250" fill="url(#scene-sun-glow)" />
      <circle cx="640" cy="292" r="104" fill="url(#scene-sun)" opacity="0.92" />
      <circle
        cx="640"
        cy="292"
        r="160"
        fill="none"
        stroke="#f0cf86"
        strokeOpacity="0.18"
        strokeDasharray="2 14"
        strokeLinecap="round"
      />

      {/* Collines lointaines */}
      <path
        d="M0 520c120-46 228-30 342-66 122-39 214 14 342-22 82-22 152-16 216-4v250H0Z"
        fill="url(#scene-hill-far)"
      />
      <path
        d="M0 612c138-56 250-18 386-52 144-36 232 26 348 4 58-11 112-14 166-4v230H0Z"
        fill="url(#scene-hill-mid)"
      />

      {/* Terrasses et lignes de culture */}
      <path
        d="M0 704c152-34 262 10 420-18 154-27 254 18 480-12v120c-226 32-326-14-480 14-158 27-268-16-420 18Z"
        fill="#1d5537"
        opacity="0.9"
      />
      <g fill="none" stroke="#8fbf94" strokeOpacity="0.18" strokeWidth="2">
        <path d="M0 726c152-32 262 10 420-16 154-26 254 18 480-10" />
        <path d="M0 752c152-30 262 12 420-14 154-25 254 18 480-8" />
        <path d="M0 780c152-28 262 12 420-12 154-24 254 18 480-6" />
      </g>

      <path
        d="M0 812c162-30 280 8 448-16 170-25 286 18 452-8v212H0Z"
        fill="url(#scene-field)"
      />
      <g fill="none" stroke="#6fa977" strokeOpacity="0.16" strokeWidth="2.5">
        <path d="M0 840c162-28 280 8 448-14 170-24 286 18 452-6" />
        <path d="M0 872c162-26 280 8 448-12 170-22 286 18 452-4" />
        <path d="M0 906c162-24 280 8 448-10 170-20 286 18 452-2" />
        <path d="M0 944c162-22 280 8 448-8 170-18 286 18 452 0" />
      </g>

      <path d="M0 940c180-26 330 18 520-4 140-16 250 10 380-2v66H0Z" fill="url(#scene-foreground)" />

      {/* Épis de riz */}
      <g opacity="0.55">
        <use href="#scene-stalk" transform="translate(652 1000) scale(1.45) rotate(-7)" />
        <use href="#scene-stalk" transform="translate(704 1010) scale(1.15) rotate(4)" />
        <use href="#scene-stalk" transform="translate(760 1000) scale(1.7) rotate(8)" />
        <use href="#scene-stalk" transform="translate(826 1012) scale(1.3) rotate(-5)" />
      </g>
      <g opacity="0.3">
        <use href="#scene-stalk" transform="translate(34 1010) scale(1.2) rotate(-8)" />
        <use href="#scene-stalk" transform="translate(88 1004) scale(1.55) rotate(5)" />
      </g>

      {/* Oiseaux et poussières de lumière */}
      <g
        stroke="#f6e9c9"
        strokeOpacity="0.35"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M462 214c7-7 14-7 21 0 7-7 14-7 21 0" />
        <path d="M528 178c5-5 10-5 15 0 5-5 10-5 15 0" />
      </g>
      <g fill="#f6e9c9" opacity="0.35">
        <circle cx="316" cy="366" r="2" />
        <circle cx="372" cy="326" r="1.5" />
        <circle cx="292" cy="300" r="1.4" />
        <circle cx="428" cy="392" r="1.8" />
      </g>
    </svg>
  )
}
