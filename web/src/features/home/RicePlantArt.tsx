/**
 * Hand-drawn rice plant (inline SVG, no image download). Decorative only.
 */
export function RicePlantArt({ className = '' }: { className?: string }) {
  const grains = (x: number, y: number, dir: 1 | -1) =>
    Array.from({ length: 6 }, (_, i) => (
      <ellipse
        key={i}
        cx={x + dir * (i * 5 + 4)}
        cy={y + i * 9}
        rx="3.2"
        ry="6"
        transform={`rotate(${dir * 35} ${x + dir * (i * 5 + 4)} ${y + i * 9})`}
        fill="#FACC15"
        stroke="#A16207"
        strokeWidth="0.8"
      />
    ))

  return (
    <svg viewBox="0 0 220 260" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rp-leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86EFAC" />
          <stop offset="1" stopColor="#15803D" />
        </linearGradient>
        <radialGradient id="rp-glow" cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="140" r="110" fill="url(#rp-glow)" />
      {/* soil / paddy water */}
      <ellipse cx="110" cy="244" rx="80" ry="10" fill="#0B3B24" opacity="0.55" />
      {/* leaves */}
      <path d="M110 245 C 92 190, 60 150, 28 120 C 70 140, 98 180, 112 240 Z" fill="url(#rp-leaf)" />
      <path d="M112 245 C 130 185, 165 140, 196 110 C 160 140, 128 182, 116 242 Z" fill="url(#rp-leaf)" />
      <path d="M108 245 C 100 200, 84 170, 54 160 C 88 168, 104 196, 114 244 Z" fill="#22C55E" opacity="0.9" />
      <path d="M114 245 C 124 205, 140 178, 172 168 C 138 178, 122 204, 118 244 Z" fill="#22C55E" opacity="0.9" />
      {/* stems */}
      <path d="M110 245 C 108 180, 100 120, 82 60" stroke="#4D7C0F" strokeWidth="3" fill="none" />
      <path d="M112 245 C 114 175, 124 115, 146 52" stroke="#4D7C0F" strokeWidth="3" fill="none" />
      <path d="M111 245 C 111 190, 112 130, 112 70" stroke="#4D7C0F" strokeWidth="3" fill="none" />
      {/* drooping panicles */}
      {grains(82, 60, -1)}
      {grains(146, 52, 1)}
      {grains(112, 70, 1)}
    </svg>
  )
}
