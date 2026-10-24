// Copy de la versión dinámica (scroll world). Todos los datos salen de rancho.ts: no agregar precios, reseñas,
// distancias, premios ni cifras que no estén allí. rancho.ts lo usa también la versión "antes", así que no se toca.
import { contacto, textos, type Lang } from './rancho';

import poster1 from '../assets/paseo/paseo-1.webp';
import poster2 from '../assets/paseo/paseo-2.webp';
import poster3 from '../assets/paseo/paseo-3.webp';
import poster4 from '../assets/paseo/paseo-4.webp';
import poster5 from '../assets/paseo/paseo-5.webp';
import poster6 from '../assets/paseo/paseo-6.webp';
import poster7 from '../assets/paseo/paseo-7.webp';

export type { Lang };

export const rutas = { es: '/', en: '/en/' } as const;

const tel = (numero: string) => `tel:${numero.replace(/[^\d+]/g, '')}`;

// WhatsApp con un mensaje inicial en el idioma de la página.
const mensaje = {
  es: 'Hola, quiero cotizar Rancho Varadero. Fechas: ',
  en: 'Hi, I would like a quote for Rancho Varadero. Dates: ',
};
export const whatsapp = (lang: Lang) => `${contacto.whatsapp}?text=${encodeURIComponent(mensaje[lang])}`;

export const telefonos = contacto.telefonos.map((numero) => ({ numero, href: tel(numero) }));

// Las 7 paradas del paseo, en orden. El póster de cada parada es un fotograma real del vídeo (regla de costura):
// paseo-k.webp = primer fotograma del clip k = parada k-1; paseo-7.webp = último fotograma del clip 6 = parada 6.
// `focus` es la posición horizontal (0–100 %) del recorte cuando la pantalla es más estrecha que el 16:9 (móvil),
// elegida mirando cada fotograma para que el sujeto quede a la vista.
export const paradas = [
  { id: 'inicio', poster: poster1, clip: '/video/paseo-1.mp4', focus: 50 }, // piscina frente a la casa
  { id: 'descanso', poster: poster2, clip: '/video/paseo-2.mp4', focus: 22 }, // kiosko con hamacas (izquierda)
  { id: 'sala', poster: poster3, clip: '/video/paseo-3.mp4', focus: 36 }, // sofás de mimbre
  { id: 'eventos', poster: poster4, clip: '/video/paseo-4.mp4', focus: 26 }, // corredor abierto al jardín
  { id: 'piscina', poster: poster5, clip: '/video/paseo-5.mp4', focus: 50 }, // piscina con el mar al fondo
  { id: 'playa', poster: poster6, clip: '/video/paseo-6.mp4', focus: 55 }, // camino al kiosko de playa
  { id: 'reserva', poster: poster7, clip: null, focus: 68 }, // vista aérea: piscina entre palmeras (el kiosko queda bajo el texto en móvil)
] as const;

// Cuánta pantalla de scroll ocupa cada parada (en alturas de pantalla). Más en la primera y la última.
export const ritmo = { parada: 0.9, primera: 1.3, ultima: 1.6, tramo: 1.4, crossfade: 0.07 };

type Parada = {
  lugar: string;
  eyebrow: string;
  titulo: string;
  texto: string;
  pills: string[];
};

const comun = (lang: Lang) => textos[lang];

export const sitio = {
  es: {
    lang: 'es',
    htmlLang: 'es-SV',
    ogLocale: 'es_SV',
    seo: {
      title: 'Rancho Varadero · Casa de playa en primera fila en Playa El Amatal',
      description:
        'Rancho de playa en primera fila frente al mar en Playa El Amatal, La Libertad, El Salvador. Hasta 12 personas, 4 habitaciones con aire acondicionado y piscina privada. Cotiza por WhatsApp.',
      ogAlt: 'Piscina azul frente a la casa de Rancho Varadero, entre palmeras',
    },
    saltar: 'Saltar al contenido',
    marca: 'Rancho Varadero',
    volverInicio: 'Rancho Varadero, volver al inicio',
    nav: [
      { href: '#inicio', label: 'Recorrido' },
      { href: '#servicios', label: 'Servicios' },
      { href: '#como-reservar', label: 'Cómo reservar' },
      { href: '#preguntas', label: 'Preguntas' },
    ],
    navLabel: 'Principal',
    menuAbrir: 'Abrir menú',
    menuCerrar: 'Cerrar menú',
    idioma: { label: 'Idioma', actual: 'ES', otro: 'EN', otroNombre: 'English', otroHref: rutas.en, otroLang: 'en' },
    reservarCorto: 'Reservar',
    reservar: comun('es').reservar, // "Reservar por WhatsApp"
    llamar: 'Llamar',
    o: 'o',

    paseo: {
      label: 'Recorrido por Rancho Varadero',
      railLabel: 'Paradas del recorrido',
      pista: 'Desliza para recorrer el rancho',
      // Parada 0: el hero. Su titular es el único h1 de la página.
      hero: {
        lugar: 'Inicio',
        marca: 'Rancho Varadero · Playa El Amatal',
        titulo: ['Tu casa de playa', 'en primera fila', 'frente al mar'],
        texto:
          'Piscina privada, 4 habitaciones con aire acondicionado y espacio para hasta 12 personas en La Libertad, El Salvador.',
        prueba: ['Primera fila frente al mar', 'Hasta 12 personas'],
      },
      paradas: [
        {
          lugar: 'Descanso',
          eyebrow: 'Descanso',
          titulo: 'Hamacas a la sombra, junto a la piscina',
          texto: 'Un kiosko con hamacas al lado de la piscina privada, para pasar la tarde a la sombra de las palmeras.',
          pills: ['Kiosko con hamacas', 'Piscina privada'],
        },
        {
          lugar: 'Sala',
          eyebrow: 'Espacio para todos',
          titulo: 'Una sala amplia para la familia y el grupo',
          texto:
            'Paredes de ladrillo, ventiladores de techo y muebles de mimbre. Para dormir, 4 habitaciones con aire acondicionado.',
          pills: ['4 habitaciones con aire acondicionado', 'Hasta 12 personas'],
        },
        {
          lugar: 'Eventos',
          eyebrow: 'Familias y eventos',
          titulo: 'Un corredor techado que se abre al jardín',
          texto:
            'El rancho está equipado para reuniones familiares y eventos, con terraza amplia y cocina totalmente equipada.',
          pills: ['Terraza amplia', 'Cocina totalmente equipada'],
        },
        {
          lugar: 'Piscina',
          eyebrow: 'Piscina privada',
          titulo: 'La piscina, las palmeras y el mar al fondo',
          texto: 'Una piscina privada solo para tu grupo, en primera fila frente al mar.',
          pills: ['Piscina privada', 'Primera fila'],
        },
        {
          lugar: 'Playa',
          eyebrow: 'Directo a la playa',
          titulo: 'Un camino entre palmeras hasta el mar',
          texto: 'El sendero cruza el jardín entre palmeras hasta el kiosko frente al mar, en primera fila.',
          pills: ['Kiosko frente al mar'],
        },
      ] satisfies Parada[],
      final: {
        lugar: 'Reserva',
        eyebrow: 'Reserva tu fecha',
        titulo: 'Rancho Varadero, en Playa El Amatal',
        texto:
          'Hasta 12 personas, parqueo dentro del rancho y primera fila frente al mar. Escríbenos para cotizar tus fechas.',
        pills: ['Hasta 12 personas', 'Parqueo dentro del rancho', 'La Libertad, El Salvador'],
        telefonosLabel: 'WhatsApp y llamadas',
      },
    },

    tagline: {
      label: 'Lo esencial',
      lineas: ['Despiertas en primera fila', 'frente al mar.', 'Piscina privada y lugar', 'para toda la familia.'],
    },

    servicios: {
      eyebrow: 'Servicios',
      titulo: 'Todo lo que necesita tu grupo, dentro del rancho',
      texto: 'Rancho Varadero está totalmente equipado para familias y eventos.',
      items: [
        { icono: 'users', titulo: 'Hasta 12 personas', texto: 'Capacidad para viajar en familia o con amigos.' },
        { icono: 'bed', titulo: '4 habitaciones', texto: 'Todas con aire acondicionado.' },
        { icono: 'pool', titulo: 'Piscina privada', texto: 'Solo para tu grupo, entre palmeras.' },
        { icono: 'cooking', titulo: 'Cocina totalmente equipada', texto: 'Para cocinar en casa durante tu estadía.' },
        { icono: 'sun', titulo: 'Terraza amplia', texto: 'Espacio para reunirse y comer juntos.' },
        { icono: 'car', titulo: 'Parqueo dentro del rancho', texto: 'Tus vehículos se quedan en la propiedad.' },
        { icono: 'waves', titulo: 'Primera fila frente al mar', texto: 'En Playa El Amatal, La Libertad.' },
      ],
    },

    galeria: {
      eyebrow: 'Galería',
      titulo: 'Así es el rancho',
      texto: 'Fotos de la propiedad.',
    },
    alt: comun('es').alt,

    pasos: {
      eyebrow: 'Cómo reservar',
      titulo: 'Tu fecha, en tres pasos',
      items: [
        {
          titulo: 'Escríbenos por WhatsApp',
          texto: 'Cuéntanos qué fechas te interesan y cuántas personas vienen, hasta 12.',
        },
        { titulo: 'Recibe tu cotización', texto: 'Te enviamos la cotización por el mismo chat. Si prefieres, llámanos.' },
        { titulo: 'Reserva y llega', texto: 'Confirma tu reserva con nosotros y llega a Playa El Amatal, La Libertad.' },
      ],
    },

    faq: {
      eyebrow: 'Preguntas frecuentes',
      titulo: 'Lo que suelen preguntarnos',
      items: [
        {
          q: '¿Dónde está Rancho Varadero?',
          a: 'En Playa El Amatal, La Libertad, El Salvador. El rancho está en primera fila frente al mar.',
        },
        { q: '¿Cuántas personas caben?', a: 'El rancho tiene capacidad para hasta 12 personas.' },
        { q: '¿Cuántas habitaciones tiene?', a: 'Tiene 4 habitaciones, todas con aire acondicionado.' },
        { q: '¿La piscina es privada?', a: 'Sí. La piscina es privada, solo para tu grupo.' },
        { q: '¿Se puede cocinar en el rancho?', a: 'Sí. El rancho tiene una cocina totalmente equipada.' },
        { q: '¿Hay parqueo?', a: 'Sí, hay parqueo dentro del rancho.' },
        {
          q: '¿Se pueden hacer eventos?',
          a: 'El rancho está totalmente equipado para familias y eventos, con terraza amplia. Escríbenos por WhatsApp y cuéntanos qué tienes en mente.',
        },
        {
          q: '¿Cómo cotizo y reservo?',
          a: 'Por WhatsApp al +503 7695-6521 o al +503 7695-6526. También puedes llamarnos a esos mismos números.',
        },
        { q: '¿Quién administra el rancho?', a: 'Rancho Varadero lo administra Alquileres MM (Ranchos MM).' },
      ],
    },

    cta: {
      titulo: ['Tu próxima reunión familiar,', 'frente al mar'],
      texto: 'Escríbenos por WhatsApp con tus fechas y el número de personas. Te respondemos con la cotización.',
    },

    footer: {
      administra: 'Administrado por Alquileres MM (Ranchos MM).',
      ubicacion: comun('es').ubicacion,
      contacto: comun('es').contactoTitulo,
      derechos: comun('es').derechos,
      volverArriba: 'Volver arriba',
    },

    noEncontrada: {
      title: 'Página no encontrada · Rancho Varadero',
      eyebrow: 'Error 404',
      titulo: 'Esta página no existe',
      texto: 'Puede que el enlace esté mal escrito o que la página ya no esté. El rancho sigue en su sitio.',
      volver: 'Volver al inicio',
    },
  },

  en: {
    lang: 'en',
    htmlLang: 'en',
    ogLocale: 'en_US',
    seo: {
      title: 'Rancho Varadero · Beachfront house at Playa El Amatal, El Salvador',
      description:
        'Beachfront rental right on the ocean at Playa El Amatal, La Libertad, El Salvador. Sleeps up to 12, 4 bedrooms with air conditioning and a private pool. Get a quote on WhatsApp.',
      ogAlt: 'Blue pool in front of the Rancho Varadero house, among palm trees',
    },
    saltar: 'Skip to content',
    marca: 'Rancho Varadero',
    volverInicio: 'Rancho Varadero, back to top',
    nav: [
      { href: '#inicio', label: 'Tour' },
      { href: '#servicios', label: 'Amenities' },
      { href: '#como-reservar', label: 'How to book' },
      { href: '#preguntas', label: 'FAQ' },
    ],
    navLabel: 'Main',
    menuAbrir: 'Open menu',
    menuCerrar: 'Close menu',
    idioma: { label: 'Language', actual: 'EN', otro: 'ES', otroNombre: 'Español', otroHref: rutas.es, otroLang: 'es' },
    reservarCorto: 'Book',
    reservar: comun('en').reservar, // "Book on WhatsApp"
    llamar: 'Call',
    o: 'or',

    paseo: {
      label: 'A walk through Rancho Varadero',
      railLabel: 'Tour stops',
      pista: 'Scroll to walk through the house',
      hero: {
        lugar: 'Home',
        marca: 'Rancho Varadero · Playa El Amatal',
        titulo: ['Your beach house,', 'right on the ocean'],
        texto:
          'A private pool, 4 bedrooms with air conditioning and room for up to 12 guests in La Libertad, El Salvador.',
        prueba: ['First row on the ocean', 'Sleeps up to 12'],
      },
      paradas: [
        {
          lugar: 'Rest',
          eyebrow: 'Rest',
          titulo: 'Hammocks in the shade, right by the pool',
          texto: 'A gazebo with hammocks next to the private pool, for slow afternoons in the shade of the palms.',
          pills: ['Hammock gazebo', 'Private pool'],
        },
        {
          lugar: 'Lounge',
          eyebrow: 'Room for everyone',
          titulo: 'A generous lounge for family and friends',
          texto: 'Brick walls, ceiling fans and wicker sofas. For sleeping, 4 bedrooms with air conditioning.',
          pills: ['4 bedrooms with air conditioning', 'Sleeps up to 12'],
        },
        {
          lugar: 'Events',
          eyebrow: 'Families and events',
          titulo: 'A covered hall that opens onto the garden',
          texto: 'The house is equipped for family gatherings and events, with a large terrace and a fully equipped kitchen.',
          pills: ['Large terrace', 'Fully equipped kitchen'],
        },
        {
          lugar: 'Pool',
          eyebrow: 'Private pool',
          titulo: 'The pool, the palms and the ocean beyond',
          texto: 'A private pool just for your group, in the first row facing the ocean.',
          pills: ['Private pool', 'Beachfront'],
        },
        {
          lugar: 'Beach',
          eyebrow: 'Straight to the beach',
          titulo: 'A path through the palms to the ocean',
          texto: 'The path crosses the lawn between the palms to the beachfront gazebo, in the first row.',
          pills: ['Beachfront gazebo'],
        },
      ] satisfies Parada[],
      final: {
        lugar: 'Book',
        eyebrow: 'Book your dates',
        titulo: 'Rancho Varadero, at Playa El Amatal',
        texto: 'Up to 12 guests, on site parking and the first row facing the ocean. Message us for a quote on your dates.',
        pills: ['Sleeps up to 12', 'On site parking', 'La Libertad, El Salvador'],
        telefonosLabel: 'WhatsApp and calls',
      },
    },

    tagline: {
      label: 'In short',
      lineas: ['Wake up in the first row,', 'facing the ocean.', 'A private pool and room', 'for the whole family.'],
    },

    servicios: {
      eyebrow: 'Amenities',
      titulo: 'Everything your group needs, inside the property',
      texto: 'Rancho Varadero is fully equipped for families and events.',
      items: [
        { icono: 'users', titulo: 'Sleeps up to 12', texto: 'Room for a family trip or a group of friends.' },
        { icono: 'bed', titulo: '4 bedrooms', texto: 'All of them with air conditioning.' },
        { icono: 'pool', titulo: 'Private pool', texto: 'Just for your group, among the palms.' },
        { icono: 'cooking', titulo: 'Fully equipped kitchen', texto: 'Cook at home during your stay.' },
        { icono: 'sun', titulo: 'Large terrace', texto: 'Space to gather and eat together.' },
        { icono: 'car', titulo: 'On site parking', texto: 'Your cars stay inside the property.' },
        { icono: 'waves', titulo: 'First row on the ocean', texto: 'At Playa El Amatal, La Libertad.' },
      ],
    },

    galeria: {
      eyebrow: 'Gallery',
      titulo: 'A look at the property',
      texto: 'Photos of the house and grounds.',
    },
    alt: comun('en').alt,

    pasos: {
      eyebrow: 'How to book',
      titulo: 'Your dates, in three steps',
      items: [
        { titulo: 'Message us on WhatsApp', texto: 'Tell us which dates you have in mind and how many guests are coming, up to 12.' },
        { titulo: 'Get your quote', texto: 'We send your quote in the same chat. If you prefer, give us a call.' },
        { titulo: 'Book and arrive', texto: 'Confirm your booking with us and head to Playa El Amatal, La Libertad.' },
      ],
    },

    faq: {
      eyebrow: 'FAQ',
      titulo: 'What guests usually ask',
      items: [
        {
          q: 'Where is Rancho Varadero?',
          a: 'At Playa El Amatal, La Libertad, El Salvador. The house sits in the first row, facing the ocean.',
        },
        { q: 'How many guests can stay?', a: 'The house sleeps up to 12 people.' },
        { q: 'How many bedrooms are there?', a: 'There are 4 bedrooms, all with air conditioning.' },
        { q: 'Is the pool private?', a: 'Yes. The pool is private, just for your group.' },
        { q: 'Can we cook at the house?', a: 'Yes. The house has a fully equipped kitchen.' },
        { q: 'Is there parking?', a: 'Yes, there is parking inside the property.' },
        {
          q: 'Can we host an event?',
          a: 'The house is fully equipped for families and events, with a large terrace. Message us on WhatsApp and tell us what you have in mind.',
        },
        {
          q: 'How do I get a quote and book?',
          a: 'On WhatsApp at +503 7695-6521 or +503 7695-6526. You can also call us at the same numbers.',
        },
        { q: 'Who manages the property?', a: 'Rancho Varadero is managed by Alquileres MM (Ranchos MM).' },
      ],
    },

    cta: {
      titulo: ['Your next family getaway,', 'right on the ocean'],
      texto: 'Message us on WhatsApp with your dates and the number of guests. We reply with your quote.',
    },

    footer: {
      administra: 'Managed by Alquileres MM (Ranchos MM).',
      ubicacion: comun('en').ubicacion,
      contacto: comun('en').contactoTitulo,
      derechos: comun('en').derechos,
      volverArriba: 'Back to top',
    },

    noEncontrada: {
      title: 'Page not found · Rancho Varadero',
      eyebrow: 'Error 404',
      titulo: 'This page does not exist',
      texto: 'The link may be mistyped or the page may have moved. The beach house is right where it was.',
      volver: 'Back to home',
    },
  },
} as const;

export type Sitio = (typeof sitio)[Lang];

// Fotos reales de la propiedad (galería, servicios, JSON-LD). Mismo orden que el paseo.
// Son los keyframes retocados del recorrido (media/keyframes/07-final, 16:9, 1440×810). El camino a la playa se
// queda en su foto vertical original: es la pieza alta de la cuadrícula de la galería.
export const galeria = [
  { src: '/galeria/0-piscina-casa.webp', id: 'piscinaCasa', w: 1440, h: 810 },
  { src: '/galeria/1-kiosko-hamacas.webp', id: 'casa', w: 1440, h: 810 },
  { src: '/galeria/2-sala.webp', id: 'sala', w: 1440, h: 810 },
  { src: '/galeria/3-corredor.webp', id: 'corredor', w: 1440, h: 810 },
  { src: '/galeria/4-piscina-mar.webp', id: 'piscinaMar', w: 1440, h: 810 },
  { src: '/galeria/5-camino-playa.webp', id: 'caminoPlaya', w: 1200, h: 1600 },
  { src: '/galeria/6-aereo.webp', id: 'aereo', w: 1440, h: 810 },
] as const;
