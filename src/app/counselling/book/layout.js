// src/app/counselling/book/layout.js

export const metadata = {
    title: "Book Counselling | Delly's Matchups",
    description:
      "Book a counselling, mentoring, coaching, or relationship guidance session with Delly's Matchups.",
    alternates: {
      canonical: "https://www.dellysmatchups.org/counselling/book",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
  
  export default function CounsellingBookingLayout({ children }) {
    return children;
  }
  