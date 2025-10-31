import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduHens",
  description: "Educational platform with Happy Hens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/iqd5xvb.css" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'helvetica-neue, sans-serif' }} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
