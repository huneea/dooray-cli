import type { Post, PostDetail, PostComment } from "../api/types.js";
import type { OutputOptions } from "./table.js";
import { output, printJson } from "./table.js";

export function formatPostList(posts: Post[], opts: OutputOptions): void {
  output(opts, {
    headers: ["Number", "Subject", "Workflow", "Priority", "Tags", "Assignee"],
    rows: posts.map((p) => [
      String(p.number),
      p.subject,
      p.workflow.name,
      p.priority,
      p.tags.map((t) => t.name ?? t.id).join(", "),
      p.users.to.map((u) => u.member?.name ?? u.emailUser?.name ?? "").filter(Boolean).join(", "),
    ]),
    raw: posts,
    ids: posts.map((p) => String(p.number)),
  });
}

export function formatPostDetail(post: PostDetail, opts: OutputOptions): void {
  if (opts.json) {
    printJson(post);
    return;
  }

  const lines: string[] = [
    `#${post.number} ${post.subject}`,
    `프로젝트: ${post.project.code}`,
    `상태: ${post.workflow.name} (${post.workflowClass})`,
    `우선순위: ${post.priority}`,
    `작성자: ${post.users.from.member?.name ?? ""}`,
    `담당자: ${post.users.to.map((u) => u.member?.name ?? "").filter(Boolean).join(", ")}`,
    `태그: ${post.tags.length > 0 ? post.tags.map((t) => t.name ?? t.id).join(", ") : "없음"}`,
    `생성: ${post.createdAt}`,
    `수정: ${post.updatedAt}`,
    "",
    post.body.content,
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

export function formatCommentList(comments: PostComment[], opts: OutputOptions): void {
  output(opts, {
    headers: ["ID", "Creator", "Body", "Created"],
    rows: comments.map((c) => [
      c.id,
      c.creator.member?.name ?? "",
      c.body.content.length > 60 ? c.body.content.slice(0, 57) + "..." : c.body.content,
      c.createdAt,
    ]),
    raw: comments,
    ids: comments.map((c) => c.id),
  });
}
