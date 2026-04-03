import { Command } from "commander";
import chalk from "chalk";
import { getConfig, getConfigOrThrow } from "../config/store.js";
import { getCacheStats } from "../cache/store.js";
import { DoorayApiClient } from "../api/client.js";
import { ensureMe } from "../resolvers/me.js";

export const doctorCommand = new Command("doctor")
  .description("설정 및 환경 진단")
  .action(async () => {
    console.log(chalk.bold("\n🔍 Dooray CLI 진단\n"));

    // Config checks
    const config = await getConfig();

    const apiKeyOk = !!config?.apiKey;
    const baseUrlOk = !!config?.baseUrl;

    console.log(`  API Key:  ${apiKeyOk ? chalk.green("✅ 설정됨") : chalk.red("❌ 미설정")}`);
    console.log(`  Base URL: ${baseUrlOk ? chalk.green(`✅ ${config!.baseUrl}`) : chalk.red("❌ 미설정")}`);

    // API connection test
    if (apiKeyOk && baseUrlOk) {
      console.log(chalk.bold("\n🌐 API 연결 테스트\n"));
      try {
        const validConfig = await getConfigOrThrow();
        const client = new DoorayApiClient(validConfig.apiKey, validConfig.baseUrl);
        await client.getProjects({ page: 0, size: 1 });
        const me = await ensureMe(client);
        console.log(`  연결:     ${chalk.green("✅ 성공")} (${me.name})`);
      } catch {
        console.log(`  연결:     ${chalk.red("❌ 실패 — API 키 또는 URL을 확인하세요")}`);
      }
    }

    // Cache checks
    const stats = await getCacheStats();

    console.log(chalk.bold("\n📦 캐시 상태\n"));
    console.log(`  내 정보:    ${stats.me ? chalk.green(`${stats.me.name} (${stats.me.id})`) : chalk.gray("없음")}`);
    console.log(`  프로젝트:   ${stats.projectCount}개`);
    console.log(`  멤버:       ${stats.memberProjectCount}개 프로젝트`);
    console.log(`  워크플로우: ${stats.workflowProjectCount}개 프로젝트`);

    // Summary
    console.log();
    if (apiKeyOk && baseUrlOk) {
      console.log(chalk.green("✓ 기본 설정이 완료되었습니다."));
    } else {
      console.log(chalk.yellow("⚠ 설정이 필요합니다:"));
      console.log(chalk.yellow("  dooray setup"));
    }
    console.log();
  });
