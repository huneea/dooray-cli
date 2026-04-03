import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { resolveProject } from "../../resolvers/project.js";
import { resolvePost } from "../../resolvers/post.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";

export const postDoneCommand = new Command("done")
  .description("업무 완료 처리")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .action(async (project, postNumberStr) => {
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("업무 완료 처리 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    await client.setPostDone(projectId, postId);
    stopSpinner(true, "업무 완료 처리 완료");

    process.stdout.write(`#${postNumberStr} 업무가 완료 처리되었습니다.\n`);
  });
