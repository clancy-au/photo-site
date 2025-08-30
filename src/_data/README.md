Data files loaded into templates:

- galleries.json: array of gallery metadata (slug, title, description)
- galleryImages.js: object mapping slug -> array of image objects { url, thumb, alt }

Templates:
- `src/galleries/index.njk` iterates over `galleries` to render cards
- `src/_includes/layouts/gallery.njk` renders a gallery page and reads `galleryImages[slug]`
