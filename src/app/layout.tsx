import type { Metadata } from "next";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Intelligence Dashboard",
  description: "Probabilistic intelligence dashboard for a DEX-only cryptocurrency token."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={children}>
          <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
