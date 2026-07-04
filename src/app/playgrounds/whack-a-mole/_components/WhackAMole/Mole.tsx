// A cartoon mole drawn as an SVG so it stays crisp at any hole size. When
// `hit` it screws its eyes shut and sticks its tongue out, sold with a little
// starburst behind the head.
export function Mole({ hit }: { hit: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full drag-none"
      aria-hidden="true"
    >
      {hit && (
        <g stroke="#000" strokeWidth="3" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="42"
              x2="50"
              y2="20"
              stroke="#f7c948"
              transform={`rotate(${deg} 50 42)`}
            />
          ))}
        </g>
      )}

      {/* ears */}
      <circle cx="24" cy="40" r="9" fill="#7a4a28" stroke="#000" strokeWidth="4" />
      <circle cx="76" cy="40" r="9" fill="#7a4a28" stroke="#000" strokeWidth="4" />

      {/* body */}
      <ellipse cx="50" cy="60" rx="33" ry="35" fill="#a56b43" stroke="#000" strokeWidth="4" />

      {/* muzzle */}
      <ellipse cx="50" cy="70" rx="21" ry="17" fill="#e8c9a0" stroke="#000" strokeWidth="3" />

      {/* eyes */}
      {hit ? (
        <g stroke="#000" strokeWidth="4" strokeLinecap="round">
          <line x1="33" y1="47" x2="43" y2="55" />
          <line x1="43" y1="47" x2="33" y2="55" />
          <line x1="57" y1="47" x2="67" y2="55" />
          <line x1="67" y1="47" x2="57" y2="55" />
        </g>
      ) : (
        <g>
          <circle cx="38" cy="50" r="5.5" fill="#000" />
          <circle cx="62" cy="50" r="5.5" fill="#000" />
          <circle cx="40" cy="48" r="1.6" fill="#fffef5" />
          <circle cx="64" cy="48" r="1.6" fill="#fffef5" />
        </g>
      )}

      {/* nose */}
      <circle cx="50" cy="64" r="5.5" fill="#ef3d2f" stroke="#000" strokeWidth="2" />

      {/* tongue when bonked */}
      {hit && (
        <path
          d="M46 74 q4 10 8 0 z"
          fill="#ef3d2f"
          stroke="#000"
          strokeWidth="2"
        />
      )}

      {/* whiskers */}
      <g stroke="#000" strokeWidth="2" strokeLinecap="round">
        <line x1="30" y1="68" x2="16" y2="65" />
        <line x1="30" y1="72" x2="16" y2="73" />
        <line x1="70" y1="68" x2="84" y2="65" />
        <line x1="70" y1="72" x2="84" y2="73" />
      </g>
    </svg>
  );
}
