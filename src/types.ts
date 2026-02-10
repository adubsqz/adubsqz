export type PageView = 'home' | 'gallery' | 'about';

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
