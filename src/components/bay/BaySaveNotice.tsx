/** Always-visible Save block. Lives outside the scroll area so gloves can read it. */
export function BaySaveNotice({
  title,
  details,
}: {
  title: string | null;
  details?: string[];
}) {
  if (!title && (!details || details.length === 0)) return null;
  return (
    <div
      data-testid="bay-save-notice"
      role="alert"
      className="shrink-0 border-t-4 border-danger bg-danger-bg px-3 py-3 text-xl font-semibold leading-snug text-danger shadow-[0_-6px_16px_rgba(0,0,0,0.12)]"
    >
      {title ? <p>{title}</p> : null}
      {details && details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-base font-medium">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
