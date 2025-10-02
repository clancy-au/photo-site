const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");

// Image generation function for card grid images
async function generateCardGridImage(src, alt, className = "") {
  // Fix the image path - make it relative to project root
  const inputDir = "./src";
  const sourcePath = path.join(process.cwd(), inputDir, src);
  
  let metadata = await Image(sourcePath, {
    widths: [275, 400, 550, 800],
    formats: ["avif", "jpeg"],
    outputDir: "./_site/img/",
    urlPath: "/img/",
    filenameFormat: function(id, src, width, format) {
      // Create a more meaningful filename based on the original
      const name = path.basename(src, path.extname(src));
      return `${name}-${width}w.${format}`;
    },
    sharpOptions: {
      animated: false
    }
  });

  let imageAttributes = {
    alt,
    class: className,
    loading: "lazy",
    decoding: "async",
    sizes: "(max-width: 600px) 400px, 275px"
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function(eleventyConfig){
  // Create responsive image directories
  const outputBase = path.join(__dirname, "_site");
  
  // Create directories for responsive images if they don't exist
  eleventyConfig.on("eleventy.before", () => {
    const dirs = [
      path.join(outputBase, "galleries"),
      path.join(outputBase, "images", "hero", "responsive")
    ];
    
    // Ensure directories exist
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  eleventyConfig.addPassthroughCopy({"src/assets":"assets"});
  eleventyConfig.addPassthroughCopy({"src/images":"images"});
  // Copy gallery images from the new nested location to /galleries in the site
  eleventyConfig.addPassthroughCopy({"src/galleries/images":"galleries"});

  // Add a date filter for Nunjucks
  eleventyConfig.addFilter("date", (value, format="yyyy") => {
    var dt;
    if (value === "now" || value === undefined || value === null) {
      dt = DateTime.now();
    } else if (value instanceof Date) {
      dt = DateTime.fromJSDate(value);
    } else if (typeof value === "number") {
      // milliseconds since epoch
      dt = DateTime.fromMillis(value);
    } else {
      // try ISO (e.g. "2025-08-30T12:00:00Z" or "2025-08-30")
      dt = DateTime.fromISO(String(value));
    }
    return dt.toFormat(format);
  });
  
  // Add a regex match filter for file processing
  eleventyConfig.addFilter("match", (value, pattern) => {
    if (!value || typeof value !== 'string') return '';
    const regex = new RegExp(pattern);
    const matches = value.match(regex);
    return matches ? matches[0] : '';
  });
  
  // Add a regex replace filter for file processing
  eleventyConfig.addFilter("replace", (value, pattern, replacement) => {
    if (!value || typeof value !== 'string') return '';
    const regex = new RegExp(pattern);
    return value.replace(regex, replacement);
  });

  // Add the image shortcode for use in templates
  eleventyConfig.addAsyncShortcode("cardImage", generateCardGridImage);

  // A helper to list files in a gallery subfolder (usable from Nunjucks via page.data.images if needed)
  // We keep Eleventy config minimal; gallery pages can inject images in front matter or use this pattern later via a data cascade.

  return { dir:{ input:"src", output:"_site", includes:"_includes" }, htmlTemplateEngine:"njk", markdownTemplateEngine:"njk" };
};
