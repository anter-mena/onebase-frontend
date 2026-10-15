import type { MetadataRoute } from "next";

// A private backoffice: search engines stay out of every page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
