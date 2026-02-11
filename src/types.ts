export type PageView = 'gallery' | 'about';
export type GalleryFilter = 'bw' | 'color';

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface PhotoCollection {
  id: string;
  title: string;
  description?: string;
  photos: Photo[];
}
