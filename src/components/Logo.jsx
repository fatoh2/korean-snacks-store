import { useState } from 'react';

/**
 * Lulu Tokki brand mark. Renders /logo.png, falling back to a bunny
 * emoji if the image is missing (e.g. before the asset is added).
 */
export default function Logo({ size = 44, fit = 'contain', round = false, natural = false }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label="Lulu Tokki"
        style={{ fontSize: Math.round(size * 0.82), lineHeight: 1, flexShrink: 0 }}
      >
        🐰
      </span>
    );
  }

  return (
    <img
      src="/logo-nobg.png"
      loading="eager"
      alt="Lulu Tokki"
      width={size}
      height={natural ? undefined : size}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: natural ? 'auto' : size,
        objectFit: fit,
        borderRadius: round ? '50%' : 16,
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}
