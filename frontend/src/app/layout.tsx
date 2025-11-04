import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./authcomponents/authProvider";//for the auth0


export const metadata: Metadata = {
  title: "EduHens",
  description: "Educational platform with Happy Hens",
};
//new code to use real auth0
export default function RootLayout({children }: { children: React.ReactNode })
{ 
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/iqd5xvb.css" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'helvetica-neue, sans-serif' }} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
//old code below
/*
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
}*/
