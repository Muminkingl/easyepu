import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyEPU",
  description: "A modern platform for EPU students to stay updated with the latest campus announcements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // layout.tsx - update ClerkProvider
<ClerkProvider
  appearance={{
    elements: {
      formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case",
      footerActionLink: "text-indigo-600 hover:text-indigo-500"
    }
  }}
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  signInFallbackRedirectUrl="/dashboard"
  signUpFallbackRedirectUrl="/dashboard"
>
  <html suppressHydrationWarning>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <Navbar />
      {children}
      <Footer />
    </body>
  </html>
</ClerkProvider>
  );
}