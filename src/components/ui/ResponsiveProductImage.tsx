'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ZoomIn, X, Sparkles } from 'lucide-react';

interface ResponsiveProductImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  allowZoom?: boolean;
  priority?: boolean;
}

export function getResponsiveImagePath(
  src: string | null | undefined,
  tier: 'sm' | 'md' | 'lg'
): string {
  if (!src) return '/assets/logo-mango-nyeni-sm.webp';

  // Normalize path extension
  let basePath = src;
  if (basePath.endsWith('.png') || basePath.endsWith('.jpg') || basePath.endsWith('.jpeg')) {
    basePath = basePath.replace(/\.(png|jpg|jpeg)$/i, '');
  } else if (basePath.endsWith('.webp')) {
    basePath = basePath.replace(/-sm\.webp$|-md\.webp$|-lg\.webp$|\.webp$/i, '');
  }

  // Check known assets
  const knownAssets: Record<string, string> = {
    '/assets/mango-sago-only': `/assets/mango-sago-only-${tier}.webp`,
    '/assets/mango-sago-splash-stack': `/assets/mango-sago-splash-stack-${tier}.webp`,
    '/assets/naga-sago-splash-promo': `/assets/naga-sago-splash-promo-${tier}.webp`,
    '/assets/Naga Sago Splash Promo': `/assets/naga-sago-splash-promo-${tier}.webp`,
    '/assets/strawberry-sago-summer-delight': `/assets/strawberry-sago-summer-delight-${tier}.webp`,
    '/assets/Strawberry Sago Summer Delight': `/assets/strawberry-sago-summer-delight-${tier}.webp`,
    '/assets/price-list-mango-sago': `/assets/price-list-mango-sago-${tier}.webp`,
    '/assets/logo-mango-nyeni': `/assets/logo-mango-nyeni-${tier}.webp`,
  };

  if (knownAssets[basePath]) {
    return knownAssets[basePath];
  }

  return `${basePath}-${tier}.webp`;
}

export function ResponsiveProductImage({
  src,
  alt,
  size = 'md',
  className = '',
  allowZoom = false,
  priority = false,
}: ResponsiveProductImageProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const imageSrc = getResponsiveImagePath(src, size);
  const zoomSrc = getResponsiveImagePath(src, 'lg');

  return (
    <>
      <div className={`relative group/img overflow-hidden ${className}`}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={
            size === 'sm'
              ? '120px'
              : size === 'md'
              ? '(max-width: 768px) 50vw, 360px'
              : '100vw'
          }
          className="object-contain transition-transform duration-300 group-hover/img:scale-105"
        />

        {allowZoom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomOpen(true);
            }}
            title="Klik untuk zoom resolusi tinggi (3x)"
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-md shadow-md z-10"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lightbox / Zoom Modal (Tier 3: Zoom Resolution) */}
      <AnimatePresence>
        {isZoomOpen && (
          <div
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-neutral-900 rounded-ios-card p-4 sm:p-6 border border-white/20 shadow-2xl flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-nyeni-mango" />
                  <span className="text-sm font-bold text-white">{alt}</span>
                  <span className="text-[10px] bg-white/15 text-white/80 font-mono px-2 py-0.5 rounded-full">
                    Zoom HD 3x WebP
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center p-4">
                <Image
                  src={zoomSrc}
                  alt={alt}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>

              <p className="text-[11px] text-neutral-400 mt-3 text-center">
                Mode Tinjauan Kualitas Tinggi &bull; Mango Nyeni Signature Menu
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
