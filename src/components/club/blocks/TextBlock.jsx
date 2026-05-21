import { useState, useRef, useEffect } from 'react';

export default function TextBlock({ data, isEditing, onUpdate }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [data.content, focused]);

  if (isEditing) {
    return (
      <textarea
        ref={ref}
        value={data.content || ''}
        onChange={e => onUpdate({ content: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Rédigez votre texte ici…"
        rows={3}
        className={`w-full bg-transparent border rounded-xl p-3 text-sm text-gray-700 leading-relaxed resize-none outline-none transition-colors overflow-hidden ${
          focused ? 'border-slate-800 bg-gray-50' : 'border-gray-200'
        }`}
      />
    );
  }

  return (
    <p
      className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
      style={data.color ? { color: data.color } : undefined}
    >
      {data.content || <span className="text-gray-300 italic">Aucun contenu</span>}
    </p>
  );
}
