import { useState } from 'react';

// ── Social/contact metadata ───────────────────────────────────────────────────

const CONTACT_TYPES = [
  { value: 'email',     label: 'Email' },
  { value: 'phone',     label: 'Téléphone' },
  { value: 'website',   label: 'Site web' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'twitter',   label: 'X / Twitter' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'whatsapp',  label: 'WhatsApp' },
];

const CONTACT_META = {
  email:     { color: '#fff', bg: '#6b7280' },
  phone:     { color: '#fff', bg: '#6b7280' },
  website:   { color: '#fff', bg: '#6b7280' },
  instagram: { color: '#fff', bg: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' },
  facebook:  { color: '#fff', bg: '#1877F2' },
  twitter:   { color: '#fff', bg: '#000000' },
  youtube:   { color: '#fff', bg: '#FF0000' },
  tiktok:    { color: '#fff', bg: '#010101' },
  linkedin:  { color: '#fff', bg: '#0A66C2' },
  whatsapp:  { color: '#fff', bg: '#25D366' },
};

const SOCIAL_TYPES = new Set(['instagram','facebook','twitter','youtube','tiktok','linkedin','whatsapp']);

function getHref(type, value) {
  if (!value) return '#';
  if (type === 'email') return `mailto:${value}`;
  if (type === 'phone') return `tel:${value}`;
  if (value.startsWith('http')) return value;
  const bases = {
    facebook:  'https://facebook.com/',
    instagram: 'https://instagram.com/',
    twitter:   'https://x.com/',
    youtube:   'https://youtube.com/@',
    tiktok:    'https://tiktok.com/@',
    linkedin:  'https://linkedin.com/in/',
    whatsapp:  'https://wa.me/',
  };
  return (bases[type] || '') + value;
}

function ContactIcon({ type, size = 16 }) {
  const s = size;
  switch (type) {
    case 'email':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
    case 'phone':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>;
    case 'website':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case 'facebook':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
    case 'instagram':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
    case 'twitter':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
    case 'youtube':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000" style={{fill:'white'}}/></svg>;
    case 'tiktok':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.84 4.84 0 0 1-1.01-.07z"/></svg>;
    case 'linkedin':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
    case 'whatsapp':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
  }
}

// ── Editor helpers ────────────────────────────────────────────────────────────

function EditField({ label, value, onChange, multiline, placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
      )}
    </div>
  );
}

function PriceRow({ price, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <input type="text" value={price.label} onChange={e => onChange({ ...price, label: e.target.value })} placeholder="Licence adulte"
        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
      <input type="text" value={price.amount} onChange={e => onChange({ ...price, amount: e.target.value })} placeholder="120 €"
        className="w-24 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function ContactRow({ contact, onChange, onDelete }) {
  const placeholders = {
    email: 'club@exemple.fr', phone: '02 98 00 00 00', website: 'https://monclub.fr',
    instagram: '@monclub', facebook: 'monclub', twitter: '@monclub',
    youtube: '@MonClub', tiktok: '@monclub', linkedin: 'mon-club', whatsapp: '+33600000000',
  };
  return (
    <div className="flex items-center gap-2 mb-2">
      <select value={contact.type} onChange={e => onChange({ ...contact, type: e.target.value })}
        className="text-sm border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white flex-shrink-0">
        {CONTACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <input type="text" value={contact.value} onChange={e => onChange({ ...contact, value: e.target.value })}
        placeholder={placeholders[contact.type] || ''}
        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 min-w-0" />
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────

export function AboutBlockEditor({ block, onChange }) {
  const data = block.data || {};
  function set(key, val) { onChange({ ...block, data: { ...data, [key]: val } }); }
  function addPrice() { set('prices', [...(data.prices || []), { id: Date.now(), label: '', amount: '' }]); }
  function updatePrice(id, u) { set('prices', (data.prices || []).map(p => p.id === id ? u : p)); }
  function deletePrice(id) { set('prices', (data.prices || []).filter(p => p.id !== id)); }
  function addContact() { set('contacts', [...(data.contacts || []), { id: Date.now(), type: 'email', value: '' }]); }
  function updateContact(id, u) { set('contacts', (data.contacts || []).map(c => c.id === id ? u : c)); }
  function deleteContact(id) { set('contacts', (data.contacts || []).filter(c => c.id !== id)); }

  return (
    <div className="space-y-4">
      <EditField label="Description" value={data.description || ''} onChange={v => set('description', v)} multiline placeholder="Présentez votre club…" />
      <EditField label="Année de fondation" value={data.founded || ''} onChange={v => set('founded', v)} placeholder="1982" />
      <EditField label="Adresse" value={data.address || ''} onChange={v => set('address', v)} placeholder="Stade Marcel Brusq, 3 rue du Sport, Brest" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Tarifs des licences</span>
          <button onClick={addPrice} className="text-xs font-semibold text-green-600 hover:text-green-700 cursor-pointer">+ Ajouter</button>
        </div>
        {(data.prices || []).map(p => (
          <PriceRow key={p.id} price={p} onChange={u => updatePrice(p.id, u)} onDelete={() => deletePrice(p.id)} />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Contacts & réseaux</span>
          <button onClick={addContact} className="text-xs font-semibold text-green-600 hover:text-green-700 cursor-pointer">+ Ajouter</button>
        </div>
        {(data.contacts || []).map(c => (
          <ContactRow key={c.id} contact={c} onChange={u => updateContact(c.id, u)} onDelete={() => deleteContact(c.id)} />
        ))}
      </div>
    </div>
  );
}

// ── View ──────────────────────────────────────────────────────────────────────

export function AboutBlockView({ block }) {
  const data = block.data || {};
  const [expanded, setExpanded] = useState(false);

  const hasContent = data.description || data.founded || data.address
    || (data.prices || []).length > 0 || (data.contacts || []).length > 0;
  if (!hasContent) return (
    <div className="py-4 text-center text-sm text-gray-400">
      Bloc "À propos" vide — éditez la page pour ajouter des informations.
    </div>
  );

  const socialContacts  = (data.contacts || []).filter(c => SOCIAL_TYPES.has(c.type) && c.value);
  const classicContacts = (data.contacts || []).filter(c => !SOCIAL_TYPES.has(c.type) && c.value);

  return (
    <div className="space-y-4">
      {/* Description */}
      {data.description && (
        <div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {expanded || data.description.length <= 200 ? data.description : data.description.slice(0, 200) + '…'}
          </p>
          {data.description.length > 200 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs font-semibold text-green-600 mt-1 cursor-pointer">
              {expanded ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>
      )}

      {/* Founded + address */}
      <div className="grid grid-cols-2 gap-3">
        {data.founded && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Fondé en</div>
            <div className="text-sm font-bold text-gray-800">{data.founded}</div>
          </div>
        )}
        {data.address && (
          <div className="bg-gray-50 rounded-xl p-3 col-span-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Adresse</div>
            <div className="text-sm text-gray-700">{data.address}</div>
          </div>
        )}
      </div>

      {/* Prices */}
      {(data.prices || []).length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tarifs</div>
          <div className="space-y-1.5">
            {data.prices.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-700">{p.label}</span>
                <span className="text-sm font-bold text-gray-800">{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {(socialContacts.length > 0 || classicContacts.length > 0) && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacts</div>

          {/* Social icons row */}
          {socialContacts.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mb-3">
              {socialContacts.map(c => {
                const meta = CONTACT_META[c.type] || CONTACT_META.website;
                return (
                  <a
                    key={c.id}
                    href={getHref(c.type, c.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={CONTACT_TYPES.find(t => t.value === c.type)?.label || c.type}
                    style={{
                      width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: meta.bg, color: meta.color, textDecoration: 'none', flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    <ContactIcon type={c.type} size={20} />
                  </a>
                );
              })}
            </div>
          )}

          {/* Email / phone / website pills */}
          {classicContacts.length > 0 && (
            <div className="flex flex-col gap-2">
              {classicContacts.map(c => {
                const href = getHref(c.type, c.value);
                const isExternal = c.type === 'website';
                const label = c.type === 'email' ? c.value
                  : c.type === 'phone' ? c.value
                  : c.value.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                return (
                  <a
                    key={c.id}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-green-600 transition-colors"
                  >
                    <span className="text-gray-400 flex-shrink-0"><ContactIcon type={c.type} size={15} /></span>
                    <span className="truncate">{label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
