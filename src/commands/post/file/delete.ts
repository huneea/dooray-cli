import { Command } from "commander";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";

export const fileDeleteCommand = new Command("delete")
  .description("첨부파일 삭제")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .argument("<file-id>", "파일 ID")
  .action(async (project, postNumberStr, fileId) => {
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("파일 삭제 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    await client.deletePostFile(projectId, postId, fileId);
    stopSpinner(true, "삭제 완료");

    process.stdout.write(`파일(${fileId})이 삭제되었습니다.\n`);
  });
