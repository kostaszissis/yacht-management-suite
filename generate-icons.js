const fs = require('fs');
const path = require('path');

// SVG template for the anchor icon with navy blue background
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Navy blue background -->
  <rect width="${size}" height="${size}" fill="#1e3a5f" rx="${size * 0.15}"/>

  <!-- White anchor icon -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Anchor path scaled to size -->
    <g transform="scale(${size / 100})">
      <!-- Ring at top -->
      <circle cx="0" cy="-32" r="4" fill="none" stroke="white" stroke-width="2.5"/>

      <!-- Vertical shaft -->
      <rect x="-2" y="-28" width="4" height="50" fill="white"/>

      <!-- Horizontal bar (crossbar) -->
      <rect x="-20" y="-5" width="40" height="4" fill="white" rx="2"/>

      <!-- Left fluke -->
      <path d="M -2 22 L -22 35 L -22 28 C -22 24 -18 20 -14 18 L -2 22 Z" fill="white"/>

      <!-- Right fluke -->
      <path d="M 2 22 L 22 35 L 22 28 C 22 24 18 20 14 18 L 2 22 Z" fill="white"/>

      <!-- Bottom point -->
      <circle cx="0" cy="22" r="2" fill="white"/>
    </g>
  </g>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const outputDir = path.join(__dirname, 'public');

console.log('Generating PWA icons...\n');

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, svg.trim());
  console.log(`✓ Created ${filename}`);
});

console.log('\n✅ All SVG icons generated!');
console.log('\nTo convert SVG to PNG, you can:');
console.log('1. Use an online converter like: https://cloudconvert.com/svg-to-png');
console.log('2. Install sharp package: npm install sharp');
console.log('3. Use ImageMagick: convert icon-*.svg icon-*.png');
console.log('\nOr run the convert-icons.js script (requires sharp package)');
