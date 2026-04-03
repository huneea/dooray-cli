---
name: release
description: dooray-cli 릴리스 자동화. 빌드 검증 → 버전 범프 → git tag → GitHub Release → npm publish 순서로 진행.
---

# /release — dooray-cli Release

dooray-cli의 새 버전을 릴리스한다.

## 사용법

```
/release <version> [--notes "릴리스 노트"]
```

- `<version>`: semver 버전 (예: `0.4.0`, `0.3.2`)
- `--notes`: 릴리스 노트 (생략 시 git log에서 자동 생성)

## 릴리스 절차

아래 단계를 **순서대로** 실행한다. 각 단계 실패 시 즉시 중단하고 사용자에게 보고한다.

### 1. 사전 검증

```bash
# 작업 디렉토리가 clean한지 확인
git status --porcelain

# 빌드 성공 확인
pnpm run build
```

- uncommitted 변경이 있으면 먼저 커밋 여부를 사용자에게 확인
- 빌드 실패 시 중단

### 2. 버전 범프

- `package.json`의 `version` 필드를 `<version>`으로 변경
- `src/index.ts`의 `.version("x.y.z")`를 `<version>`으로 변경
- 변경 후 다시 `pnpm run build`로 빌드 검증

### 3. 커밋 & 푸시

```bash
git add package.json src/index.ts
git commit -m "chore: bump version to v<version>"
git push origin main
```

### 4. Git Tag & GitHub Release

```bash
git tag -a v<version> -m "v<version>"
git push origin v<version>
```

릴리스 노트가 제공된 경우:
```bash
gh release create v<version> --title "v<version> — <요약>" --notes "<notes>"
```

릴리스 노트가 없는 경우 — 이전 태그 이후 커밋 로그에서 자동 생성:
```bash
gh release create v<version> --title "v<version>" --generate-notes
```

### 5. npm Publish

npm publish는 2FA OTP가 필요하므로 사용자에게 직접 실행을 요청한다:

```
npm publish --access public --otp=<code>
```

사용자에게 위 명령을 안내하고, 완료 후 결과를 확인한다.

### 6. 최종 확인

- `https://github.com/jon890/dooray-cli/releases/tag/v<version>` 릴리스 확인
- `https://www.npmjs.com/package/@bifos/dooray-cli` 버전 확인 (반영에 수 분 소요)

## 주의사항

- **빌드 실패 시 릴리스하지 않는다**
- **npm publish는 사용자가 직접 OTP를 입력해야 한다**
- 이전 태그를 force-update하지 않는다 (새 태그만 생성)
