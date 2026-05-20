import { useEffect } from 'react';

const DEFAULT_TITLE = 'SportLink — Sport en Finistère';
const DEFAULT_DESC  = 'Trouvez les événements sportifs près de chez vous en Finistère.';
const DEFAULT_IMAGE = '/og-default.png';

/**
 * Met à jour dynamiquement le <title> et les balises OpenGraph/Twitter du document.
 * Restaure les valeurs par défaut au démontage.
 */
export function useDynamicMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    const metas = {
      'og:title':        getMeta('og:title'),
      'og:description':  getMeta('og:description'),
      'og:image':        getMeta('og:image'),
      'og:url':          getMeta('og:url'),
      'og:type':         getMeta('og:type'),
      'twitter:title':   getMeta('twitter:title'),
      'twitter:description': getMeta('twitter:description'),
      'twitter:image':   getMeta('twitter:image'),
      'twitter:card':    getMeta('twitter:card'),
      description:       getMetaName('description'),
    };

    // Apply new values
    const pageTitle = title ? `${title} · SportLink` : DEFAULT_TITLE;
    document.title = pageTitle;

    setMeta('og:title',       pageTitle);
    setMeta('og:description', description || DEFAULT_DESC);
    setMeta('og:image',       image        || DEFAULT_IMAGE);
    setMeta('og:url',         url          || window.location.href);
    setMeta('og:type',        'website');
    setMeta('twitter:card',   'summary_large_image');
    setMeta('twitter:title',  pageTitle);
    setMeta('twitter:description', description || DEFAULT_DESC);
    setMeta('twitter:image',  image || DEFAULT_IMAGE);
    setMetaName('description', description || DEFAULT_DESC);

    return () => {
      document.title = prevTitle;
      Object.entries(metas).forEach(([key, prev]) => {
        if (key === 'description') setMetaName(key, prev);
        else setMeta(key, prev);
      });
    };
  }, [title, description, image, url]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMeta(property) {
  return document.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ?? '';
}

function getMetaName(name) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
}

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
