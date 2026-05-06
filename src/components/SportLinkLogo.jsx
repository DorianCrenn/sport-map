// variant="icon"  → icône seule (logo-sportlink.png) — pour fonds sombres
// variant="full"  → logo complet avec texte (transparent) — pour fonds clairs
export default function SportLinkLogo({ size = 32, variant = 'icon' }) {
  const src = variant === 'full'
    ? '/Logo-sportlink-sans-fond.png'
    : '/logo-sportlink.png';

  return (
    <img
      src={src}
      alt="SportLink"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  );
}
