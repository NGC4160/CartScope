import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { docsForModelTag, getControllerModel } from "@/data/controllers";
import { DriveSignInNote, openDriveDoc, TabletControllerSheets } from "@/components/cart/ControllerLookup";

export const Route = createFileRoute("/controllers/$modelTag")({ component: ControllerModelPage });

function ControllerModelPage() {
  const { modelTag } = Route.useParams();
  const model = getControllerModel(modelTag);
  const docs = docsForModelTag(modelTag);

  if (!model || docs.length === 0) {
    return (
      <AppShell>
        <main className="p-8">
          <p>We do not have a controller book for that stamp.</p>
          <Link to="/controllers" className="mt-3 inline-block font-medium text-navy">
            All controller stamps
          </Link>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/controllers">All stamps</Link>
        </Button>
      }
    >
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="font-mono text-xs font-semibold tracking-[0.18em] text-navy">CONTROLLER</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">{model.fullName}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Tag <span className="font-mono">{model.tag}</span>. Open the Drive book. Do not use a cart year/make/model
          for this file.
        </p>

        <div className="mt-4 grid gap-3">
          <DriveSignInNote />
          <TabletControllerSheets tag={model.tag} />
        </div>

        <ul className="mt-6 grid gap-3">
          {docs.map((doc) => (
            <li key={doc.id}>
              <a
                href={doc.openUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-16 items-start gap-3 rounded-lg bg-surface p-4 text-ink shadow-[var(--shadow-border)]"
              >
                <BookOpen className="mt-0.5 size-5 shrink-0 text-navy" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold">{doc.title}</span>
                  <span className="block text-sm text-ink-muted">
                    {doc.kind === "manual" ? "Manual" : doc.kind === "codes" ? "Fault codes" : "Install sheet"}
                    {doc.platformTags.length ? ` · also seen on ${doc.platformTags.join(", ")}` : ""}
                  </span>
                </span>
                <ExternalLink className="mt-1 size-4 shrink-0 text-ink-subtle" />
              </a>
            </li>
          ))}
        </ul>

        {docs.length > 1 ? (
          <Button type="button" className="mt-4 w-full" onClick={() => docs.forEach(openDriveDoc)}>
            Open all {docs.length} books
          </Button>
        ) : (
          <Button type="button" className="mt-4 w-full" onClick={() => openDriveDoc(docs[0]!)}>
            Open this book
          </Button>
        )}
      </main>
    </AppShell>
  );
}
