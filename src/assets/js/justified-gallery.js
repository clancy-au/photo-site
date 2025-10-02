/**
 * Justified Gallery - Flickr-style image gallery layout
 * Enhanced with pre-calculated aspect ratios
 */
document.addEventListener('DOMContentLoaded', function() {
  const justifiedGallery = document.querySelector('.justified-gallery');
  if (!justifiedGallery) return;

  const targetRowHeight = 500; // Target height for each row in pixels
  let containerWidth = justifiedGallery.offsetWidth;
  const spacing = 15; // Gap between images in pixels
  
  // Save the original HTML to preserve the content
  const originalHTML = justifiedGallery.innerHTML;
  
  // Clear the gallery
  justifiedGallery.innerHTML = '';
  
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'justified-gallery-loading';
  loadingIndicator.setAttribute('role', 'status');
  loadingIndicator.setAttribute('aria-live', 'polite');
  loadingIndicator.innerHTML = '<span class="jg-spinner" aria-hidden="true"></span><span class="jg-text">Organizing gallery…</span>';
  justifiedGallery.appendChild(loadingIndicator);
  
  // Parse the original gallery items to extract pre-calculated dimensions
  const originalItems = new DOMParser().parseFromString(originalHTML, 'text/html').querySelectorAll('li');
  
  // Create array to hold image data with dimensions from data attributes
  let imageData = [];
  
  // Collect image data from data attributes
  originalItems.forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    
    // Extract dimensions from data attributes
    const width = parseInt(link.getAttribute('data-width'), 10);
    const height = parseInt(link.getAttribute('data-height'), 10);
    const aspectRatio = parseFloat(link.getAttribute('data-aspect-ratio')) || (width / height);
    
    // Collect all data attributes to preserve them
    const dataAttrs = {};
    Array.from(link.attributes).forEach(attr => {
      dataAttrs[attr.name] = attr.value;
    });
    
    // Extract image URLs from data attributes
    const src = link.getAttribute('data-src') || '';
    const thumb = link.getAttribute('data-thumb') || src;
    const srcset = link.getAttribute('data-srcset') || '';
    const avifSrcset = link.getAttribute('data-avif-srcset') || '';
    const alt = link.getAttribute('data-alt') || '';
    
    imageData.push({
      src: src,
      thumb: thumb,
      srcset: srcset,
      avifSrcset: avifSrcset,
      width: width || 800, // fallback if not provided
      height: height || 600, // fallback if not provided
      aspectRatio: aspectRatio || (4/3), // fallback if not provided
      alt: alt,
      dataAttrs
    });
  });
  
  // Immediately organize images since we already have the dimensions
  organizeImagesIntoRows();
  
  // Function to organize images into rows using pre-calculated dimensions
  function organizeImagesIntoRows() {
    // Remove loading indicator
    const loadingIndicator = justifiedGallery.querySelector('.justified-gallery-loading');
    if (loadingIndicator) {
      justifiedGallery.removeChild(loadingIndicator);
    }
    
    // Update container width in case it changed
    const containerWidth = justifiedGallery.offsetWidth;
    
    let currentRow = [];
    let currentRowWidth = 0;
    
    // Function to create a row from current images
    function createRow(images, isLastRow = false) {
      const row = document.createElement('div');
      row.className = 'justified-gallery-row';
      
      let rowWidth = 0;
      for (let img of images) {
        // Use pre-calculated aspect ratio directly
        rowWidth += img.aspectRatio * targetRowHeight + spacing;
      }
      rowWidth -= spacing; // Remove extra spacing
      
      // Scale factor to fit the row exactly to container width
      let scaleFactor = containerWidth / rowWidth;
      
      // If it's the last row and not enough images to fill it properly, don't scale up too much
      if (isLastRow && scaleFactor > 1.2) {
        scaleFactor = 1;
      } else if (scaleFactor > 1.5) {
        // Limit maximum scaling to avoid too tall rows
        scaleFactor = 1.5;
      }
      
      const rowHeight = targetRowHeight * scaleFactor;
      
      for (let imgData of images) {
        const item = document.createElement('div');
        item.className = 'justified-gallery-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'lightbox-trigger';
        
        // Copy all data attributes from original link
        for (const [key, value] of Object.entries(imgData.dataAttrs)) {
          link.setAttribute(key, value);
        }
        
        // Set width based on pre-calculated aspect ratio and row height
        const itemWidth = imgData.aspectRatio * rowHeight;
        item.style.width = `${itemWidth}px`;
        
        // Generate image content
        // Check if AVIF support is available
        if (imgData.avifSrcset) {
          // Create a picture element with AVIF and JPEG sources
          const picture = document.createElement('picture');
          
          // AVIF source
          const avifSource = document.createElement('source');
          avifSource.setAttribute('type', 'image/avif');
          avifSource.setAttribute('srcset', imgData.avifSrcset);
          // Use the calculated width for sizes instead of the data attribute
          avifSource.setAttribute('sizes', `${Math.round(itemWidth)}px`);
          picture.appendChild(avifSource);
          
          // JPEG source
          const jpegSource = document.createElement('source');
          jpegSource.setAttribute('type', 'image/jpeg');
          jpegSource.setAttribute('srcset', imgData.srcset);
          // Use the calculated width for sizes instead of the data attribute
          jpegSource.setAttribute('sizes', `${Math.round(itemWidth)}px`);
          picture.appendChild(jpegSource);
          
          // Fallback img
          const img = document.createElement('img');
          img.src = imgData.thumb || imgData.src;
          img.alt = imgData.alt || '';
          img.width = imgData.width;
          img.height = imgData.height;
          img.setAttribute('loading', 'lazy');
          
          picture.appendChild(img);
          link.appendChild(picture);
        } else {
          // Create a simple img element
          const img = document.createElement('img');
          img.src = imgData.thumb || imgData.src;
          img.alt = imgData.alt || '';
          
          if (imgData.srcset) {
            img.setAttribute('srcset', imgData.srcset);
            // Use the calculated width for sizes instead of the data attribute
            img.setAttribute('sizes', `${Math.round(itemWidth)}px`);
          }
          
          img.width = imgData.width;
          img.height = imgData.height;
          img.setAttribute('loading', 'lazy');
          
          link.appendChild(img);
        }
        
        // Add caption if available
        const caption = imgData.dataAttrs['data-caption'];
        if (caption) {
          const captionEl = document.createElement('div');
          captionEl.className = 'justified-gallery-caption';
          captionEl.textContent = caption;
          link.appendChild(captionEl);
        }
        
        item.appendChild(link);
        row.appendChild(item);
      }
      
      row.style.height = `${rowHeight}px`;
      return row;
    }
    
    // Process images and create rows
    for (let i = 0; i < imageData.length; i++) {
      const imgData = imageData[i];
      
      // Calculate how much width this image would take in current row
      const imgWidth = imgData.width * (targetRowHeight / imgData.height);
      
      // Add to current row
      currentRow.push(imgData);
      currentRowWidth += imgWidth + spacing;
      
      // If row is wide enough or this is the last image, create the row
      if (currentRowWidth - spacing >= containerWidth || i === imageData.length - 1) {
        const isLastRow = i === imageData.length - 1;
        const row = createRow(currentRow, isLastRow);
        justifiedGallery.appendChild(row);
        currentRow = [];
        currentRowWidth = 0;
      }
    }
  }
  
  // Since we already have the dimensions from data attributes,
  // we can organize the gallery immediately without loading images
  // This is the key change - we no longer wait for images to load
  // to calculate dimensions
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // Recalculate container width
      const newContainerWidth = justifiedGallery.offsetWidth;
      if (containerWidth !== newContainerWidth) {
        // Update the stored container width
        containerWidth = newContainerWidth;
        
        // Only reorganize if width changed
        justifiedGallery.innerHTML = '';
        // Add loading indicator during resize
        const resizeIndicator = document.createElement('div');
        resizeIndicator.className = 'justified-gallery-loading';
        resizeIndicator.setAttribute('role', 'status');
        resizeIndicator.setAttribute('aria-live', 'polite');
        resizeIndicator.innerHTML = '<span class="jg-spinner" aria-hidden="true"></span><span class="jg-text">Adjusting layout…</span>';
        justifiedGallery.appendChild(resizeIndicator);
        
        // Small delay to allow transition to show
        setTimeout(function() {
          organizeImagesIntoRows();
        }, 50);
      }
    }, 200);
  });
  
  // Mark the gallery as ready
  justifiedGallery.setAttribute('data-ready', 'true');
});
