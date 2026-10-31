// JSON-LD de la portada: LodgingBusiness + WebSite + FAQPage. Solo datos verificados (rancho.ts / sitio.ts):
// sin precios, sin valoraciones, sin coordenadas ni dirección exacta (no las tenemos).
import { contacto } from './rancho';
import { galeria, rutas, sitio, type Lang } from './sitio';

export function structuredData(lang: Lang, site: URL | undefined) {
  const t = sitio[lang];
  const abs = (path: string) => (site ? new URL(path, site).href : undefined);
  const home = abs(rutas[lang]);
  const id = (frag: string) => (site ? `${abs(rutas.es)}#${frag}` : undefined);
  const amenidades = sitio[lang].servicios.items.map((item) => ({
    '@type': 'LocationFeatureSpecification',
    name: item.titulo,
    value: true,
  }));

  const negocio = {
    '@type': 'LodgingBusiness',
    '@id': id('rancho'),
    name: 'Rancho Varadero',
    description: t.seo.description,
    url: home,
    telephone: contacto.telefonos[0],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Playa El Amatal',
      addressRegion: 'La Libertad',
      addressCountry: 'SV',
    },
    maximumAttendeeCapacity: 12,
    amenityFeature: amenidades,
    image: site ? galeria.map((foto) => abs(foto.src)) : undefined,
    brand: { '@type': 'Organization', name: 'Alquileres MM', alternateName: 'Ranchos MM' },
    contactPoint: contacto.telefonos.map((telephone) => ({
      '@type': 'ContactPoint',
      telephone,
      contactType: 'reservations',
      availableLanguage: ['es', 'en'],
    })),
    sameAs: contacto.whatsapp ? [contacto.whatsapp] : undefined,
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': home ? `${home}#preguntas` : undefined,
    inLanguage: t.htmlLang,
    mainEntity: t.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const web = {
    '@type': 'WebSite',
    '@id': id('web'),
    url: abs(rutas.es),
    name: 'Rancho Varadero',
    inLanguage: ['es-SV', 'en'],
  };

  return { '@context': 'https://schema.org', '@graph': [negocio, web, faq] };
}
