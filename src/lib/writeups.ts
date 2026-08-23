import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const writeupsDirectory = path.join(process.cwd(), "writeups");

export interface WriteupMeta {
  slug: string;
  title: string;
  date: string;
  protocol: string;
  severity:
    | "Critical"
    | "Critical (disputed)"
    | "High"
    | "Medium"
    | "Low"
    | "Informational"
    | "N/A";
  status: "Confirmed" | "Disputed" | "Negative (Clean Audit)" | "Draft";
  summary: string;
}

function readWriteupFile(slug: string) {
  const fullPath = path.join(writeupsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return matter(fileContents);
}

function toMeta(slug: string, data: Record<string, unknown>): WriteupMeta {
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    protocol: data.protocol as string,
    severity: data.severity as WriteupMeta["severity"],
    status: data.status as WriteupMeta["status"],
    summary: data.summary as string,
  };
}

export function getAllWriteups(): WriteupMeta[] {
  const filenames = fs
    .readdirSync(writeupsDirectory)
    .filter((filename) => filename.endsWith(".md"));

  const writeups = filenames.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const { data } = readWriteupFile(slug);
    return toMeta(slug, data);
  });

  return writeups.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getWriteupBySlug(
  slug: string
): Promise<{ meta: WriteupMeta; contentHtml: string }> {
  const { data, content } = readWriteupFile(slug);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return { meta: toMeta(slug, data), contentHtml };
}
