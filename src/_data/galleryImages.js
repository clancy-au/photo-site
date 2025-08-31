const fs = require('fs');
const path = require('path');
const exifr = require('exifr');

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
        
        files.push({
          url: `/galleries/${slug}/${name}`,
          thumb: `/galleries/${slug}/${name}`,
          alt: name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''),
          caption: name
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
