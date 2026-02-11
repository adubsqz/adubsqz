import { useState } from 'react';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  onError?: () => void;
  onClick?: () => void;
  watermarkText?: string;
  watermarkOpacity?: number;
}

/**
 * Protected image component with drag/download prevention
 * Images have embedded watermarks (added during optimization)
 * Plus a huge but super subtle overlay watermark for extra protection
 */
export default function WatermarkedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  onClick,
  watermarkText = 'adubsqz ltd.',
  watermarkOpacity = 0.08, // Super subtle - can barely see it but it's there
}: WatermarkedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className="relative inline-block w-full"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Transparent overlay to prevent drag-and-drop */}
      <div
        className="absolute inset-0 z-10"
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      />
      
      {/* Main Image - Watermark is embedded in the image file itself */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        onError={onError}
        onLoad={handleImageLoad}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitUserDrag: 'none',
          pointerEvents: 'none',
        }}
        draggable="false"
      />

      {/* Huge subtle watermark overlay - top left */}
      {imageLoaded && (
        <div
          className="absolute top-8 left-8 z-20"
          style={{
            opacity: watermarkOpacity,
            fontSize: '4rem', // Huge size (64px)
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'lowercase',
            userSelect: 'none',
            pointerEvents: 'none',
            color: 'white',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
            lineHeight: '1',
          }}
        >
          {watermarkText}
        </div>
      )}
    </div>
  );
}
