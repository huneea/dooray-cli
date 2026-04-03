import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { resolveProject } from "../../resolvers/project.js";
import { resolvePost } from "../../resolvers/post.js";
import { resolveWorkflow } from "../../resolvers/workflow.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";

export const postWorkflowCommand = new Command("workflow")
  .description("업무 워크플로우 변경")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .argument("<workflow>", "워크플로우 이름 또는 클래스")
  .action(async (project, postNumberStr, workflow) => {
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("워크플로우 변경 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const workflowId = await resolveWorkflow(client, projectId, workflow);
    await client.setPostWorkflow(projectId, postId, workflowId);
    stopSpinner(true, "워크플로우 변경 완료");

    process.stdout.write(`#${postNumberStr} 워크플로우가 "${workflow}"(으)로 변경되었습니다.\n`);
  });
