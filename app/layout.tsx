import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import TopNav from "../components/Topnav";
const inter = Inter({ subsets: ["latin"] });
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: "AutoParcel",
  description: "Created with love",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <TopNav />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
