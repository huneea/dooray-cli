import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { getMail } from "../../api/imapClient.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";
import type { OutputOptions } from "../../formatters/table.js";
import { printJson } from "../../formatters/table.js";
import chalk from "chalk";

export const mailGetCommand = new Command("get")
  .description("메일 상세 조회")
  .argument("<uid>", "메일 UID")
  .action(async (uid) => {
    const globalOpts = mailGetCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();

    startSpinner("메일 조회 중...");
    const mail = await getMail(config, Number(uid));
    stopSpinner(true, "메일 조회 완료");

    if (globalOpts.json) {
      printJson({
        uid: mail.uid,
        subject: mail.subject,
        from: mail.from,
        to: mail.to,
        date: mail.date?.toISOString() ?? null,
        isRead: mail.isRead,
        body: mail.body,
      });
    } else {
      process.stdout.write(
        `${chalk.bold("제목:")} ${mail.subject}\n` +
          `${chalk.bold("보낸사람:")} ${mail.from}\n` +
          `${chalk.bold("받는사람:")} ${mail.to.join(", ")}\n` +
          `${chalk.bold("날짜:")} ${mail.date?.toLocaleString("ko-KR") ?? ""}\n` +
          `${chalk.bold("읽음:")} ${mail.isRead ? "예" : "아니오"}\n` +
          `\n${mail.body}\n`,
      );
    }
  });
