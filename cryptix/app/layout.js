import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { initializeApplication } from '../lib/startup.js'

// Initialize application on server startup
if (typeof window === 'undefined') {
  initializeApplication().then((success) => {
    if (success) {
      console.log('Server startup initialization completed');
    } else {
      console.error('Server startup initialization failed');
    }
  });
}

export const metadata = {
  title: "Cryptix",
  description: "A Roblox Keysystem manager.",
  keywords: "roblox, roblox scripts, scripts, grow a garden, lua, roblox key, delta key, delta executor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}