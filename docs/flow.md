# User Flow — dooray-cli

## 최초 설정

```
dooray config set base-url https://api.dooray.com
dooray config set api-key <token>          # https://{company}.dooray.com/setting/api/token
dooray doctor                               # 설정·연결 검증
```

config 미설정 상태에서 어떤 커맨드 실행 시:

```
Error: API key not configured.
Run: dooray config set api-key <your-key>
```

## 일반 조회 흐름

```
dooray project list                         # 1) 프로젝트 목록 (캐시 자동 갱신)
dooray post list my-project                 # 2) 업무 목록 (postNumber 포함)
dooray post get my-project 42              # 3) 업무 상세 (#42번)
dooray post search my-project "스프린트"   # 4) 제목 검색
```

## 업무 생성 흐름

```
dooray post create my-project \
  --subject "기능 구현" \
  --to "김철수" \                           # 이름 or 이메일로 멤버 지정
  --body-file task.md                       # 또는 --body - (stdin)
```

`--to` 멤버가 모호할 때:

```
Error: '김' matches multiple members:
  - 김철수 (1234567890123456789)
  - 김영희 (9876543210987654321)
Use full name or ID.
```

## 업무 수정 흐름 ($EDITOR)

```
dooray post edit my-project 42
```

1. API로 현재 업무 조회
2. 임시 파일 생성 (YAML frontmatter + 본문):

```yaml
---
subject: 현재 제목
priority: normal
due_date: 2026-04-30T18:00:00+09:00
to:
  - kim@nhnent.com
cc: []
---
본문 마크다운...
```

3. `$EDITOR` 실행 → 저장·종료
4. frontmatter 파싱 → member resolver → API PUT 호출

`$EDITOR` 미설정 시:

```
Error: $EDITOR is not set. Set it with: export EDITOR=vim
```

## 캐시 흐름

- 커맨드 실행 시 캐시 자동 확인 → TTL 만료 시 자동 갱신
- 수동 조작:

```
dooray cache refresh     # 즉시 갱신
dooray cache clear       # 전체 삭제
```

TTL: projects·members 1시간 / workflows 24시간

## 파이프라인 활용

```bash
# JSON 출력 → jq 가공
dooray post list my-project --json | jq '.[] | select(.priority == "high")'

# 조용한 출력 (ID만)
dooray post list my-project --quiet | xargs -I{} dooray post done my-project {}
```

## 첨부파일 흐름

```
dooray post file list my-project 42                    # 첨부파일 목록
dooray post file download my-project 42 <file-id>     # 단일 다운로드
dooray post file download-all my-project 42 -o ./files # 전체 다운로드
dooray post file upload my-project 42 ./report.pdf     # 업로드
dooray post file delete my-project 42 <file-id>        # 삭제
```

업로드·다운로드 시 Dooray API는 307 리다이렉트로 파일 서버 URL을 반환한다. CLI가 자동 처리하므로 사용자는 신경 쓸 필요 없다.

## 메일 흐름

```
dooray config set imap-username your@email.com         # 최초 1회 설정
dooray config set imap-password <app-password>

dooray mail list                                        # 최근 메일 목록
dooray mail list --unread                               # 안읽은 메일만
dooray mail list --search "키워드"                      # 제목 검색
dooray mail get <uid>                                   # 메일 상세

dooray mail send --to "a@b.com" --subject "제목" --body "본문"
dooray mail reply <uid> --body "답장 내용"              # 스레드 유지
```
