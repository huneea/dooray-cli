import { Command } from "commander";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";

export const commentDeleteCommand = new Command("delete")
  .description("댓글 삭제")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .argument("<comment-id>", "댓글 ID")
  .action(async (project, postNumberStr, commentId) => {
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("댓글 삭제 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    await client.deletePostComment(projectId, postId, commentId);
    stopSpinner(true, "댓글 삭제 완료");

    process.stdout.write(`댓글이 삭제되었습니다: ${commentId}\n`);
  });
