import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function EditField({ label, value, onChange, multiline, placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      )}
    </div>
  );
}

function PriceRow({ price, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={price.label}
        onChange={(e) => onChange({ ...price, label: e.target.value })}
        placeholder="Licence adulte"
        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
      />
      <input
        type="text"
        value={price.amount}
        onChange={(e) => onChange({ ...price, amount: e.target.value })}
        placeholder="120 €"
        className="w-24 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
      />
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function ContactRow({ contact, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <select
        value={contact.type}
        onChange={(e) => onChange({ ...contact, type: e.target.value })}
        className="text-sm border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
      >
        <option value="email">Email</option>
        <option value="phone">Téléphone</option>
        <option value="website">Site web</option>
        <option value="facebook">Facebook</option>
        <option value="instagram">Instagram</option>
      </select>
      <input
        type="text"
        value={contact.value}
        onChange={(e) => onChange({ ...contact, value: e.target.value })}
        placeholder={contact.type === 'email' ? 'club@exemple.fr' : contact.type === 'phone' ? '02 98 00 00 00' : 'https://...'}
        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
      />
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

export function AboutBlockEditor({ block, onChange }) {
  const data = block.data || {};

  function set(key, val) {
    onChange({ ...block, data: { ...data, [key]: val } });
  }

  function addPrice() {
    const prices = [...(data.prices || []), { id: Date.now(), label: '', amount: '' }];
    set('prices', prices);
  }

  function updatePrice(id, updated) {
    set('prices', (data.prices || []).map((p) => (p.id === id ? updated : p)));
  }

  function deletePrice(id) {
    set('prices', (data.prices || []).filter((p) => p.id !== id));
  }

  function addContact() {
    const contacts = [...(data.contacts || []), { id: Date.now(), type: 'email', value: '' }];
    set('contacts', contacts);
  }

  function updateContact(id, updated) {
    set('contacts', (data.contacts || []).map((c) => (c.id === id ? updated : c)));
  }

  function deleteContact(id) {
    set('contacts', (data.contacts || []).filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <EditField label="Description" value={data.description || ''} onChange={(v) => set('description', v)} multiline placeholder="Présentez votre club en quelques mots…" />
      <EditField label="Année de fondation" value={data.founded || ''} onChange={(v) => set('founded', v)} placeholder="1982" />
      <EditField label="Adresse" value={data.address || ''} onChange={(v) => set('address', v)} placeholder="Salle Marcel Brusq, 3 rue du Sport, Brest" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Tarifs des licences</span>
          <button onClick={addPrice} className="text-xs font-semibold text-green-600 hover:text-green-700 cursor-pointer">+ Ajouter</button>
        </div>
        {(data.prices || []).map((p) => (
          <PriceRow key={p.id} price={p} onChange={(u) => updatePrice(p.id, u)} onDelete={() => deletePrice(p.id)} />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Contacts</span>
          <button onClick={addContact} className="text-xs font-semibold text-green-600 hover:text-green-700 cursor-pointer">+ Ajouter</button>
        </div>
        {(data.contacts || []).map((c) => (
          <ContactRow key={c.id} contact={c} onChange={(u) => updateContact(c.id, u)} onDelete={() => deleteContact(c.id)} />
        ))}
      </div>
    </div>
  );
}

const CONTACT_ICONS = {
  email: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>,
  website: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  facebook: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  instagram: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
};

export function AboutBlockView({ block }) {
  const data = block.data || {};
  const [expanded, setExpanded] = useState(false);

  const hasContent = data.description || data.founded || data.address || (data.prices || []).length > 0 || (data.contacts || []).length > 0;
  if (!hasContent) return (
    <div className="py-4 text-center text-sm text-gray-400">
      Bloc "À propos" vide — éditez la page pour ajouter des informations.
    </div>
  );

  return (
    <div className="space-y-4">
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

      {(data.prices || []).length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tarifs</div>
          <div className="space-y-1.5">
            {data.prices.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-700">{p.label}</span>
                <span className="text-sm font-bold text-gray-800">{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data.contacts || []).length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contacts</div>
          <div className="space-y-2">
            {data.contacts.map((c) => {
              const isLink = c.type === 'website' || c.type === 'facebook' || c.type === 'instagram';
              const href = c.type === 'email' ? `mailto:${c.value}` : c.type === 'phone' ? `tel:${c.value}` : c.value;
              return (
                <a
                  key={c.id}
                  href={href}
                  target={isLink ? '_blank' : undefined}
                  rel={isLink ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-green-600 transition-colors"
                >
                  <span className="text-gray-400">{CONTACT_ICONS[c.type] || CONTACT_ICONS.website}</span>
                  <span className="truncate">{c.value}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
