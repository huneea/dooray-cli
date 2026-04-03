#!/usr/bin/env python3
"""Dooray IMAP connection prototype — verify read access."""

import imaplib
import email
from email.header import decode_header
from datetime import datetime, timedelta

import os
from dotenv import load_dotenv

load_dotenv()

IMAP_HOST = os.getenv("DOORAY_IMAP_HOST", "imap.dooray.com")
IMAP_PORT = int(os.getenv("DOORAY_IMAP_PORT", "993"))
USERNAME = os.getenv("DOORAY_IMAP_USERNAME", "")
PASSWORD = os.getenv("DOORAY_IMAP_PASSWORD", "")


def decode_mime_header(raw):
    """Decode MIME-encoded header to string."""
    parts = decode_header(raw)
    result = []
    for data, charset in parts:
        if isinstance(data, bytes):
            result.append(data.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(data)
    return "".join(result)


USERNAMES_TO_TRY = [
    USERNAME,
    "bifos",
    USERNAME.replace("@", "@") + ".dooray.com" if USERNAME else "",
]


def main():
    print(f"Connecting to {IMAP_HOST}:{IMAP_PORT} ...")
    mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)

    # Try multiple username formats
    logged_in = False
    for uname in USERNAMES_TO_TRY:
        try:
            print(f"Trying login as '{uname}' ...")
            mail.login(uname, PASSWORD)
            print(f"✅ Login successful with '{uname}'!\n")
            logged_in = True
            break
        except imaplib.IMAP4.error:
            print(f"  ❌ Failed with '{uname}'")
            mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)

    if not logged_in:
        print("❌ All login attempts failed")
        return

    # List mailboxes
    print("=== Mailboxes ===")
    status, mailboxes = mail.list()
    for mb in mailboxes:
        print(f"  {mb.decode()}")

    # Select INBOX
    print("\n=== INBOX ===")
    mail.select("INBOX")

    # All emails
    status, messages = mail.search(None, "ALL")
    msg_ids = messages[0].split()
    print(f"Total emails: {len(msg_ids)}")

    # Unread count
    try:
        status, unread = mail.search(None, "UNSEEN")
        unread_ids = unread[0].split()
        print(f"Unread emails: {len(unread_ids)}")
    except Exception as e:
        print(f"Unread search not supported: {e}")

    # Show last 5 emails (headers only)
    print(f"\n=== Last 5 emails ===")
    last_5 = msg_ids[-5:] if len(msg_ids) >= 5 else msg_ids
    for mid in reversed(last_5):
        status, data = mail.fetch(mid, "(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM DATE)])")
        raw = data[0][1]
        msg = email.message_from_bytes(raw)
        subject = decode_mime_header(msg.get("Subject", "(no subject)"))
        sender = decode_mime_header(msg.get("From", "(unknown)"))
        date = msg.get("Date", "(unknown)")
        print(f"  [{date}]")
        print(f"    From: {sender}")
        print(f"    Subject: {subject}")
        print()

    mail.logout()
    print("✅ Done!")


if __name__ == "__main__":
    main()
