"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type NavigationLoadingContextValue = {
  startLoading: () => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null);

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  const value = useMemo(
    () => ({
      startLoading: () => setIsLoading(true)
    }),
    []
  );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
      {isLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-center shadow-soft">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink" />
            <div className="mt-3 text-sm font-semibold text-ink">Memuat detail analisa</div>
            <div className="mt-1 text-sm text-slate-500">Mengambil market, sentiment, news, dan scoring terbaru...</div>
          </div>
        </div>
      ) : null}
    </NavigationLoadingContext.Provider>
  );
}

export function LoadingLink({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = useContext(NavigationLoadingContext);

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        context?.startLoading();
      }}
    >
      {children}
    </Link>
  );
}
