import { Command } from "commander";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import type { OutputOptions } from "../../../formatters/table.js";
import { printJson } from "../../../formatters/table.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";

export const fileUploadCommand = new Command("upload")
  .description("첨부파일 업로드")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .argument("<file-path>", "업로드할 파일 경로")
  .action(async (project, postNumberStr, filePath) => {
    const globalOpts = fileUploadCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("파일 업로드 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const res = await client.uploadPostFile(projectId, postId, filePath);
    stopSpinner(true, "업로드 완료");

    if (globalOpts.json) {
      printJson(res.result);
    } else if (globalOpts.quiet) {
      process.stdout.write(`${res.result.id}\n`);
    } else {
      process.stdout.write(`파일 업로드 완료: ${res.result.name} (ID: ${res.result.id})\n`);
    }
  });
