/**
 * Justified Gallery - Flickr-style image gallery layout
 */
document.addEventListener('DOMContentLoaded', function() {
  const justifiedGallery = document.querySelector('.justified-gallery');
  if (!justifiedGallery) return;

  const images = Array.from(justifiedGallery.querySelectorAll('img'));
  const targetRowHeight = 500; // Target height for each row in pixels
  let containerWidth = justifiedGallery.offsetWidth;
  const spacing = 15; // Gap between images in pixels
  
  // Clear the gallery
  justifiedGallery.innerHTML = '';
  
  // Create array to hold image data with dimensions
  let imageData = [];
  let loadedCount = 0;
  
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'justified-gallery-loading';
  loadingIndicator.setAttribute('role', 'status');
  loadingIndicator.setAttribute('aria-live', 'polite');
  loadingIndicator.innerHTML = '<span class="jg-spinner" aria-hidden="true"></span><span class="jg-text">Loading gallery…</span>';
  justifiedGallery.appendChild(loadingIndicator);
  
  // Function to organize images into rows once all are loaded
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
        rowWidth += img.width * (targetRowHeight / img.height) + spacing;
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
        for (let attr of imgData.linkAttrs) {
          link.setAttribute(attr.name, attr.value);
        }
        
        // Ensure required data attributes are explicitly set for lightbox functionality
        if (imgData.fullSrc) {
          link.setAttribute('data-src', imgData.fullSrc);
        }
        
        // Make sure caption is set
        if (imgData.caption) {
          link.setAttribute('data-caption', imgData.caption);
        }
        
        const img = document.createElement('img');
        img.src = imgData.src;
        img.alt = imgData.alt || '';
        
        // Set width based on aspect ratio and row height
        const itemWidth = (imgData.width / imgData.height) * rowHeight;
        item.style.width = `${itemWidth}px`;
        
        link.appendChild(img);
        
        // Add caption if available
        const caption = imgData.caption;
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
  
  // Load each image to get its dimensions
  images.forEach(img => {
    // Get original link and its data attributes
    const originalLink = img.closest('a');
    const linkAttrs = originalLink ? Array.from(originalLink.attributes).map(attr => {
      return { name: attr.name, value: attr.value };
    }) : [];
    
    // Create new image to get dimensions
    const tempImg = new Image();
    tempImg.onload = function() {
      // Get the actual image URL for the lightbox (full size image)
      const imageSrc = originalLink ? (originalLink.getAttribute('data-src') || img.src) : img.src;
      
      const data = {
        src: img.src,
        fullSrc: imageSrc, // The full size image for lightbox
        width: tempImg.width,
        height: tempImg.height,
        alt: img.alt,
        caption: originalLink ? originalLink.getAttribute('data-caption') : '',
        linkAttrs: linkAttrs
      };
      imageData.push(data);
      
      loadedCount++;
      if (loadedCount === images.length) {
        organizeImagesIntoRows();
      }
    };
    
    tempImg.onerror = function() {
      // In case image fails to load, still count it
      loadedCount++;
      if (loadedCount === images.length) {
        organizeImagesIntoRows();
      }
    };
    
    tempImg.src = img.src;
  });
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // Recalculate container width
      const newContainerWidth = justifiedGallery.offsetWidth;
      if (containerWidth !== newContainerWidth) {
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
});
