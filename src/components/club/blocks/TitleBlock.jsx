import { useState } from 'react';

const SIZE = { h1: 'text-2xl md:text-3xl', h2: 'text-xl md:text-2xl', h3: 'text-lg md:text-xl' };

export default function TitleBlock({ data, isEditing, onUpdate }) {
  const [focused, setFocused] = useState(false);
  const level = data.level || 'h2';

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex gap-1">
          {['h1', 'h2', 'h3'].map(l => (
            <button
              key={l}
              onClick={() => onUpdate({ level: l })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                level === l ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          value={data.text || ''}
          onChange={e => onUpdate({ text: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Titre de la section…"
          className={`w-full bg-transparent border-b-2 outline-none font-oswald font-bold tracking-wide text-gray-900 py-1 transition-colors ${
            SIZE[level]
          } ${focused ? 'border-slate-800' : 'border-gray-200'}`}
        />
      </div>
    );
  }

  const Tag = level;
  return (
    <Tag className={`font-oswald font-bold tracking-wide text-gray-900 ${SIZE[level]}`}>
      {data.text || 'Titre'}
    </Tag>
  );
}
