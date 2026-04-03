import { Command } from "commander";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import { formatCommentList } from "../../../formatters/post.js";
import type { OutputOptions } from "../../../formatters/table.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";

export const commentListCommand = new Command("list")
  .description("댓글 목록 조회")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .option("--page <number>", "페이지 번호", "0")
  .option("--size <number>", "페이지 크기", "20")
  .action(async (project, postNumberStr, opts) => {
    const globalOpts = commentListCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("댓글 목록 조회 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const res = await client.getPostComments(projectId, postId, {
      page: Number(opts.page),
      size: Number(opts.size),
    });
    stopSpinner(true, "댓글 목록 조회 완료");

    formatCommentList(res.result, globalOpts);
  });
