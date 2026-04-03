import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { formatWikiList } from "../../formatters/wiki.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";
import type { OutputOptions } from "../../formatters/table.js";

export const wikiListCommand = new Command("list")
  .description("위키 목록 조회")
  .option("--page <number>", "페이지 번호", "0")
  .option("--size <number>", "페이지 크기", "20")
  .action(async (opts) => {
    const globalOpts = wikiListCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("위키 목록 조회 중...");
    const res = await client.getWikis({
      page: Number(opts.page),
      size: Number(opts.size),
    });
    stopSpinner(true, "위키 목록 조회 완료");

    formatWikiList(res.result, globalOpts);
  });
