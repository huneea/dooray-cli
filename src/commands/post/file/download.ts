import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";

export const fileDownloadCommand = new Command("download")
  .description("첨부파일 다운로드")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .argument("<file-id>", "파일 ID")
  .option("-o, --output <dir>", "저장 디렉토리", ".")
  .action(async (project, postNumberStr, fileId, opts) => {
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("파일 다운로드 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const { buffer, fileName } = await client.downloadPostFile(projectId, postId, fileId);

    const outputPath = join(opts.output, fileName);
    await writeFile(outputPath, Buffer.from(buffer));
    stopSpinner(true, "다운로드 완료");

    process.stdout.write(`${outputPath}\n`);
  });
