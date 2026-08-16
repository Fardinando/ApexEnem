import React from 'react';

interface LogoProps {
  variant?: 'favicon' | 'vertical' | 'horizontal' | 'texto' | 'favicon-a';
  className?: string;
}

const LOGOS: Record<string, { src: string; alt: string }> = {
  favicon: { src: '/logos/favicon.png', alt: 'ApexEnem Favicon' },
  vertical: { src: '/logos/logo-vertical.png', alt: 'ApexEnem Logo' },
  horizontal: { src: '/logos/logo-horizontal.png', alt: 'ApexEnem Logo' },
  texto: { src: '/logos/logo-texto.png', alt: 'ApexEnem' },
  'favicon-a': { src: '/logos/logo-favicon-a.png', alt: 'ApexEnem Logo' },
};

export default function Logo({ variant = 'favicon-a', className = 'h-8 w-auto' }: LogoProps) {
  const { src, alt } = LOGOS[variant] || LOGOS['favicon-a'];
  return <img src={src} alt={alt} className={className} draggable={false} />;
}
