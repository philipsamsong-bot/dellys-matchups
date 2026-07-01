// src/app/sitemap.js

export default function sitemap() {
    const baseUrl = "https://dellysmatchups.org";
  
    const routes = [
      "",
      "/about/platform",
      "/about/founder",
      "/about/academy",
      "/about/academy/module-1",
      "/about/academy/module-2",
      "/about/academy/module-3",
      "/about/academy/module-4",
      "/about/academy/module-5",
      "/about/academy/module-6",
      "/about/academy/module-7",
      "/academy/learn/module-1",
      "/academy/learn/module-2",
      "/academy/learn/module-3",
      "/academy/learn/module-4",
      "/academy/learn/module-5",
      "/academy/learn/module-6",
      "/academy/learn/module-7",
      "/articles",
      "/blog/articles",
      "/blog/exceptional-cases",
      "/blog/gallery",
      "/contact",
      "/counselling",
      "/counselling/book",
      "/counselling/coaching",
      "/counselling/healing",
      "/counselling/marital",
      "/counselling/premarital",
      "/counselling/purpose",
      "/matchups",
      "/privacy",
      "/shop/audio",
      "/shop/books",
      "/shop/books/adventures-of-delphine",
      "/shop/books/diary-of-a-special-mum",
      "/shop/books/ido-idont",
      "/shop/ebooks",
      "/shop/merch",
      "/support",
      "/support/donations",
      "/support/partner",
      "/support/testimonial",
      "/terms",
      "/testimonials",
    ];
  
    return routes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: route === "" ? 1 : 0.8,
    }));
  }
  