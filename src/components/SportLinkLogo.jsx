export default function SportLinkLogo({ size = 32, onDark = false }) {
  return (
    <img
      src="/Logo-sportlink-sans-fond.png"
      alt="SportLink"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        filter: onDark
          ? 'brightness(1.25) drop-shadow(0 0 10px rgba(34,197,94,0.55)) drop-shadow(0 0 3px rgba(255,255,255,0.2))'
          : undefined,
      }}
    />
  );
}
