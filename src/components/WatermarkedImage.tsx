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
  watermarkText = 'adubsqz',
  watermarkOpacity = 0.14,
}: WatermarkedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const watermarkStamps = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    left: `${8 + (index % 4) * 28}%`,
    top: `${16 + Math.floor(index / 4) * 30}%`,
  }));

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
          pointerEvents: 'none',
        }}
        draggable="false"
      />

      {/* JS watermark pattern across the whole image */}
      {imageLoaded && (
        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none" aria-hidden="true">
          {watermarkStamps.map((stamp) => (
            <span
              key={stamp.id}
              className="absolute"
              style={{
                left: stamp.left,
                top: stamp.top,
                transform: 'rotate(-24deg)',
                opacity: watermarkOpacity,
                fontSize: 'clamp(0.95rem, 1.8vw, 1.55rem)',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                userSelect: 'none',
                pointerEvents: 'none',
                color: 'rgba(255, 255, 255, 0.92)',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.42)',
                whiteSpace: 'nowrap',
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
