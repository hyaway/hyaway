export function MetadataList({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground font-medium select-all">
            {row.label}
          </dt>
          <dd className="select-all">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
