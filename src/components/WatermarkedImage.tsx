import { useState } from 'react';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  /** Classes for the outer wrapper (default full-width; use `max-w-full w-fit` to hug image aspect ratio) */
  wrapperClassName?: string;
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
  wrapperClassName = 'relative inline-block w-full',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  onClick,
  watermarkText = 'adubsqz',
  watermarkOpacity = 0.09,
}: WatermarkedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className={wrapperClassName}
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

      {/* One diagonal watermark plus one bottom-right signature */}
      {imageLoaded && (
        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none" aria-hidden="true">
          <span
            className="absolute left-1/2 top-1/2"
            style={{
              transform: 'translate(-50%, -50%) rotate(-24deg)',
              opacity: watermarkOpacity,
              fontSize: 'clamp(1rem, 2.2vw, 1.85rem)',
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              userSelect: 'none',
              pointerEvents: 'none',
              color: 'rgba(255, 255, 255, 0.84)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.38)',
              whiteSpace: 'nowrap',
            }}
          >
            {watermarkText}
          </span>
          <span
            className="absolute right-3 bottom-2"
            style={{
              opacity: Math.min(watermarkOpacity + 0.04, 0.2),
              fontSize: 'clamp(0.72rem, 1.1vw, 0.92rem)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'lowercase',
              userSelect: 'none',
              pointerEvents: 'none',
              color: 'rgba(255, 255, 255, 0.86)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)',
              whiteSpace: 'nowrap',
            }}
          >
            © {watermarkText}
          </span>
        </div>
      )}
    </div>
  );
}
