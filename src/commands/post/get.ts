import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { resolveProject } from "../../resolvers/project.js";
import { resolvePost } from "../../resolvers/post.js";
import { formatPostDetail } from "../../formatters/post.js";
import type { OutputOptions } from "../../formatters/table.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";

export const postGetCommand = new Command("get")
  .description("업무 상세 조회")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .action(async (project, postNumberStr) => {
    const globalOpts = postGetCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("업무 조회 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const res = await client.getPost(projectId, postId);
    stopSpinner(true, "업무 조회 완료");

    formatPostDetail(res.result, globalOpts);
  });
