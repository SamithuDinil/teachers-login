import { Noto_Sans_Sinhala, Noto_Serif_Sinhala } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_Sinhala({ subsets: ["sinhala", "latin"], variable: "--font-sans", display: "swap" });
const serif = Noto_Serif_Sinhala({ subsets: ["sinhala", "latin"], variable: "--font-serif", display: "swap" });

export const metadata = {
  title: "ගුරු තොරතුරු 2026",
  description: "ගුරු තොරතුරු එකතු කිරීමේ පත්‍රිකාව"
};

export default function RootLayout({ children }) {
  return (
    <html lang="si" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
