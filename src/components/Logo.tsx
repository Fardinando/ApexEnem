import React from 'react';

interface LogoProps {
  variant?: 'favicon' | 'vertical' | 'horizontal' | 'texto' | 'favicon-a';
  className?: string;
}

interface LogoEntry {
  src: string;
  srcLight?: string;
  alt: string;
}

const LOGOS: Record<string, LogoEntry> = {
  favicon: { src: '/logos/favicon.png', alt: 'ApexEnem Favicon' },
  vertical: { src: '/logos/logo-vertical.png', alt: 'ApexEnem Logo' },
  horizontal: {
    src: '/logos/logo-horizontal.png',
    srcLight: '/logos/logo-horizontal-light.png',
    alt: 'ApexEnem',
  },
  texto: { src: '/logos/logo-texto.png', alt: 'ApexEnem' },
  'favicon-a': {
    src: '/logos/logo-favicon-a.png',
    srcLight: '/logos/logo-favicon-a-light.png',
    alt: 'ApexEnem Logo',
  },
};

export default function Logo({ variant = 'favicon-a', className = 'h-8 w-auto' }: LogoProps) {
  const entry = LOGOS[variant] || LOGOS['favicon-a'];
  const { src, srcLight, alt } = entry;

  if (srcLight) {
    return (
      <>
        <img src={srcLight} alt={alt} className={`${className} dark:hidden`} draggable={false} />
        <img src={src} alt={alt} className={`${className} hidden dark:block`} draggable={false} />
      </>
    );
  }

  return <img src={src} alt={alt} className={className} draggable={false} />;
}
