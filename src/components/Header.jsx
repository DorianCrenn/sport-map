import SportLinkLogo from './SportLinkLogo.jsx';

export default function Header() {
  return (
    <header className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 text-white"
      style={{ background: 'linear-gradient(90deg, #0F1E3A 0%, #1a3460 100%)', boxShadow: '0 2px 12px rgba(15,30,58,0.3)' }}>
      <SportLinkLogo size={28} onDark />
      <div>
        <div className="text-base font-bold tracking-tight leading-none font-poppins">SportLink</div>
        <div className="text-[10px] font-medium mt-0.5" style={{ color: '#22C55E' }}>Le sport près de toi</div>
      </div>
    </header>
  );
}
