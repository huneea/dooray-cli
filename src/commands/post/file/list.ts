import { Command } from "commander";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import { output, type OutputOptions } from "../../../formatters/table.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export const fileListCommand = new Command("list")
  .description("업무 첨부파일 목록 조회")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .action(async (project, postNumberStr) => {
    const globalOpts = fileListCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("첨부파일 목록 조회 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const res = await client.getPostFiles(projectId, postId);
    stopSpinner(true, `첨부파일 ${res.result.length}개`);

    output(globalOpts, {
      headers: ["ID", "파일명", "크기", "MIME", "생성일"],
      rows: res.result.map((f) => [
        f.id,
        f.name,
        formatSize(f.size),
        f.mimeType,
        f.createdAt,
      ]),
      raw: res.result,
      ids: res.result.map((f) => f.id),
    });
  });
