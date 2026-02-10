import type { PhotoCollection } from './types';

/**
 * Photo paths are relative to public/. Add your own images under public/photos/
 * (e.g. public/photos/still-life/01.jpg → use /photos/still-life/01.jpg).
 * Only include paths you're comfortable sharing publicly.
 */

const stillLifePhotos = [
  {
    id: 'sl-1',
    src: '/photos/still-life/kodak_200_c_41_40860_119374_268264_000008400008.jpg',
    alt: 'kodak 200 c-41 frame 000008400008',
    caption: '',
  },
  {
    id: 'sl-2',
    src: '/photos/still-life/kodak_200_c_41_40860_119374_268264_000008400016.jpg',
    alt: 'kodak 200 c-41 frame 000008400016',
    caption: '',
  },
  {
    id: 'sl-3',
    src: '/photos/still-life/kodak_200_c_41_40860_119374_268264_000008400028.jpg',
    alt: 'kodak 200 c-41 frame 000008400028',
    caption: '',
  },
  {
    id: 'sl-4',
    src: '/photos/still-life/kodak_200_c_41_40860_119374_268264_000008400035.jpg',
    alt: 'kodak 200 c-41 frame 000008400035',
    caption: '',
  },
];

export const COLLECTIONS: PhotoCollection[] = [
  {
    id: 'still-life',
    title: 'Still Life',
    description: 'Film still life.',
    photos: stillLifePhotos,
  },
];

export const ABOUT = {
  name: 'Alexander Ames',
  tagline: 'Photography',
  bio: 'Originally from the Southwest, Alexander moved to New York several years ago and rediscovered his love for film photography. He first learned the craft in high school, spending long hours in the darkroom developing film and printing on Ilford paper—a passion that stayed dormant until recently. Do you like the site? By trade, Alexander works as a data scientist and software engineer at a biomolecular research company focused on fighting cancer.',
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/adubsqz/' },
    { name: 'GitHub', url: 'https://github.com' },
  ],
};
