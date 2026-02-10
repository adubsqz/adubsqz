import { describe, it, expect } from 'vitest';
import { COLLECTIONS, ABOUT } from './data';
import type { Photo, PhotoCollection } from './types';

describe('data', () => {
  describe('COLLECTIONS', () => {
    it('is a non-empty array', () => {
      expect(COLLECTIONS).toBeInstanceOf(Array);
      expect(COLLECTIONS.length).toBeGreaterThan(0);
    });

    it('each collection has required PhotoCollection fields', () => {
      COLLECTIONS.forEach((collection: PhotoCollection) => {
        expect(collection).toHaveProperty('id');
        expect(collection).toHaveProperty('title');
        expect(collection).toHaveProperty('photos');
        expect(typeof collection.id).toBe('string');
        expect(typeof collection.title).toBe('string');
        expect(Array.isArray(collection.photos)).toBe(true);
      });
    });

    it('each photo in collections has required Photo fields', () => {
      COLLECTIONS.forEach((collection: PhotoCollection) => {
        collection.photos.forEach((photo: Photo) => {
          expect(photo).toHaveProperty('id');
          expect(photo).toHaveProperty('src');
          expect(photo).toHaveProperty('alt');
          expect(typeof photo.id).toBe('string');
          expect(typeof photo.src).toBe('string');
          expect(typeof photo.alt).toBe('string');
          expect(photo.src.length).toBeGreaterThan(0);
        });
      });
    });

    it('photo src paths start with /photos/', () => {
      COLLECTIONS.forEach((collection: PhotoCollection) => {
        collection.photos.forEach((photo: Photo) => {
          expect(photo.src).toMatch(/^\/photos\//);
        });
      });
    });
  });

  describe('ABOUT', () => {
    it('has required fields', () => {
      expect(ABOUT).toHaveProperty('name');
      expect(ABOUT).toHaveProperty('tagline');
      expect(ABOUT).toHaveProperty('contactEmail');
      expect(ABOUT).toHaveProperty('bio');
      expect(ABOUT).toHaveProperty('socials');
      expect(typeof ABOUT.name).toBe('string');
      expect(typeof ABOUT.bio).toBe('string');
      expect(Array.isArray(ABOUT.socials)).toBe(true);
    });

    it('socials have name and url', () => {
      ABOUT.socials.forEach((social) => {
        expect(social).toHaveProperty('name');
        expect(social).toHaveProperty('url');
        expect(typeof social.name).toBe('string');
        expect(typeof social.url).toBe('string');
      });
    });
  });
});
