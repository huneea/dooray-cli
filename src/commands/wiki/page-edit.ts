import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { resolveWiki } from "../../resolvers/wiki.js";
import {
  openInEditor,
  serializeWikiFrontmatter,
  parseWikiFrontmatter,
} from "../../editor/index.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";

export const wikiPageEditCommand = new Command("edit")
  .description("위키 페이지 수정 ($EDITOR)")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .argument("<page-id>", "페이지 ID")
  .action(async (project, pageId) => {
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("위키 페이지 조회 중...");
    const wikiId = await resolveWiki(client, project);
    const res = await client.getWikiPage(wikiId, pageId);
    const page = res.result;
    stopSpinner(true, "위키 페이지 조회 완료");

    const original = serializeWikiFrontmatter(page);
    const edited = await openInEditor(original);

    if (original === edited) {
      process.stdout.write("변경사항 없음\n");
      return;
    }

    const parsed = parseWikiFrontmatter(edited);

    startSpinner("위키 페이지 수정 중...");
    await client.updateWikiPage(wikiId, pageId, {
      subject: parsed.title,
      body: { mimeType: "text/x-markdown", content: parsed.body },
    });
    stopSpinner(true, "위키 페이지 수정 완료");

    process.stdout.write(`위키 페이지가 수정되었습니다: ${pageId}\n`);
  });
