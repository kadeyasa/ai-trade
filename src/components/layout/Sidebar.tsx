import Link from "next/link";
import { Activity, Coins, Newspaper, Settings, ShieldAlert, Signal, Users } from "lucide-react";

const items = [
  { href: "/", label: "List Coin", icon: Coins },
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/dashboard#social", label: "Social", icon: Users },
  { href: "/dashboard#news", label: "News", icon: Newspaper },
  { href: "/dashboard#prediction", label: "Signals", icon: Signal },
  { href: "/dashboard#risk", label: "Risk", icon: ShieldAlert },
  { href: "/admin", label: "Admin", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
      <div className="text-lg font-semibold text-ink">Crypto Intel</div>
      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
