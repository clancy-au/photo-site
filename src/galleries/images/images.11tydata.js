const path = require('path');

module.exports = {
  layout: 'layouts/image.njk',
  eleventyComputed: {
    // Title from caption if we can match this image in galleryImages; fallback to file stem
    title: (data) => {
      const stem = data.page.filePathStem; // e.g. /src/galleries/images/aurora/DSC0001.jpg
      // derive site URL used by galleryImages entries
      const url = stem.replace(/^\/src\//, '').replace('/galleries/images', '/galleries');
      const galleries = data.galleryImages || {};
      for (const key of Object.keys(galleries)) {
        const arr = galleries[key] || [];
        const found = arr.find((r) => r.url === url);
        if (found && found.caption) return found.caption;
      }
      return path.basename(stem).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    }
  }
};
