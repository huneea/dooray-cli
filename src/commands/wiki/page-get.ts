import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { resolveWiki } from "../../resolvers/wiki.js";
import { formatWikiPageDetail } from "../../formatters/wiki.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";
import type { OutputOptions } from "../../formatters/table.js";

export const wikiPageGetCommand = new Command("get")
  .description("위키 페이지 상세 조회")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<page-id>", "페이지 ID")
  .action(async (project, pageId) => {
    const globalOpts = wikiPageGetCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("위키 페이지 조회 중...");
    const wikiId = await resolveWiki(client, project);
    const res = await client.getWikiPage(wikiId, pageId);
    stopSpinner(true, "위키 페이지 조회 완료");

    formatWikiPageDetail(res.result, globalOpts);
  });
