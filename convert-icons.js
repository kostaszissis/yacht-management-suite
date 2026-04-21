// This script converts SVG icons to PNG using sharp
// Run: npm install sharp
// Then: node convert-icons.js

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp package not found!');
  console.error('Please install it first: npm install sharp');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const publicDir = path.join(__dirname, 'public');

async function convertIcons() {
  console.log('Converting SVG icons to PNG...\n');

  for (const size of sizes) {
    const svgFile = path.join(publicDir, `icon-${size}.svg`);
    const pngFile = path.join(publicDir, `icon-${size}.png`);

    try {
      await sharp(svgFile)
        .resize(size, size)
        .png()
        .toFile(pngFile);

      console.log(`✓ Converted icon-${size}.png`);

      // Delete SVG file after conversion
      fs.unlinkSync(svgFile);
    } catch (error) {
      console.error(`✗ Failed to convert icon-${size}.svg:`, error.message);
    }
  }

  console.log('\n✅ All icons converted to PNG!');
  console.log('SVG files have been removed.');
}

convertIcons();
