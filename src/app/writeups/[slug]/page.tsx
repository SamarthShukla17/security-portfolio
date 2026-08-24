import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getAllWriteups, getWriteupBySlug } from "@/lib/writeups";
import { severityClassName, statusClassName } from "@/lib/severity";

export function generateStaticParams() {
  return getAllWriteups().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const { meta } = await getWriteupBySlug(params.slug);
    return {
      title: `${meta.title} | Security Portfolio`,
      description: meta.summary,
    };
  } catch {
    return {};
  }
}

export default async function WriteupPage({
  params,
}: {
  params: { slug: string };
}) {
  let writeup;
  try {
    writeup = await getWriteupBySlug(params.slug);
  } catch {
    notFound();
  }
  const { meta, contentHtml } = writeup;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-sm">
      <div className="border border-muted/20 px-4 py-3 mb-10">
        <p className="text-muted/60">## {meta.slug}.md</p>
        <p className="text-base text-foreground mt-1 font-medium">{meta.title}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-muted">
          <span>date: {format(new Date(meta.date), "yyyy-MM-dd")}</span>
          <span>protocol: {meta.protocol}</span>
          <span>
            severity:{" "}
            <span className={severityClassName[meta.severity]}>
              {meta.severity}
            </span>
          </span>
          <span>
            status:{" "}
            <span className={statusClassName[meta.status]}>
              {meta.status}
            </span>
          </span>
        </div>
      </div>

      <article
        className="writeup-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </main>
  );
}
