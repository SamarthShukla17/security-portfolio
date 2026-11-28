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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { meta } = await getWriteupBySlug(slug);
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let writeup;
  try {
    writeup = await getWriteupBySlug(slug);
  } catch {
    notFound();
  }
  const { meta, contentHtml } = writeup;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <main className="max-w-3xl mx-auto px-4 pt-14 pb-12">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-balance">
          {meta.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <span className="chip">{format(new Date(meta.date), "yyyy-MM-dd")}</span>
          <span className="chip">{meta.protocol}</span>
          {meta.status === "Engagement" ? (
            <>
              {meta.chain && <span className="chip">{meta.chain}</span>}
              {meta.scope && <span className="chip">{meta.scope}</span>}
            </>
          ) : meta.status === "Methodology" ? null : (
            <span className={`chip ${severityClassName[meta.severity]}`}>
              {meta.severity}
            </span>
          )}
          <span className={`chip ${statusClassName[meta.status]}`}>{meta.status}</span>
          {meta.pdf && (
            <a href={`${base}${meta.pdf}`} className="pill">
              Download PDF
            </a>
          )}
        </div>
      </header>

      <article
        className="writeup-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </main>
  );
}
