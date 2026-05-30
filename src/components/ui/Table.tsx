export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-slate-200"><table className="w-full text-left text-sm">{children}</table></div>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-600">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-t border-slate-100 px-4 py-3 text-slate-700">{children}</td>;
}
