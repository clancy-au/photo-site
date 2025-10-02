const fs = require('fs');
const path = require('path');
const exifr = require('exifr');
const sharp = require('sharp');
const Image = require('@11ty/eleventy-img');

// ------------------------------
// Constants & helpers
// ------------------------------

/** Match supported image extensions */
const IMAGE_EXT_RE = /(\.jpe?g|\.png|\.webp|\.avif|\.gif)$/i;

/**
 * Image size configurations for responsive images
 * Each size will be generated and made available in srcset
 * These will be used with eleventy-img
 */
const IMAGE_SIZES = [400, 800, 1200, 1600, 2000];

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
 * Clean a human caption from a filename-like string.
 * Mirrors the original replace-chain exactly.
 * @param {string} input
 * @returns {string}
 */
function cleanCaptionFromFilename(input) {
  return input
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/^[A-Z]{3}\d+[-_]*/i, '') // Remove camera file prefix like DSC01234-
    .replace(/[-_](Enhanced|Edit|Export|Pano)[-_]*/gi, ' ') // Remove processing tags
    .replace(/[-_]+/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
}

/**
 * Derive alt text from a filename (keep it simple, no extra cleanups used for caption).
 * @param {string} filename
 */
function deriveAltFromFilename(filename) {
  return filename.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
}

/**
 * Build the EXIF data map from raw exifr output, preserving original behavior.
 * @param {any} exif
 */
function formatExif(exif) {
  if (!exif) return {};
  return {
    camera: exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : null,
    lens: exif.LensModel || null,
    focalLength: exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : null,
    aperture: exif.FNumber ? `f/${exif.FNumber}` : null,
    shutterSpeed: exif.ExposureTime
      ? (exif.ExposureTime >= 1
        ? `${exif.ExposureTime}s`
        : `1/${Math.round(1 / exif.ExposureTime)}s`)
      : null,
    iso: exif.ISO || null,
    dateTime: exif.DateTimeOriginal || exif.DateTime
      ? new Date(exif.DateTimeOriginal || exif.DateTime).toLocaleDateString('en-AU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null,
  };
}

// Read first meaningful line from a sidecar Markdown file (skip YAML front matter).
// Also create an empty sidecar .md if it doesn't exist so captions can be added later.
function readCaptionFromSidecarMD(imageAbsPath) {
  const mdPath = imageAbsPath + '.md';
  try {
    if (!fs.existsSync(mdPath)) {
      // Create an empty sidecar file for the author to fill in later
      try {
        fs.writeFileSync(mdPath, '');
      } catch {}
      return null; // No caption yet; will fallback to filename-derived caption
    }

    const raw = fs.readFileSync(mdPath, 'utf8');
    if (!raw.trim()) return null; // empty file, fallback

    const lines = raw.split(/\r?\n/);
    // Skip front matter if present
    let i = 0;
    if (lines[0] && lines[0].trim() === '---') {
      i = 1;
      while (i < lines.length && lines[i].trim() !== '---') i++;
      if (i < lines.length && lines[i].trim() === '---') i++;
    }

    // First non-empty content line becomes the caption
    let line = '';
    for (; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.length) { line = t; break; }
    }
    if (!line) return null;

    // Clean basic markdown from the line
    line = line.replace(/^#{1,6}\s+/, ''); // strip heading hashes
    line = line.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // [text](url) -> text
    line = line.replace(/[*_`~]+/g, ''); // emphasis/backticks/tilde
    return line.trim();
  } catch (e) {
    return null;
  }
}

/**
 * Generate responsive image versions for the given image file using eleventy-img
 * @param {string} filePath - Original image path
 * @param {string} slug - Gallery slug
 * @param {string} name - Image filename
 * @returns {Object} Object with srcset, sizes, dimensions, and aspect ratio information
 */
async function generateResponsiveImages(filePath, slug, name) {
  //const startTime = Date.now();
  //console.log(`[${new Date().toISOString()}] generateResponsiveImages processing image: ${slug}/${name}`);
  // Extract base filename
  const baseName = path.parse(name).name;
  
  // Generate responsive images with eleventy-img
  const metadata = await Image(filePath, {
    widths: IMAGE_SIZES,
    formats: ["avif", "jpeg"],
    outputDir: path.join(__dirname, "../../_site/galleries", slug, "responsive"),
    urlPath: `/galleries/${slug}/responsive`,
    filenameFormat: (id, src, width, format) => {
      return `${baseName}-${width}w.${format}`;
    },
    sharpOptions: {
      animated: false
    }
  });
  
  // Get original image dimensions to calculate aspect ratio
  const dimensions = await sharp(filePath).metadata();
  const aspectRatio = dimensions.width / dimensions.height;
  
  // Format srcset strings for each format
  const srcsets = {};
  const fullUrls = {};
  
  for (const format in metadata) {
    srcsets[format] = metadata[format].map(entry => `${entry.url} ${entry.width}w`).join(', ');
    // Store the largest image URL for each format
    fullUrls[format] = metadata[format].reduce((largest, current) => 
      current.width > largest.width ? current : largest, 
      metadata[format][0]
    ).url;
  }
  
  // We don't need to calculate sizes here anymore as it's calculated in the JS
  // based on the actual row height and aspect ratio
  
  return {
    srcset: srcsets.jpeg,
    avifSrcset: srcsets.avif,
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: aspectRatio,
    fullUrl: fullUrls.jpeg,
    avifFullUrl: fullUrls.avif,
    // Store available widths for future reference
    widths: IMAGE_SIZES.filter(size => size < dimensions.width).concat([dimensions.width])
  };
}

// Build a gallery manifest at build time by reading src/galleries/images/*
module.exports = async () => {
  const root = path.join(__dirname, '..', 'galleries', 'images');
  const result = {};
  if (!fs.existsSync(root)) return result;
  
  for (const slug of fs.readdirSync(root)) {
    const dir = path.join(root, slug);
    try {
      const files = [];
      const fileNames = fs.readdirSync(dir)
        .filter((f) => IMAGE_EXT_RE.test(f));
      
      for (const name of fileNames) {
        const filePath = path.join(dir, name);
        let exifData = {};
        
        try {
          // Read EXIF data
          const exif = await exifr.parse(filePath, {
            camera: true,
            exposure: true,
            gps: false,
            ifd0: true,
            exif: true
          });
          
          if (exif) exifData = formatExif(exif);
        } catch (exifError) {
          // EXIF reading failed, continue without it
        }
        
        // Prefer caption from sidecar .md, else fallback to current filename-based caption
        const sidecarCaption = readCaptionFromSidecarMD(filePath);

        // Generate responsive image versions and calculate aspect ratio
        const responsive = await generateResponsiveImages(filePath, slug, name);

        files.push({
          url: `/galleries/${slug}/${name}`,
          thumb: responsive.fullUrl, // Use the processed full-size image
          alt: deriveAltFromFilename(name),
          caption: (sidecarCaption && sidecarCaption.length
            ? sidecarCaption
            : cleanCaptionFromFilename(name)),
          exif: exifData,
          responsive: responsive, // Add responsive image data
          width: responsive.width, // Store original width
          height: responsive.height, // Store original height
          aspectRatio: responsive.aspectRatio // Store pre-calculated aspect ratio
        });
      }
      
      result[slug] = files;
    } catch (e) {
      // skip non-directories
    }
  }
  return result;
};
