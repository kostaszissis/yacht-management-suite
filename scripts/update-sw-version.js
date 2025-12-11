/**
 * Pre-build script to update service worker version
 * This ensures the service-worker.js file changes on every build,
 * forcing browsers to detect and install the new version.
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '..', 'public', 'service-worker.js');

// Generate version based on timestamp
const version = Date.now().toString(36);
const buildDate = new Date().toISOString();

console.log(`📦 Updating service worker version to: ${version}`);
console.log(`📅 Build date: ${buildDate}`);

// Read current service worker
let swContent = fs.readFileSync(SW_PATH, 'utf8');

// Update or add the BUILD_VERSION line
if (swContent.includes('const BUILD_VERSION')) {
  // Update existing version
  swContent = swContent.replace(
    /const BUILD_VERSION = '[^']*';/,
    `const BUILD_VERSION = '${version}';`
  );
} else {
  // Add version at the top (after the first comment block)
  const insertPoint = swContent.indexOf('\n\n') + 2;
  swContent = swContent.slice(0, insertPoint) +
    `const BUILD_VERSION = '${version}';\n` +
    `const BUILD_DATE = '${buildDate}';\n\n` +
    swContent.slice(insertPoint);
}

// Also update BUILD_DATE if it exists
if (swContent.includes('const BUILD_DATE')) {
  swContent = swContent.replace(
    /const BUILD_DATE = '[^']*';/,
    `const BUILD_DATE = '${buildDate}';`
  );
}

// Write updated service worker
fs.writeFileSync(SW_PATH, swContent);

console.log('✅ Service worker version updated successfully');
