import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06182c" />
      <stop offset="60%" stop-color="#030c17" />
      <stop offset="100%" stop-color="#010408" />
    </radialGradient>

    <!-- Radiant Glow Core -->
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="25%" stop-color="#a5f3fc" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#00f3ff" stop-opacity="0.8" />
      <stop offset="75%" stop-color="#0284c7" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
    </radialGradient>

    <!-- Inner Plasma Light -->
    <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="35%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="70%" stop-color="#0284c7" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Coil Glow Linear -->
    <linearGradient id="coilLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <filter id="reactorGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />

  <g transform="translate(256, 256)">
    <!-- Ambient Blue Energy Halo -->
    <circle r="220" fill="none" stroke="#00f3ff" stroke-width="1.5" stroke-opacity="0.2" />
    <circle r="206" fill="none" stroke="#0284c7" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.4" />

    <!-- Heavy Outer Titanium Ring -->
    <circle r="195" fill="none" stroke="#0f233a" stroke-width="16" />
    <circle r="195" fill="none" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.5" />
    <circle r="187" fill="none" stroke="#0284c7" stroke-width="2" stroke-opacity="0.7" />

    <!-- Outer Metric Ticks (36 ticks) -->
    ${Array.from({ length: 36 }).map((_, i) => {
      const angle = i * 10;
      const isMajor = i % 3 === 0;
      return `<line x1="0" y1="${isMajor ? -202 : -199}" x2="0" y2="-188" stroke="${isMajor ? '#00f3ff' : '#0284c7'}" stroke-width="${isMajor ? 2.5 : 1}" stroke-opacity="${isMajor ? 0.9 : 0.4}" transform="rotate(${angle})" />`;
    }).join('\n    ')}

    <!-- 10 Primary Arc Reactor Energy Coils -->
    ${Array.from({ length: 10 }).map((_, i) => {
      const angle = i * 36;
      return `
      <g transform="rotate(${angle})">
        <!-- Coil Base Shadow -->
        <rect x="-14" y="-178" width="28" height="42" rx="4" fill="#051525" stroke="#00f3ff" stroke-width="1.5" stroke-opacity="0.8" />
        <!-- Copper / Plasma Filament Windings -->
        <rect x="-11" y="-174" width="22" height="34" rx="2" fill="#082845" />
        <line x1="-11" y1="-167" x2="11" y2="-167" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.9" />
        <line x1="-11" y1="-160" x2="11" y2="-160" stroke="#ffffff" stroke-width="2.5" filter="url(#softGlow)" />
        <line x1="-11" y1="-153" x2="11" y2="-153" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.9" />
        <line x1="-11" y1="-146" x2="11" y2="-146" stroke="#0284c7" stroke-width="2" />
        <!-- Top Radiant Emitter Pin -->
        <circle cx="0" cy="-174" r="2.5" fill="#ffffff" filter="url(#softGlow)" />
      </g>`;
    }).join('\n    ')}

    <!-- Middle Glowing Toroid Ring (Connecting Coils) -->
    <circle r="156" fill="none" stroke="#00f3ff" stroke-width="6" stroke-opacity="0.4" filter="url(#reactorGlow)" />
    <circle r="156" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.9" filter="url(#softGlow)" />
    <circle r="136" fill="none" stroke="#00f3ff" stroke-width="3" stroke-opacity="0.8" />

    <!-- Inner Segmented Brackets (10 structural connectors) -->
    ${Array.from({ length: 10 }).map((_, i) => {
      const angle = i * 36 + 18;
      return `<line x1="0" y1="-156" x2="0" y2="-118" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.75" transform="rotate(${angle})" />`;
    }).join('\n    ')}

    <!-- Interlocking Palladium Core Ring -->
    <circle r="118" fill="#041220" stroke="#00f3ff" stroke-width="4" filter="url(#reactorGlow)" />
    <circle r="118" fill="none" stroke="#ffffff" stroke-width="1.5" />
    <circle r="102" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="8 6" stroke-opacity="0.8" />

    <!-- Center Geometric Triangle / Hexagonal Energy Truss -->
    <polygon points="0,-82 71,41 -71,41" fill="none" stroke="#00f3ff" stroke-width="3.5" stroke-opacity="0.85" filter="url(#softGlow)" />
    <polygon points="0,82 71,-41 -71,-41" fill="none" stroke="#0284c7" stroke-width="2" stroke-opacity="0.6" />

    <!-- Radiant Inner Core & Photon Emitter -->
    <circle r="72" fill="url(#coreGlow)" filter="url(#reactorGlow)" />
    <circle r="52" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8" />
    <circle r="36" fill="#ffffff" filter="url(#reactorGlow)" />
    <circle r="22" fill="#ffffff" />
  </g>
</svg>`;

// Safe-zone padded maskable version (80% scale centered on solid background)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06182c" />
      <stop offset="60%" stop-color="#030c17" />
      <stop offset="100%" stop-color="#010408" />
    </radialGradient>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="25%" stop-color="#a5f3fc" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#00f3ff" stop-opacity="0.8" />
      <stop offset="75%" stop-color="#0284c7" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
    </radialGradient>
    <filter id="reactorGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Full-bleed background for maskable circle / squircle cropping -->
  <rect width="512" height="512" fill="#030712" />

  <!-- Centered with 82% scale to guarantee Android 15% safe margin -->
  <g transform="translate(256, 256) scale(0.82)">
    <circle r="220" fill="none" stroke="#00f3ff" stroke-width="1.5" stroke-opacity="0.2" />
    <circle r="206" fill="none" stroke="#0284c7" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.4" />
    <circle r="195" fill="none" stroke="#0f233a" stroke-width="16" />
    <circle r="195" fill="none" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.5" />
    <circle r="187" fill="none" stroke="#0284c7" stroke-width="2" stroke-opacity="0.7" />

    ${Array.from({ length: 36 }).map((_, i) => {
      const angle = i * 10;
      const isMajor = i % 3 === 0;
      return `<line x1="0" y1="${isMajor ? -202 : -199}" x2="0" y2="-188" stroke="${isMajor ? '#00f3ff' : '#0284c7'}" stroke-width="${isMajor ? 2.5 : 1}" stroke-opacity="${isMajor ? 0.9 : 0.4}" transform="rotate(${angle})" />`;
    }).join('\n    ')}

    ${Array.from({ length: 10 }).map((_, i) => {
      const angle = i * 36;
      return `
      <g transform="rotate(${angle})">
        <rect x="-14" y="-178" width="28" height="42" rx="4" fill="#051525" stroke="#00f3ff" stroke-width="1.5" stroke-opacity="0.8" />
        <rect x="-11" y="-174" width="22" height="34" rx="2" fill="#082845" />
        <line x1="-11" y1="-167" x2="11" y2="-167" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.9" />
        <line x1="-11" y1="-160" x2="11" y2="-160" stroke="#ffffff" stroke-width="2.5" filter="url(#softGlow)" />
        <line x1="-11" y1="-153" x2="11" y2="-153" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.9" />
        <line x1="-11" y1="-146" x2="11" y2="-146" stroke="#0284c7" stroke-width="2" />
        <circle cx="0" cy="-174" r="2.5" fill="#ffffff" filter="url(#softGlow)" />
      </g>`;
    }).join('\n    ')}

    <circle r="156" fill="none" stroke="#00f3ff" stroke-width="6" stroke-opacity="0.4" filter="url(#reactorGlow)" />
    <circle r="156" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.9" filter="url(#softGlow)" />
    <circle r="136" fill="none" stroke="#00f3ff" stroke-width="3" stroke-opacity="0.8" />

    ${Array.from({ length: 10 }).map((_, i) => {
      const angle = i * 36 + 18;
      return `<line x1="0" y1="-156" x2="0" y2="-118" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.75" transform="rotate(${angle})" />`;
    }).join('\n    ')}

    <circle r="118" fill="#041220" stroke="#00f3ff" stroke-width="4" filter="url(#reactorGlow)" />
    <circle r="118" fill="none" stroke="#ffffff" stroke-width="1.5" />
    <circle r="102" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="8 6" stroke-opacity="0.8" />

    <polygon points="0,-82 71,41 -71,41" fill="none" stroke="#00f3ff" stroke-width="3.5" stroke-opacity="0.85" filter="url(#softGlow)" />
    <polygon points="0,82 71,-41 -71,-41" fill="none" stroke="#0284c7" stroke-width="2" stroke-opacity="0.6" />

    <circle r="72" fill="url(#coreGlow)" filter="url(#reactorGlow)" />
    <circle r="52" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8" />
    <circle r="36" fill="#ffffff" filter="url(#reactorGlow)" />
    <circle r="22" fill="#ffffff" />
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg);

  const svgBuffer = Buffer.from(svg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate PNGs
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-64x64.png'));

  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('All Arc Reactor PWA icons successfully generated!');
}

run().catch(console.error);
