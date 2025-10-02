/**
 * This script processes hero images to create responsive versions
 * It runs at build time to ensure hero images are optimized
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/** Match supported image extensions */
const IMAGE_EXT_RE = /(\.jpe?g|\.png|\.webp|\.avif|\.gif)$/i;

/**
 * Image size configurations for responsive images
 * Each size will be generated and made available in srcset
 */
const IMAGE_SIZES = [
  { width: 400, suffix: "-400w" },
  { width: 800, suffix: "-800w" },
  { width: 1200, suffix: "-1200w" },
  { width: 1600, suffix: "-1600w" }
];

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Process hero images to create responsive versions
 */
module.exports = async function() {
  const heroDir = path.join(__dirname, '../images/hero');
  const responsiveDir = path.join(__dirname, '../images/hero/responsive');
  
  // Create responsive directory if it doesn't exist
  ensureDir(responsiveDir);
  
  if (fs.existsSync(heroDir)) {
    const files = fs.readdirSync(heroDir)
      .filter(file => IMAGE_EXT_RE.test(file));
      
    for (const file of files) {
      const filePath = path.join(heroDir, file);
      
      // Skip directories and non-image files
      if (fs.statSync(filePath).isDirectory() || !IMAGE_EXT_RE.test(file)) {
        continue;
      }
      
      // Extract base filename and extension
      const extMatch = file.match(IMAGE_EXT_RE);
      const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
      const baseName = file.replace(IMAGE_EXT_RE, "");
      
      // Get original image dimensions
      const metadata = await sharp(filePath).metadata();
      
      // Generate each size
      for (const size of IMAGE_SIZES) {
        // Skip sizes larger than the original
        if (size.width >= metadata.width) continue;
        
        const outputName = `${baseName}${size.suffix}${ext}`;
        const outputPath = path.join(responsiveDir, outputName);
        
        // Skip if already exists (to speed up rebuilds)
        if (!fs.existsSync(outputPath)) {
          await sharp(filePath)
            .resize({ width: size.width, withoutEnlargement: true })
            .toFile(outputPath);
        }
      }
    }
  }
  
  return {};
};
