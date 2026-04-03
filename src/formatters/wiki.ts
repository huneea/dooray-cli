import type { Wiki, WikiPage, WikiPageDetail } from "../api/types.js";
import type { OutputOptions } from "./table.js";
import { output, printJson } from "./table.js";

export function formatWikiList(wikis: Wiki[], opts: OutputOptions): void {
  output(opts, {
    headers: ["ID", "Name", "Type"],
    rows: wikis.map((w) => [w.id, w.name, w.type]),
    raw: wikis,
    ids: wikis.map((w) => w.id),
  });
}

export function formatWikiPages(pages: WikiPage[], opts: OutputOptions): void {
  output(opts, {
    headers: ["ID", "Subject", "Creator"],
    rows: pages.map((p) => [
      p.id,
      p.subject,
      p.creator?.member?.name ?? "",
    ]),
    raw: pages,
    ids: pages.map((p) => p.id),
  });
}

export function formatWikiPageDetail(page: WikiPageDetail, opts: OutputOptions): void {
  if (opts.json) {
    printJson(page);
    return;
  }

  const lines: string[] = [
    `${page.subject}`,
    `ID: ${page.id}`,
    `Wiki: ${page.wikiId}`,
    `버전: ${page.version}`,
    `작성자: ${page.creator?.member?.name ?? ""}`,
    ...(page.createdAt ? [`생성: ${page.createdAt}`] : []),
    ...(page.updatedAt ? [`수정: ${page.updatedAt}`] : []),
    "",
    page.body?.content ?? "",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}
