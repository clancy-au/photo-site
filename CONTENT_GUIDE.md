# Content Maintainers Guide

This site is built with Eleventy and Cloudflare Pages. Most content updates are adding images, short captions, and (optionally) longer stories. Follow this guide to make safe, consistent edits without touching code.

## Where things live

- Galleries (pages): `src/galleries/*.njk` (one per gallery, e.g. `aurora.njk`)
- Gallery images (files): `src/galleries/images/<gallery-slug>/*.jpg`
- Image sidecar notes (captions/stories): `src/galleries/images/<gallery-slug>/*.jpg.md`
- Global data (auto-built): `src/_data/galleryImages.js` reads images + EXIF + sidecars

## Adding a new image

1. Save your processed image as JPEG in the correct gallery folder, for example:
   - `src/galleries/images/aurora/My-Photo.jpg`
2. Build or run the site. An empty sidecar file `My-Photo.jpg.md` will be created automatically next to the image.
3. Open `My-Photo.jpg.md` and add the first line as the caption. Anything after the first line can be a longer story.

Example sidecar file:

```
Dawn mist over Lake St Clair
The air barely moved and every sound carried across the water. I waited for the first light to break the cloud and reveal the shoreline shapes.
```

Notes:
- You may optionally include YAML front matter delimited by `---` at the top (it’s currently ignored for captions). The caption is taken from the first non-empty line after any front matter.
- Basic Markdown is fine in the story area; the first line should be plain text for a clean caption.

## How captions are chosen

For each image, the site picks the caption in this order:
1. First non-empty line of the sidecar `.jpg.md` (preferred)
2. If no sidecar or it’s empty, a filename-based caption is derived by cleaning the filename (removes extension, camera prefixes like `DSC01234-`, processing tags like `-Edit`, replaces dashes with spaces)

Alt text defaults to a cleaned filename. You can override alt later if we add support in sidecars.

## Image detail pages

Every `*.jpg.md` file is also a page at:
- `/galleries/<gallery-slug>/<filename>.jpg/`

These pages:
- Use a simple layout with a large image on top
- Show the caption (from the sidecar’s first line)
- Show EXIF data when available (camera, lens, focal length, aperture, shutter, ISO, date)
- Render the rest of the sidecar Markdown as the story body

Tip: Keep the first line short (caption), and write the longer story in paragraphs below it.

## Creating a new gallery

1. Add a new gallery page file, e.g. `src/galleries/cityscapes.njk` with this front matter:

```
---
layout: layouts/gallery.njk
title: Cityscapes
description: Urban scenes and night lights.
permalink: "/galleries/cityscapes/index.html"
---
```

2. Create a matching folder for images:
   - `src/galleries/images/cityscapes/`
3. Add images into that folder and follow the “Adding a new image” steps.

## Publishing & caching

- When deploying on Cloudflare Pages, HTML is configured to revalidate so changes should show on refresh.
- If you still see an older version on your device, try a hard refresh, or purge cache in the Cloudflare dashboard.

## Quality checklist before commit

- Filenames are descriptive, use dashes (e.g., `Flinders-Aurora-Reflection.jpg`)
- Large images are exported reasonably (e.g., 2000–3000px long edge)
- The sidecar `.jpg.md` exists; the first line is a clean caption
- Longer story paragraphs are optional but encouraged

## Troubleshooting

- No caption showing? Ensure the `.jpg.md` file has a non-empty first line (not inside `---` front matter).
- Page shows outdated content? Purge Cloudflare cache or wait a minute; check in a non-private tab.
- EXIF missing? Some exports strip metadata; that’s okay—caption and story still work.

If you’re unsure, commit your changes and open the site preview. You can always edit the `.jpg.md` later to fix captions or stories.
