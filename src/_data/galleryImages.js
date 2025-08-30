const fs = require('fs');
const path = require('path');

// Build a gallery manifest at build time by reading src/galleries/images/*
module.exports = () => {
  const root = path.join(__dirname, '..', 'galleries', 'images');
  const result = {};
  if (!fs.existsSync(root)) return result;
  for (const slug of fs.readdirSync(root)) {
    const dir = path.join(root, slug);
    try {
      const files = fs.readdirSync(dir)
        .filter(f => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
        .map(name => ({
          url: `/galleries/${slug}/${name}`,
          thumb: `/galleries/${slug}/${name}`,
          alt: name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')
        }));
      result[slug] = files;
    } catch (e) {
      // skip non-directories
    }
  }
  return result;
};
