import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { getConfigOrThrow } from "../../config/store.js";
import { sendMail } from "../../api/smtpClient.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";
import type { OutputOptions } from "../../formatters/table.js";
import { printJson } from "../../formatters/table.js";

export const mailSendCommand = new Command("send")
  .description("메일 발송")
  .requiredOption("--to <addresses...>", "받는사람 이메일 (복수 가능)")
  .requiredOption("--subject <title>", "제목")
  .option("--body <text>", "본문")
  .option("--body-file <path>", "본문 파일 경로")
  .option("--cc <addresses...>", "참조")
  .option("--bcc <addresses...>", "숨은참조")
  .option("--html", "본문을 HTML로 전송")
  .action(async (opts) => {
    const globalOpts = mailSendCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();

    let body = opts.body ?? "";
    if (opts.bodyFile) {
      body = await readFile(opts.bodyFile, "utf-8");
    }
    if (!body) {
      process.stderr.write("오류: --body 또는 --body-file을 지정하세요\n");
      process.exit(3);
    }

    startSpinner("메일 발송 중...");
    const result = await sendMail(config, {
      to: opts.to,
      cc: opts.cc,
      bcc: opts.bcc,
      subject: opts.subject,
      body,
      html: opts.html,
    });
    stopSpinner(true, "메일 발송 완료");

    if (globalOpts.json) {
      printJson(result);
    } else {
      process.stdout.write(
        `메일 발송 완료\n` +
          `  Message-ID: ${result.messageId}\n` +
          `  수신: ${result.accepted.join(", ")}\n` +
          (result.rejected.length
            ? `  거부: ${result.rejected.join(", ")}\n`
            : ""),
      );
    }
  });
