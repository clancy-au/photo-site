# Clancy Malcolm Photography - Eleventy Site Structure

## Overview
This is an Eleventy (11ty) static site generator project for a photography portfolio website. It features a dark theme with image galleries, a journal/blog, and automatic image processing.

## Key Architecture

### Build System
- **Framework**: Eleventy 3.1.2 with Nunjucks templating
- **Build Commands**: 
  - `npm run dev` - development server with live reload
  - `npm run build` - production build
- **Config**: `.eleventy.js` handles asset copying, date filters, and template engine setup

### Directory Structure

#### Source (`src/`)
- **Templates**: `.njk` files for pages (index, about, contact, galleries, journal)
- **Data**: `src/_data/` contains site config, gallery metadata, and dynamic image loading
- **Layouts**: `src/_includes/layouts/` with base template and gallery template
- **Partials**: `src/_includes/partials/` for reusable components (hero carousel)
- **Content**: Markdown files for about page and journal posts
- **Assets**: CSS and images organized by type

#### Output (`_site/`)
Generated static site with processed templates and copied assets

### Key Features

#### Gallery System
- **Data Sources**: 
  - `galleries.json` - gallery metadata (slug, title, description)
  - `galleryImages.js` - dynamically reads image files from filesystem
- **Image Organization**: `src/galleries/images/{slug}/` folders auto-populate galleries
- **Templates**: `gallery.njk` layout renders image grids with lightbox links

#### Hero Carousel
- **Implementation**: `partials/hero.njk` with vanilla JS slideshow
- **Images**: Defined in page front matter (`heroImages` array)
- **Styling**: CSS transitions and responsive aspect ratio container

#### Journal/Blog
- **Posts**: Markdown files in `src/journal/posts/`
- **Config**: `_posts.json` sets layout and tags
- **Pagination**: `journal/index.njk` lists posts with pagination support

#### Styling
- **Theme**: Dark photography-focused design in `styles.css`
- **Layout**: Responsive grid systems for galleries and cards
- **Effects**: Hover animations, backdrop filters, and smooth transitions

### Data Flow
1. **Build Time**: `galleryImages.js` scans filesystem for images
2. **Template Processing**: Nunjucks templates access data via `galleries` and `galleryImages` globals
3. **Asset Copying**: Images and CSS copied to output directory
4. **URL Generation**: Pretty URLs with trailing slashes for all pages

### Navigation Structure
- **Main Nav**: Home → Galleries → About → Contact
- **Gallery Pages**: Auto-generated from `galleries.json` metadata
- **Journal**: Paginated post listings with individual post pages

This structure allows for easy content management by simply adding images to gallery folders and markdown files for journal posts, while maintaining a clean separation between content, templates, and styling.
