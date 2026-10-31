"""Sends the password-reset code by EMAIL.

HOW IT WORKS
- If SMTP settings are present (ARANYA_SMTP_HOST, ARANYA_SMTP_PORT, ARANYA_SMTP_USER,
  ARANYA_SMTP_PASSWORD, optional ARANYA_SMTP_FROM) the code is emailed to the user.
- If they are NOT set, no email can be sent, so the code is only printed in the backend
  console window (fine for a quick local demo, but the user will receive nothing).

The settings can live in a file called  .env  next to this file (see .env.example).
It is read automatically every time the backend starts -- no extra package needed.

SMS is not used: the registration form does not collect a phone number, and sending SMS
needs a paid provider account (Twilio, Fast2SMS, MSG91 ...).
"""
import os, smtplib
from pathlib import Path
from email.message import EmailMessage


def _load_env_file() -> None:
    """Read KEY=VALUE lines from .env (next to this file) into os.environ.
    Real environment variables always win over the file."""
    env_path = Path(__file__).parent / ".env"
    try:
        if not env_path.exists():
            return
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    except OSError:
        pass


_load_env_file()


def email_configured() -> bool:
    """True when real email sending is set up (a host AND a login are present)."""
    return bool(os.environ.get("ARANYA_SMTP_HOST") and os.environ.get("ARANYA_SMTP_USER") and os.environ.get("ARANYA_SMTP_PASSWORD"))


def send_reset_code(to_email: str, code: str) -> bool:
    host = os.environ.get("ARANYA_SMTP_HOST")
    if not host:
        print(
            "\n[AranyaAI] ----------------------------------------------------------\n"
            f"[AranyaAI] EMAIL IS NOT SET UP, so nothing was sent to {to_email}.\n"
            f"[AranyaAI] Password reset code: {code}   (valid 15 minutes)\n"
            "[AranyaAI] To email codes to users, fill in the SMTP lines in the .env file\n"
            "[AranyaAI] (see .env.example) and restart the backend.\n"
            "[AranyaAI] ----------------------------------------------------------\n",
            flush=True,
        )
        return False
    msg = EmailMessage()
    user = os.environ.get("ARANYA_SMTP_USER", "")
    msg["Subject"] = "AranyaAI password reset code"
    msg["From"] = os.environ.get("ARANYA_SMTP_FROM") or user or "no-reply@aranyaai.local"
    msg["To"] = to_email
    msg.set_content(
        f"Your AranyaAI password reset code is {code}. It is valid for 15 minutes.\n"
        "If you did not request this, you can ignore this email."
    )
    port = int(os.environ.get("ARANYA_SMTP_PORT", "587"))
    try:
        if port == 465:  # implicit SSL
            with smtplib.SMTP_SSL(host, port, timeout=20) as smtp:
                if user:
                    smtp.login(user, os.environ.get("ARANYA_SMTP_PASSWORD", ""))
                smtp.send_message(msg)
        else:  # 587 / STARTTLS
            with smtplib.SMTP(host, port, timeout=20) as smtp:
                smtp.starttls()
                if user:
                    smtp.login(user, os.environ.get("ARANYA_SMTP_PASSWORD", ""))
                smtp.send_message(msg)
        print(f"[AranyaAI] Reset code emailed to {to_email}.", flush=True)
        return True
    except Exception as exc:
        print(
            f"\n[AranyaAI] COULD NOT SEND THE EMAIL to {to_email}: {exc}\n"
            "[AranyaAI] Check the SMTP lines in .env (for Gmail you must use an App Password, not your normal password).\n"
            f"[AranyaAI] Reset code for testing: {code}\n",
            flush=True,
        )
        return False
