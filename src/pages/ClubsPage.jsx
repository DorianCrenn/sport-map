import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPORTS } from '../data/events.js';
import SportIcon from '../components/SportIcon.jsx';
import ClubPageView from '../components/club/ClubPageView.jsx';

const CLUBS = [
  { id: 1,  name: 'US Brest Football',       sport: 'Football',   city: 'Brest',      members: 320, level: 'Division Honneur',      contact: 'usbrest29@gmail.com' },
  { id: 2,  name: 'Quimper Cornouaille FC',  sport: 'Football',   city: 'Quimper',    members: 280, level: 'Division Honneur',      contact: 'qcfc29@gmail.com' },
  { id: 3,  name: 'Morlaix FC',              sport: 'Football',   city: 'Morlaix',    members: 210, level: 'Division Honneur',      contact: 'morlaixfc@gmail.com' },
  { id: 4,  name: 'ASC Carhaix',             sport: 'Football',   city: 'Carhaix',    members: 180, level: 'Promotion de Ligue',    contact: 'asccarhaix@gmail.com' },
  { id: 5,  name: 'AS Plabennec',            sport: 'Football',   city: 'Plabennec',  members: 195, level: 'Division Honneur',      contact: 'asplabennec@gmail.com' },
  { id: 6,  name: 'HBC Brest',              sport: 'Handball',   city: 'Brest',      members: 150, level: 'N3 Régional',           contact: 'hbcbrest@gmail.com' },
  { id: 7,  name: 'HBC Concarneau',         sport: 'Handball',   city: 'Concarneau', members: 120, level: 'N3 Régional',           contact: 'hbcconcarneau@gmail.com' },
  { id: 8,  name: 'Morlaix Handball',       sport: 'Handball',   city: 'Morlaix',    members: 95,  level: 'N3 Régional',           contact: 'morlaixhb@gmail.com' },
  { id: 9,  name: 'Landerneau Bretagne BB', sport: 'Basketball', city: 'Landerneau', members: 200, level: 'Pro B',                 contact: 'lbb29@gmail.com' },
  { id: 10, name: 'Quimper Basket',         sport: 'Basketball', city: 'Quimper',    members: 175, level: 'Pro B',                 contact: 'quimperbasket@gmail.com' },
  { id: 11, name: 'Concarneau Basket',      sport: 'Basketball', city: 'Concarneau', members: 130, level: 'Régional',              contact: 'concbask@gmail.com' },
  { id: 12, name: 'Rugby Club Brestois',    sport: 'Rugby',      city: 'Brest',      members: 160, level: 'Fédérale 3',            contact: 'rcb29@gmail.com' },
  { id: 13, name: 'RC Quimper',             sport: 'Rugby',      city: 'Quimper',    members: 140, level: 'Fédérale 3',            contact: 'rcquimper@gmail.com' },
  { id: 14, name: 'Brest Atlético Club',    sport: 'Running',    city: 'Brest',      members: 420, level: 'Loisir / Compétition',  contact: 'bac29@gmail.com' },
  { id: 15, name: 'Quimper Athlétisme',     sport: 'Running',    city: 'Quimper',    members: 310, level: 'Loisir / Compétition',  contact: 'qa29@gmail.com' },
  { id: 16, name: 'Trail Côtier Finistère', sport: 'Trail',      city: 'Brest',      members: 180, level: 'Tout public',           contact: 'tcf29@gmail.com' },
  { id: 17, name: 'Vélo Club Brestois',     sport: 'Cyclisme',   city: 'Brest',      members: 260, level: 'Loisir / Compétition',  contact: 'vcb29@gmail.com' },
  { id: 18, name: 'Cyclisme Cornouaille',   sport: 'Cyclisme',   city: 'Quimper',    members: 195, level: 'Loisir / Compétition',  contact: 'cyclcorn@gmail.com' },
];

export default function ClubsPage({ allEvents }) {
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);

  const filtered = CLUBS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchSport = !sportFilter || c.sport === sportFilter;
    return matchSearch && matchSport;
  });

  return (
    <div className="h-full flex flex-col bg-[#F1F5F9] relative overflow-hidden">
      <AnimatePresence>
        {selectedClub && (
          <ClubPageView
            key={selectedClub.id}
            club={selectedClub}
            allEvents={allEvents ?? []}
            onBack={() => setSelectedClub(null)}
          />
        )}
      </AnimatePresence>
      {/* Search + Filters */}
      <div className="bg-white px-4 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-xl font-bold font-poppins mb-3" style={{ color: '#0F1E3A' }}>Clubs</h1>
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un club ou une ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSportFilter(null)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer transition-colors"
            style={sportFilter === null
              ? { backgroundColor: '#0F1E3A', color: 'white' }
              : { backgroundColor: '#f1f5f9', color: '#64748b' }}
          >
            Tous
          </button>
          {Object.values(SPORTS).map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSportFilter(sportFilter === sport.id ? null : sport.id)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
              style={sportFilter === sport.id
                ? { backgroundColor: sport.color, color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }}
            >
              <SportIcon sport={sport.id} size={13} color={sportFilter === sport.id ? 'white' : sport.color} />
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      {/* Club list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-gray-400 mb-3 font-medium">{filtered.length} club{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}</p>
        {filtered.map((club, i) => {
          const sport = SPORTS[club.sport];
          return (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
              className="bg-white rounded-2xl mb-2.5 shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Infos club */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm font-oswald tracking-wide select-none"
                  style={{ backgroundColor: sport?.color ?? '#64748b' }}>
                  {club.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase().slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{club.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{club.city}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{club.members} membres</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
                      style={{ backgroundColor: sport?.color }}>
                      {club.sport}
                    </span>
                    <span className="text-[10px] text-gray-400">{club.level}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-100">
                <a
                  href={`mailto:${club.contact}`}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Contacter
                </a>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => setSelectedClub(club)}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold transition-colors font-poppins"
                  style={{ color: sport?.color ?? '#0F1E3A' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Voir la page
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
