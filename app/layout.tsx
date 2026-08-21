import type { Metadata, Viewport } from "next";
import "./globals.css";
import packageJson from "../package.json";
import { ServiceWorkerRegistration } from "./components/service-worker";
import { FocusGuard } from "./components/focus-guard";

const APP_VERSION = packageJson.version;

export const metadata: Metadata = {
  applicationName: "Cubetto",
  title: {
    default: "Cubetto",
    template: "%s · Cubetto",
  },
  description: "Liste versatili con pack riusabili: spesa, valigia e tutto il resto.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cubetto",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        {children}
        <ServiceWorkerRegistration />
        <FocusGuard />
        <div className="sr-only">Cubetto v{APP_VERSION}</div>
      </body>
    </html>
  );
}
