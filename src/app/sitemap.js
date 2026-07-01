export default function sitemap() {
    const baseUrl = "https://dellysmatchups.org";
  
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        priority: 0.9,
      },
      {
        url: `${baseUrl}/matchups`,
        lastModified: new Date(),
        priority: 0.9,
      },
      {
        url: `${baseUrl}/academy`,
        lastModified: new Date(),
        priority: 0.8,
      },
      {
        url: `${baseUrl}/counselling`,
        lastModified: new Date(),
        priority: 0.8,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        priority: 0.8,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        priority: 0.7,
      },
    ];
  }
  