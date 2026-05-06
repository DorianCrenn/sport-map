export default function SportLinkLogo({ size = 32 }) {
  const h = Math.round(size * 1.22);
  return (
    <svg width={size} height={h} viewBox="0 0 40 49" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pin outer shape */}
      <path
        d="M20 1C9.51 1 1 9.51 1 20c0 6.28 2.92 11.87 7.5 15.56L20 48l11.5-12.44A18.93 18.93 0 0 0 39 20C39 9.51 30.49 1 20 1z"
        fill="#0F1E3A"
      />
      {/* Green circle accent */}
      <circle cx="20" cy="20" r="11" fill="#22C55E" opacity="0.18" />
      {/* S letter */}
      <path
        d="M25 13.5h-7a3.5 3.5 0 1 0 0 7h4a3.5 3.5 0 1 1 0 7h-8"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Green dot accent at pin tip */}
      <circle cx="20" cy="44" r="2" fill="#22C55E" opacity="0.7" />
    </svg>
  );
}
