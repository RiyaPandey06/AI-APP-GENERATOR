import { clsx } from "@/lib/clsx";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const { className, variant = "primary", ...rest } = props;
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-leaf text-white hover:bg-[#24563f]",
        variant === "ghost" && "border border-[#cbd8d0] bg-white text-ink hover:bg-mint",
        variant === "danger" && "bg-coral text-white hover:bg-[#d85847]",
        className
      )}
      {...rest}
    />
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={clsx("rounded-lg border border-[#dce4de] bg-white p-4 shadow-sm", className)} {...props} />;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-[#5b6c65]">{children}</label>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="h-10 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-leaf" {...props} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-10 w-full rounded-md border border-[#cbd8d0] bg-white px-3 text-sm outline-none focus:border-leaf" {...props} />;
}
