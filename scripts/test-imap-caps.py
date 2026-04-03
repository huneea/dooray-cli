#!/usr/bin/env python3
"""Check Dooray IMAP server capabilities and supported search options."""

import imaplib
import os
from dotenv import load_dotenv

load_dotenv()

IMAP_HOST = os.getenv("DOORAY_IMAP_HOST", "imap.dooray.com")
IMAP_PORT = int(os.getenv("DOORAY_IMAP_PORT", "993"))
USERNAME = os.getenv("DOORAY_IMAP_USERNAME", "")
PASSWORD = os.getenv("DOORAY_IMAP_PASSWORD", "")

mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
mail.login(USERNAME, PASSWORD)

# 1. Server capabilities
print("=== CAPABILITY ===")
status, caps = mail.capability()
print(f"  {caps[0].decode()}")

mail.select("INBOX")

# 2. Test various search commands
searches = [
    ("ALL (last 10)", "ALL"),
    ("UNSEEN", "UNSEEN"),
    ("SEEN", "SEEN"),
    ("SINCE 1-Apr-2026", '(SINCE "1-Apr-2026")'),
    ("SINCE 01-Apr-2026", '(SINCE "01-Apr-2026")'),
    ("SINCE 2026-04-01", '(SINCE "2026-04-01")'),
    ("SUBJECT test", '(SUBJECT "test")'),
    ("FROM dooray", '(FROM "dooray")'),
    ("TO bifos", '(TO "bifos")'),
    ("UID range last 5", None),  # special
    ("SORT REVERSE DATE", None),  # special
]

print("\n=== Search Tests ===")
for label, criteria in searches:
    if label == "UID range last 5":
        try:
            status, data = mail.uid("search", None, "ALL")
            uids = data[0].split()
            print(f"  ✅ UID SEARCH ALL: {len(uids)} results (last 5: {[u.decode() for u in uids[-5:]]})")
        except Exception as e:
            print(f"  ❌ UID SEARCH: {e}")
        continue
    if label == "SORT REVERSE DATE":
        try:
            status, data = mail.sort("(REVERSE DATE)", "UTF-8", "ALL")
            ids = data[0].split()
            print(f"  ✅ SORT REVERSE DATE: {len(ids)} results (first 5: {[i.decode() for i in ids[:5]]})")
        except Exception as e:
            print(f"  ❌ SORT: {e}")
        continue
    try:
        status, data = mail.search(None, criteria)
        count = len(data[0].split()) if data[0] else 0
        print(f"  ✅ {label}: {count} results")
    except Exception as e:
        print(f"  ❌ {label}: {e}")

mail.logout()
