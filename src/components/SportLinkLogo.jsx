import iconA  from '../assets/logos/SportLink Icon A.svg';
import horizA from '../assets/logos/SportLink Horizontal A.svg';

export default function SportLinkLogo({ size = 32, onDark = false, variant = 'icon' }) {
  const useHorizontal = variant === 'horizontal' || variant === 'full';
  const src = useHorizontal ? horizA : iconA;
  const sizeStyle = useHorizontal
    ? { height: size, width: 'auto' }
    : { width: size, height: size };

  return (
    <img
      src={src}
      alt="SportLink"
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0, ...sizeStyle }}
    />
  );
}
