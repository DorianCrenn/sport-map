import iconA  from '../assets/logos/SportLink Icon A.svg';
import horizA from '../assets/logos/SportLink Horizontal A.svg';

interface SportLinkLogoProps { size?: number; variant?: 'icon' | 'horizontal' | 'full'; onDark?: boolean; }

export default function SportLinkLogo({ size = 32, variant = 'icon' }: SportLinkLogoProps) {
  const useHorizontal = variant === 'horizontal' || variant === 'full';
  const src       = useHorizontal ? horizA : iconA;
  const sizeStyle = useHorizontal ? { height: size, width: 'auto' } : { width: size, height: size };
  return <img src={src as string} alt="SportLink" style={{ objectFit: 'contain', display: 'block', flexShrink: 0, ...sizeStyle }} />;
}
