# Image Optimization

This site now uses responsive images with `srcset` and `sizes` attributes to optimize loading times, especially on slow connections. The optimization includes:

1. Automatically generating multiple sized versions of each image (400w, 800w, 1200w, 1600w, 2000w)
2. Using `srcset` and `sizes` attributes to let the browser choose the most appropriate image size
3. Using `loading="lazy"` attribute for deferred loading of off-screen images

## How It Works

1. The `galleryImages.js` data file now generates multiple sizes of each image during build
2. Images are stored in `/galleries/[gallery-name]/responsive/` with size suffixes
3. Templates use `srcset` and `sizes` to provide responsive image options to browsers
4. Original high-resolution images are still available for users with fast connections

## Benefits

- Faster initial page loads, especially on mobile and slow connections
- Reduced bandwidth usage for users with smaller screens
- Improved Core Web Vitals scores (LCP, CLS)
- Better user experience with progressive loading

## Implementation Details

- Sharp.js is used for high-quality image resizing
- Images are only resized if they're larger than the target size
- Responsive images are generated at build time to avoid runtime processing
- The lightbox shows higher resolution images when users click to enlarge
