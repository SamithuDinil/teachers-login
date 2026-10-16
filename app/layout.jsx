import "./globals.css";

export const metadata = {
  title: "අධ්‍යයන / අනධ්‍යයන තොරතුරු 2026 | ශ්‍රී සුමංගල විද්‍යාලය",
  description: "ශ්‍රී සුමංගල විද්‍යාලය - අධ්‍යයන / අනධ්‍යයන තොරතුරු පත්‍රිකාව"
};

export const viewport = {
  themeColor: "#0a1020"
};

export default function RootLayout({ children }) {
  return (
    <html lang="si">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Serif+Sinhala:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
