import { useEffect, useState } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
type Variant = "primary" | "secondary" | "danger";
const btnCls = (v: Variant, small?: boolean, extra?: string) => cx(
  "inline-grid place-items-center rounded-xl border-2 font-semibold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
  small ? "min-h-10 px-3 text-sm" : "min-h-12 px-4",
  v === "primary" && "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
  v === "secondary" && "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  v === "danger" && "border-red-700 bg-white text-red-700 hover:bg-red-50", extra);

/* ===== 4 componentes base ===== */
export function Button({ variant = "secondary", small, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  return <button type="button" {...p} className={btnCls(variant, small, className)} />;
}
export function LinkButton({ variant = "secondary", small, className, ...p }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; small?: boolean }) {
  return <a {...p} className={btnCls(variant, small, className)} />;
}
const field = "min-h-12 w-full rounded-xl border-2 bg-white px-4 font-normal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-semibold">{label}</label>
      {children}
      {hint && <span id={id + "-h"} className="text-sm text-slate-600">{hint}</span>}
      {error && <span id={id + "-e"} className="text-sm font-semibold text-red-700">{error}</span>}
    </div>
  );
}
export function Input({ label, hint, error, id, ...p }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string; error?: string }) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input id={id} aria-invalid={!!error} aria-describedby={[hint && id + "-h", error && id + "-e"].filter(Boolean).join(" ") || undefined}
        className={cx(field, error ? "border-red-700" : "border-slate-300")} {...p} />
    </Field>
  );
}
export function Select({ label, id, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { id: string; label: string }) {
  return <Field id={id} label={label}><select id={id} className={cx(field, "border-slate-300")} {...p}>{children}</select></Field>;
}
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx("rounded-xl border border-slate-200 bg-white p-4", className)} />;
}
export function Badge({ tone, children }: { tone: "ok" | "off" | "no"; children: ReactNode }) {
  const t = { ok: "text-emerald-700", off: "text-slate-600", no: "text-red-700" }[tone];
  return <span className={cx("inline-block rounded-full border-[1.5px] border-current px-2.5 py-0.5 text-sm font-bold", t)}>{children}</span>;
}

/* ===== Estados de UI ===== */
export function Loading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 8000); return () => clearTimeout(t); }, []);
  return (
    <div role="status" className="grid gap-3">
      <div className="h-20 animate-pulse rounded-xl bg-slate-200" /><div className="h-20 animate-pulse rounded-xl bg-slate-200" />
      <p className="text-slate-600">{slow ? "Está demorando mais que o normal. Verifique sua conexão." : "Carregando…"}</p>
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-600"><strong className="mb-1 block text-xl text-slate-900">{title}</strong>{children}</div>;
}
export function ErrorBox({ onRetry, children }: { onRetry?: () => void; children: ReactNode }) {
  return (
    <div role="alert" className="grid gap-3 rounded-xl border-2 border-red-700 bg-red-50 p-4 font-semibold text-red-800">
      <p>{children}</p>{onRetry && <Button onClick={onRetry} className="justify-self-start">Tentar de novo</Button>}
    </div>
  );
}
export function Header({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="pb-4 pt-6">
      <h1 tabIndex={-1} className="text-3xl font-extrabold tracking-tight focus:outline-none">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-600">{sub}</p>}
    </header>
  );
}
