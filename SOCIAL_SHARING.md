# Social Shar### How It Works

### Base Template Implementation

The Open Graph tags are implemented in the `src/_includes/layouts/base.njk` template. The code looks for specific variables in this order:

1. Page-specific variables (title, description, featured_image)
2. Gallery-specific images (first image in a gallery)
   - Note: Gallery image paths are corrected to add the 'images' directory in the path
3. Default site values (site.title, site.tagline)mentation

This document describes how the Open Graph and Twitter Card meta tags are implemented in the Clancy Malcolm Photography website.

## Overview

Open Graph meta tags help control how your website appears when shared on social media platforms like Facebook, LinkedIn, and Twitter. The implementation adds tags for:

- Page title
- Page description 
- Page URL
- Featured image

## How It Works

### Base Template Implementation

The Open Graph tags are implemented in the `src/_includes/layouts/base.njk` template. The code looks for specific variables in this order:

1. Page-specific variables (title, description, featured_image)
2. Gallery-specific images (first image in a gallery)  
3. Default site values (site.title, site.tagline)

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="{{ site.url }}{{ page.url }}">
<meta property="og:title" content="{{ title or site.title }}">
<meta property="og:description" content="{{ description or site.tagline }}">
{%- if featured_image -%}
  <meta property="og:image" content="{{ site.url }}{{ featured_image }}">
{%- elif gallery and gallery.length -%}
  {# Fix URL path - gallery URLs from galleryImages.js are missing /images/ directory #}
  {% set galleryImage = gallery[0].url | replace('/galleries/', '/galleries/images/') %}
  <meta property="og:image" content="{{ site.url }}{{ galleryImage }}">
{%- else -%}
  <meta property="og:image" content="{{ site.url }}/images/covers/site-default.jpg">
{%- endif -%}

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="{{ site.url }}{{ page.url }}">
<meta name="twitter:title" content="{{ title or site.title }}">
<meta name="twitter:description" content="{{ description or site.tagline }}">
{%- if featured_image -%}
  <meta name="twitter:image" content="{{ site.url }}{{ featured_image }}">
{%- elif gallery and gallery.length -%}
  {# Fix URL path - gallery URLs from galleryImages.js are missing /images/ directory #}
  {% set galleryImage = gallery[0].url | replace('/galleries/', '/galleries/images/') %}
  <meta name="twitter:image" content="{{ site.url }}{{ galleryImage }}">
{%- else -%}
  <meta name="twitter:image" content="{{ site.url }}/images/covers/site-default.jpg">
{%- endif -%}
```

### How to Set Page-Specific Values

To set page-specific Open Graph values, add the following to a page's frontmatter:

```yaml
---
title: Your Page Title
description: Your page description
featured_image: /path/to/image.jpg
---
```

### Default Images

A default image is set at `/src/images/covers/site-default.jpg` that will be used for any page that doesn't have a specific featured image or isn't a gallery.

### Site Configuration

The site's base URL is defined in `src/_data/site.json`:

```json
{
  "url": "https://clancymalcolm.com.au"
}
```

This ensures all Open Graph URLs and images use absolute URLs.

## Testing Social Sharing

You can test how your pages appear when shared on social media using these tools:

- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Best Practices

1. Always use high-quality, properly sized images (recommended 1200×630 pixels for best results)
2. Keep titles under 60-70 characters
3. Keep descriptions concise (around 155-160 characters)
4. Update featured images for important content regularly
