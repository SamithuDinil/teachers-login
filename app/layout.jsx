import "./globals.css";

export const metadata = {
  title: "ගුරු තොරතුරු 2026",
  description: "ගුරු තොරතුරු එකතු කිරීමේ පත්‍රිකාව"
};

export default function RootLayout({ children }) {
  return (
    <html lang="si">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Serif+Sinhala:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
