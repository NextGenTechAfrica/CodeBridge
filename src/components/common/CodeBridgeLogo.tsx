// src/components/common/CodeBridgeLogo.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface CodeBridgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'dark-text' | 'light-text' | 'icon-only' | 'auto';
  showTagline?: boolean;
  href?: string | null;
  className?: string;
  priority?: boolean;
}

export default function CodeBridgeLogo({
  size = 'md',
  variant = 'auto',
  showTagline = true,
  href = '/',
  className = '',
  priority = true,
}: CodeBridgeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dimensions map
  const isIconOnly = variant === 'icon-only';

  const sizeMap: Record<string, { height: number; width: number }> = {
    sm: isIconOnly
      ? { height: 28, width: 28 }
      : showTagline
      ? { height: 30, width: 113 }
      : { height: 24, width: 131 },
    md: isIconOnly
      ? { height: 38, width: 38 }
      : showTagline
      ? { height: 40, width: 151 }
      : { height: 32, width: 175 },
    lg: isIconOnly
      ? { height: 50, width: 50 }
      : showTagline
      ? { height: 52, width: 196 }
      : { height: 42, width: 230 },
    xl: isIconOnly
      ? { height: 68, width: 68 }
      : showTagline
      ? { height: 72, width: 271 }
      : { height: 56, width: 306 },
  };

  const dims = typeof size === 'number'
    ? isIconOnly
      ? { height: size, width: size }
      : showTagline
      ? { height: size, width: Math.round(size * 3.766) }
      : { height: size, width: Math.round(size * 5.47) }
    : sizeMap[size] || sizeMap.md;

  const renderPicture = (isDarkText: boolean, themeClass: string = '') => {
    let png = '/images/codebridge-logo-full.png';
    let webp = '/images/codebridge-logo-full.webp';
    let altText = showTagline ? 'CodeBridge — Ideas to Impact' : 'CodeBridge';

    if (isIconOnly) {
      png = '/images/codebridge-icon.png';
      webp = '/images/codebridge-icon.webp';
      altText = 'CodeBridge Icon';
    } else if (!isDarkText) {
      // Light text for dark backgrounds
      png = showTagline
        ? '/images/codebridge-logo-light.png'
        : '/images/codebridge-logo-notag-light.png';
      webp = showTagline
        ? '/images/codebridge-logo-light.webp'
        : '/images/codebridge-logo-notag-light.webp';
    } else {
      // Dark text for light backgrounds
      png = showTagline
        ? '/images/codebridge-logo-full.png'
        : '/images/codebridge-logo-notag.png';
      webp = showTagline
        ? '/images/codebridge-logo-full.webp'
        : '/images/codebridge-logo-notag.webp';
    }

    return (
      <picture className={themeClass} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <source srcSet={webp} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={png}
          alt={altText}
          width={dims.width}
          height={dims.height}
          className={`cb-logo-img ${className}`}
          style={{
            height: `${dims.height}px`,
            width: 'auto',
            maxWidth: '100%',
            display: 'block',
            objectFit: 'contain',
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            transition: 'opacity 0.2s ease',
          }}
          loading={priority ? 'eager' : 'lazy'}
        />
      </picture>
    );
  };

  let logoContent;
  if (isIconOnly) {
    logoContent = renderPicture(true);
  } else if (variant === 'dark-text') {
    logoContent = renderPicture(true);
  } else if (variant === 'light-text') {
    logoContent = renderPicture(false);
  } else {
    // variant === 'auto': Render both with CSS classes for zero-flash instantaneous theme response
    logoContent = (
      <>
        {renderPicture(true, 'cb-logo-light-theme')}
        {renderPicture(false, 'cb-logo-dark-theme')}
      </>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}
        aria-label="CodeBridge Home"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
