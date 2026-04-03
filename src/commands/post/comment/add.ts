import { Command } from "commander";
import fs from "node:fs/promises";
import { getConfigOrThrow } from "../../../config/store.js";
import { DoorayApiClient } from "../../../api/client.js";
import { resolveProject } from "../../../resolvers/project.js";
import { resolvePost } from "../../../resolvers/post.js";
import { openInEditor } from "../../../editor/index.js";
import { startSpinner, stopSpinner } from "../../../utils/spinner.js";
import { DoorayCliError } from "../../../utils/errors.js";
import { EXIT_PARAM_ERROR } from "../../../utils/exit-codes.js";
import type { OutputOptions } from "../../../formatters/table.js";
import { printJson } from "../../../formatters/table.js";

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new DoorayCliError(
      "stdin에서 읽으려면 파이프로 데이터를 전달해주세요.",
      EXIT_PARAM_ERROR,
    );
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function resolveBody(opts: {
  body?: string;
  bodyFile?: string;
}): Promise<string | null> {
  if (opts.body) {
    if (opts.body === "-") return readStdin();
    return opts.body;
  }
  if (opts.bodyFile) {
    if (opts.bodyFile === "-") return readStdin();
    return fs.readFile(opts.bodyFile, "utf-8");
  }
  return null;
}

export const commentAddCommand = new Command("add")
  .description("댓글 추가")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<post-number>", "업무 번호")
  .option("--body <text>", "댓글 본문 (- 입력 시 stdin에서 읽기)")
  .option("--body-file <path>", "본문 파일 경로 (- 입력 시 stdin에서 읽기)")
  .action(async (project, postNumberStr, opts) => {
    const globalOpts = commentAddCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    let bodyContent = await resolveBody(opts);

    if (bodyContent == null) {
      bodyContent = await openInEditor("");
      if (!bodyContent.trim()) {
        process.stdout.write("빈 댓글은 작성할 수 없습니다.\n");
        return;
      }
    }

    startSpinner("댓글 추가 중...");
    const projectId = await resolveProject(client, project);
    const postId = await resolvePost(client, projectId, Number(postNumberStr));
    const res = await client.createPostComment(projectId, postId, {
      body: { mimeType: "text/x-markdown", content: bodyContent },
    });
    stopSpinner(true, "댓글 추가 완료");

    if (globalOpts.json) {
      printJson(res.result);
    } else if (globalOpts.quiet) {
      process.stdout.write(res.result.id + "\n");
    } else {
      process.stdout.write(`댓글이 추가되었습니다: ${res.result.id}\n`);
    }
  });
