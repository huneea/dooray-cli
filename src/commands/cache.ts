import { Command } from "commander";
import chalk from "chalk";
import { clearCache } from "../cache/store.js";

export const cacheCommand = new Command("cache")
  .description("캐시 관리");

cacheCommand
  .command("clear")
  .description("캐시 전체 삭제")
  .action(async () => {
    await clearCache();
    console.log(chalk.green("✓ 캐시가 삭제되었습니다."));
  });

cacheCommand
  .command("refresh")
  .description("캐시 갱신 (API 클라이언트 연동 후 지원 예정)")
  .action(async () => {
    await clearCache();
    console.log(chalk.yellow("캐시를 삭제했습니다. API 클라이언트 연동 후 자동 갱신이 지원됩니다."));
  });
