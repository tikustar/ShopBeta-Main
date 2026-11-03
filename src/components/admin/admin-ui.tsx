import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        <span className="mb-2 block h-1 w-10 rounded-full bg-accent" aria-hidden />
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  secondaryValue,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  secondaryValue?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,27,22,0.04)] transition-shadow hover:sb-shadow-soft sm:p-5",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-primary-800">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-muted">{hint}</p> : null}
      {secondaryValue ? (
        <p className="absolute top-4 right-4 text-[11px] font-medium text-muted">
          {secondaryValue}
        </p>
      ) : null}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,22,0.04)]">
      <table className="min-w-full text-left text-sm [&_tbody_tr:hover]:bg-primary-50/40 [&_tbody_tr]:transition-colors">
        <thead className="border-b border-line bg-primary-50/60 text-[11px] uppercase tracking-[0.08em] text-primary-700">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-12 text-center">
      <span className="mx-auto mb-3 block h-1.5 w-8 rounded-full bg-accent" aria-hidden />
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-[13px] text-muted">{description}</p>
      ) : null}
    </div>
  );
}
