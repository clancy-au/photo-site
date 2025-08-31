const fs = require('fs');
const path = require('path');
const exifr = require('exifr');

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
        .filter(f => /\.(jpe?g|png|webp|avif|gif)$/i.test(f));
      
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
          
          if (exif) {
            exifData = {
              camera: exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : null,
              lens: exif.LensModel || null,
              focalLength: exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : null,
              aperture: exif.FNumber ? `f/${exif.FNumber}` : null,
              shutterSpeed: exif.ExposureTime ? (exif.ExposureTime >= 1 ? `${exif.ExposureTime}s` : `1/${Math.round(1/exif.ExposureTime)}s`) : null,
              iso: exif.ISO || null,
              dateTime: exif.DateTimeOriginal || exif.DateTime ? 
                new Date(exif.DateTimeOriginal || exif.DateTime).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : null
            };
          }
        } catch (exifError) {
          // EXIF reading failed, continue without it
        }
        
        // Prefer caption from sidecar .md, else fallback to current filename-based caption
        const sidecarCaption = readCaptionFromSidecarMD(filePath);

        files.push({
          url: `/galleries/${slug}/${name}`,
          thumb: `/galleries/${slug}/${name}`,
          alt: name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''),
          caption: (sidecarCaption && sidecarCaption.length ? sidecarCaption : name)
            .replace(/\.[^.]+$/, '') // Remove extension
            .replace(/^[A-Z]{3}\d+[-_]*/i, '') // Remove camera file prefix like DSC01234-
            .replace(/[-_](Enhanced|Edit|Export|Pano)[-_]*/gi, ' ') // Remove processing tags
            .replace(/[-_]+/g, ' ') // Replace dashes/underscores with spaces
            .replace(/\s+/g, ' ') // Normalize multiple spaces
            .trim(),
          exif: exifData
        });
      }
      
      result[slug] = files;
    } catch (e) {
      // skip non-directories
    }
  }
  return result;
};
