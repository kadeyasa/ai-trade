import { cn } from "@/lib/utils";

type CardProps = React.ComponentPropsWithoutRef<"section">;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-soft", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      {action}
    </div>
  );
}
