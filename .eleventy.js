const { DateTime } = require("luxon");
module.exports = function(eleventyConfig){
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

  // A helper to list files in a gallery subfolder (usable from Nunjucks via page.data.images if needed)
  // We keep Eleventy config minimal; gallery pages can inject images in front matter or use this pattern later via a data cascade.

  return { dir:{ input:"src", output:"_site", includes:"_includes" }, htmlTemplateEngine:"njk", markdownTemplateEngine:"njk" };
};
