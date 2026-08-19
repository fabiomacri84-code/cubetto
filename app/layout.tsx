import type { Metadata, Viewport } from "next";
import "./globals.css";
import packageJson from "../package.json";

const APP_VERSION = packageJson.version;

export const metadata: Metadata = {
  applicationName: "Cubetto",
  title: {
    default: "Cubetto",
    template: "%s · Cubetto",
  },
  description: "Liste versatili con pack riusabili: spesa, valigia, e tutto il resto.",
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
        <div className="sr-only">Cubetto v{APP_VERSION}</div>
      </body>
    </html>
  );
}
