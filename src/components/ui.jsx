import React from "react";
import {
  CircleDashed, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";

const STATUS_STYLE = {
  "Não iniciada": { badge: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleDashed },
  "Em andamento": { badge: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock },
  "Concluída":    { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
  "Atrasada":     { badge: "bg-rose-50 text-rose-700 ring-rose-200", Icon: AlertTriangle },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE["Não iniciada"];
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.badge}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

const TONE = {
  slate: "text-slate-900",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  blue: "text-blue-700",
};

export function Metric({ label, value, hint, tone = "slate" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${TONE[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium ${active ? "border-blue-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}
