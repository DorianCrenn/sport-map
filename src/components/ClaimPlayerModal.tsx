import { useState } from 'react';
import { useClubPlayers } from '../hooks/useClubPlayers.js';

const RELATIONS = ['Père', 'Mère', 'Tuteur légal', 'Autre'];

interface Player { id: string | number; name: string; number?: number | null; }
interface ClaimPlayerModalProps { player: Player; clubId: string; currentUser: { id: string }; onClose: () => void; }

export default function ClaimPlayerModal({ player, clubId, currentUser, onClose }: ClaimPlayerModalProps) {
  const { submitClaim } = useClubPlayers(clubId);
  const [step,        setStep]        = useState<'choice' | 'player' | 'guardian'>('choice');
  const [birthYear,   setBirthYear]   = useState('');
  const [relation,    setRelation]    = useState('Père');
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');
  const currentYear = new Date().getFullYear();

  async function handleSubmit(type: 'player' | 'guardian') {
    setError('');
    const by = birthYear ? parseInt(birthYear) : null;
    if (type === 'player' && by && currentYear - by < 18) { setError("Tu dois avoir 18 ans ou plus pour te rattacher directement. Si tu es mineur, demande à un parent de cliquer \"C'est mon enfant\"."); return; }
    if (type === 'guardian' && !relation) { setError('Précise ta relation avec le joueur.'); return; }
    setSubmitting(true);
    const ok = await (submitClaim as (d: any) => Promise<boolean>)({ playerId: player.id, type, relation: type === 'guardian' ? relation : null, birthYear: by, userId: currentUser.id });
    setSubmitting(false);
    if (!ok) { setError('Une erreur est survenue. Réessaie.'); return; }
    setDone(true);
  }

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-3">✅</div>
        <p className="font-bold text-lg font-poppins" style={{ color: '#0F1E3A' }}>Demande envoyée !</p>
        <p className="text-sm text-gray-500 mt-1.5">Le manager du club va valider ta demande. Tu seras notifié(e) dès que c'est fait.</p>
        <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl font-bold text-white text-sm" style={{ backgroundColor: '#0F1E3A' }}>Fermer</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="font-bold text-base font-poppins" style={{ color: '#0F1E3A' }}>Rattacher la fiche</p>
          <p className="text-sm text-gray-500 mt-0.5"><span className="font-semibold text-gray-700">#{player.number ?? '—'} {player.name}</span></p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {step === 'choice' && (
            <>
              <p className="text-sm text-gray-600">Tu es :</p>
              <div className="space-y-2.5">
                <button onClick={() => setStep('player')} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-400 transition-colors text-left">
                  <span className="text-2xl">🏃</span><div><p className="font-semibold text-sm" style={{ color: '#0F1E3A' }}>Ce joueur, c'est moi</p><p className="text-xs text-gray-400">Je suis majeur(e) et j'ai un compte SportLink</p></div>
                </button>
                <button onClick={() => setStep('guardian')} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-400 transition-colors text-left">
                  <span className="text-2xl">👨‍👧</span><div><p className="font-semibold text-sm" style={{ color: '#0F1E3A' }}>C'est mon enfant</p><p className="text-xs text-gray-400">Je suis parent ou tuteur légal</p></div>
                </button>
              </div>
            </>
          )}
          {step === 'player' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Année de naissance (optionnel)</label>
                <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder={`ex. ${currentYear - 25}`} min={1940} max={currentYear} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
                <p className="text-[11px] text-gray-400 mt-1">Renseigne ton année si tu es mineur(e) — ta demande sera refusée et tu devras demander à un parent.</p>
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep('choice'); setError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500">Retour</button>
                <button onClick={() => handleSubmit('player')} disabled={submitting} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#0F1E3A' }}>{submitting ? 'Envoi…' : 'Envoyer la demande'}</button>
              </div>
            </>
          )}
          {step === 'guardian' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tu es son / sa</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {RELATIONS.map(r => <button key={r} onClick={() => setRelation(r)} className="py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors" style={relation === r ? { borderColor: '#7c3aed', color: '#7c3aed', backgroundColor: '#f5f3ff' } : { borderColor: '#e5e7eb', color: '#6b7280' }}>{r}</button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Année de naissance de l'enfant (optionnel)</label>
                <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder={`ex. ${currentYear - 12}`} min={1940} max={currentYear} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400" />
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep('choice'); setError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500">Retour</button>
                <button onClick={() => handleSubmit('guardian')} disabled={submitting} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#7c3aed' }}>{submitting ? 'Envoi…' : 'Envoyer la demande'}</button>
              </div>
            </>
          )}
        </div>
        <div className="px-6 pb-6">
          <p className="text-[10px] text-gray-400 text-center">En soumettant cette demande, tu confirmes avoir 15 ans ou plus (ou agir en tant que parent/tuteur). Données traitées conformément au RGPD.</p>
        </div>
      </div>
    </div>
  );
}
