// Datos verificados de Rancho Varadero (proporcionados por la administración, Alquileres MM).
// No agregar precios, reseñas ni cifras que no estén aquí.

export type Lang = 'es' | 'en';

export const contacto = {
  telefonos: ['+503 7695-6521', '+503 7695-6526'],
  whatsapp: 'https://wa.me/50376956521',
};

// En el orden del recorrido: cada foto es una toma estática del paseo.
export const fotos = [
  { src: '/photos/0-piscina-casa.webp', id: 'piscinaCasa' },
  { src: '/photos/1-kiosko-hamacas.webp', id: 'casa' },
  { src: '/photos/2-sala.webp', id: 'sala' },
  { src: '/photos/3-corredor.webp', id: 'corredor' },
  { src: '/photos/4-piscina-mar.webp', id: 'piscinaMar' },
  { src: '/photos/5-camino-playa.webp', id: 'caminoPlaya' },
  { src: '/photos/6-aereo.webp', id: 'aereo' },
] as const;

export const textos = {
  es: {
    titulo: 'Rancho Varadero · Playa El Amatal, La Libertad',
    descripcion:
      'Rancho de playa en primera fila frente al mar en Playa El Amatal, La Libertad. Hasta 12 personas, 4 habitaciones con aire acondicionado y piscina privada.',
    nav: { inicio: 'Inicio', servicios: 'Servicios', galeria: 'Galería', contacto: 'Contacto' },
    bienvenida: 'Bienvenidos a Rancho Varadero',
    subtitulo: 'Rancho de playa en Playa El Amatal, La Libertad, El Salvador',
    reservar: 'Reservar por WhatsApp',
    sobreTitulo: 'Sobre nosotros',
    sobre:
      'Rancho Varadero es un rancho de playa administrado por Alquileres MM (Ranchos MM). Está en primera fila frente al mar y está totalmente equipado para familias y eventos.',
    serviciosTitulo: 'Servicios',
    servicios: [
      'Capacidad para hasta 12 personas',
      '4 habitaciones con aire acondicionado',
      'Piscina privada',
      'Cocina totalmente equipada',
      'Terraza amplia',
      'Parqueo dentro del rancho',
      'Primera fila frente al mar',
    ],
    galeriaTitulo: 'Galería',
    alt: {
      piscinaCasa: 'Piscina azul frente a la casa, entre palmeras y cielo despejado',
      aereo: 'Vista aérea del rancho entre palmeras, junto a la playa',
      casa: 'Casa con ventanales, piscina y kiosko con hamacas',
      sala: 'Sala con paredes de ladrillo, ventiladores de techo y muebles de mimbre',
      corredor: 'Corredor techado con mesas que se abre hacia el jardín',
      piscinaMar: 'Piscina con palmeras, jardín y el mar al fondo',
      caminoPlaya: 'Camino entre palmeras hacia el kiosko frente al mar',
    },
    contactoTitulo: 'Contacto',
    contactoTexto: 'Escríbenos o llámanos para cotizar y reservar.',
    ubicacion: 'Playa El Amatal, La Libertad, El Salvador',
    derechos: 'Todos los derechos reservados.',
    otroIdioma: 'English',
  },
  en: {
    titulo: 'Rancho Varadero · Playa El Amatal, La Libertad',
    descripcion:
      'Beachfront rental house right on the ocean at Playa El Amatal, La Libertad, El Salvador. Sleeps up to 12, 4 air-conditioned bedrooms and a private pool.',
    nav: { inicio: 'Home', servicios: 'Amenities', galeria: 'Gallery', contacto: 'Contact' },
    bienvenida: 'Welcome to Rancho Varadero',
    subtitulo: 'Beach house at Playa El Amatal, La Libertad, El Salvador',
    reservar: 'Book on WhatsApp',
    sobreTitulo: 'About us',
    sobre:
      'Rancho Varadero is a beachfront rental managed by Alquileres MM (Ranchos MM). It sits right on the ocean, in the first row, and is fully equipped for families and events.',
    serviciosTitulo: 'Amenities',
    servicios: [
      'Sleeps up to 12 guests',
      '4 air-conditioned bedrooms',
      'Private swimming pool',
      'Fully equipped kitchen',
      'Large terrace',
      'On-site parking',
      'First row, facing the ocean',
    ],
    galeriaTitulo: 'Gallery',
    alt: {
      piscinaCasa: 'Blue pool in front of the house, among palm trees under a clear sky',
      aereo: 'Aerial view of the property among palm trees, next to the beach',
      casa: 'House with glass doors, pool and a gazebo with hammocks',
      sala: 'Lounge with brick walls, ceiling fans and wicker furniture',
      corredor: 'Covered hallway with tables opening onto the garden',
      piscinaMar: 'Pool with palm trees, lawn and the ocean in the background',
      caminoPlaya: 'Path between palm trees to the beachfront gazebo',
    },
    contactoTitulo: 'Contact',
    contactoTexto: 'Message or call us for a quote or to book.',
    ubicacion: 'Playa El Amatal, La Libertad, El Salvador',
    derechos: 'All rights reserved.',
    otroIdioma: 'Español',
  },
} as const;
