export default function SportLinkLogo({ size = 32 }) {
  return (
    <img
      src="/logo-sportlink.png"
      alt="SportLink"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  );
}
