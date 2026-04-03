#!/usr/bin/env python3
"""
Agent harness — Claude Code phase 순차 실행기.

Usage:
  python scripts/run-phases.py <task-dir>

  예: python scripts/run-phases.py tasks/implement-api-client

Exit codes:
  0  — 모든 phase 완료
  1  — phase 실행 오류 (index.json의 error_message 참고)
  2  — 사용자 개입 필요 (index.json의 blocked_reason 참고)
"""

import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


# ── Dooray 알림 ───────────────────────────────────────────────────────────────

def notify_discord(message: str) -> None:
    """DOORAY_WEBHOOK_URL 환경변수가 있을 때만 전송. 없으면 조용히 스킵."""
    webhook_url = os.environ.get("DOORAY_WEBHOOK_URL")
    if not webhook_url:
        return
    payload = json.dumps({"botName": "dooray-cli", "text": message}).encode()
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[warn] Dooray 알림 실패: {e}", file=sys.stderr)


# ── Task 파일 헬퍼 ────────────────────────────────────────────────────────────

def load_task(task_dir: Path) -> tuple[dict, Path]:
    index_path = task_dir / "index.json"
    if not index_path.exists():
        print(f"[error] index.json not found: {index_path}", file=sys.stderr)
        sys.exit(1)
    with open(index_path, encoding="utf-8") as f:
        return json.load(f), index_path


def save_task(task: dict, index_path: Path) -> None:
    task["updated_at"] = datetime.now(timezone.utc).isoformat()
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)


# ── Phase 실행 ────────────────────────────────────────────────────────────────

DEFAULT_TOOLS = "Read,Write,Edit,Bash,Glob,Grep"
BLOCKED_MARKER = "PHASE_BLOCKED:"
FAILED_MARKER = "PHASE_FAILED:"


def run_phase(phase_file: Path, allowed_tools: list[str]) -> tuple[int, str, str]:
    """phase 프롬프트를 Claude에 전달하고 (returncode, stdout, stderr) 반환."""
    with open(phase_file, encoding="utf-8") as f:
        prompt = f.read()

    tools = ",".join(allowed_tools) if allowed_tools else DEFAULT_TOOLS

    result = subprocess.run(
        ["claude", "--print", "--allowedTools", tools],
        input=prompt,
        capture_output=True,
        text=True,
    )
    return result.returncode, result.stdout, result.stderr


def find_marker(text: str, marker: str) -> str | None:
    """stdout/stderr에서 특수 마커 추출. 없으면 None."""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(marker):
            return stripped[len(marker):].strip()
    return None


# ── 메인 ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    task_dir = Path(sys.argv[1]).resolve()
    if not task_dir.is_dir():
        print(f"[error] task 디렉터리 없음: {task_dir}", file=sys.stderr)
        sys.exit(1)

    task, index_path = load_task(task_dir)
    task_name = task["name"]
    phases = task["phases"]
    total = len(phases)

    print(f"\n🚀  Task: {task_name}  ({total} phases)\n")

    for phase in phases:
        phase_num = phase["number"]
        phase_title = phase.get("title", f"Phase {phase_num}")

        # 이미 완료된 phase는 스킵
        if phase["status"] == "completed":
            print(f"  ✓  Phase {phase_num}/{total}: {phase_title}  (already completed)")
            continue

        phase_file = task_dir / phase["file"]
        if not phase_file.exists():
            msg = f"phase 파일 없음: {phase_file}"
            phase["status"] = "failed"
            task["status"] = "failed"
            task["error_message"] = msg
            save_task(task, index_path)
            notify_discord(f"❌ Task **{task_name}** phase {phase_num} 실패: {msg}")
            print(f"  ✗  {msg}", file=sys.stderr)
            sys.exit(1)

        allowed_tools = phase.get("allowedTools", [])

        print(f"  ▶  Phase {phase_num}/{total}: {phase_title}")

        # running 상태 기록
        phase["status"] = "running"
        task["status"] = "running"
        task["current_phase"] = phase_num
        save_task(task, index_path)

        returncode, stdout, stderr = run_phase(phase_file, allowed_tools)

        # PHASE_BLOCKED 마커 확인 (exit 2)
        blocked = find_marker(stdout, BLOCKED_MARKER) or find_marker(stderr, BLOCKED_MARKER)
        if blocked:
            phase["status"] = "blocked"
            task["status"] = "blocked"
            task["blocked_reason"] = blocked
            save_task(task, index_path)
            discord_msg = f"⚠️ Task **{task_name}** phase {phase_num} blocked: {blocked}"
            print(f"\n  ⚠  {discord_msg}", file=sys.stderr)
            notify_discord(discord_msg)
            sys.exit(2)

        # PHASE_FAILED 마커 또는 비정상 종료 (exit 1)
        if returncode != 0:
            error = (
                find_marker(stdout, FAILED_MARKER)
                or find_marker(stderr, FAILED_MARKER)
                or stderr.strip()
                or f"exit code {returncode}"
            )
            phase["status"] = "failed"
            task["status"] = "failed"
            task["error_message"] = error
            save_task(task, index_path)
            discord_msg = f"❌ Task **{task_name}** phase {phase_num} 실패: {error}"
            print(f"\n  ✗  {discord_msg}", file=sys.stderr)
            notify_discord(discord_msg)
            sys.exit(1)

        # 성공
        phase["status"] = "completed"
        save_task(task, index_path)
        print(f"  ✓  Phase {phase_num}/{total}: {phase_title}  완료")

    # 전체 완료
    task["status"] = "completed"
    save_task(task, index_path)
    discord_msg = f"✅ Task **{task_name}** 완료 ({total} phases)"
    print(f"\n{discord_msg}\n")
    notify_discord(discord_msg)
    sys.exit(0)


if __name__ == "__main__":
    main()
