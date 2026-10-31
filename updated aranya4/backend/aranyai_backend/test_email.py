"""Quick check that password-reset emails really leave your computer.

    python test_email.py someone@gmail.com

Sends a test message using the SMTP settings in .env. If it fails, the exact
reason is printed (wrong app password, blocked port, etc.).
"""
import sys
from mailer import email_configured, send_reset_code

if len(sys.argv) < 2:
    print("Usage: python test_email.py your-email@example.com")
    sys.exit(1)
if not email_configured():
    print("SMTP is NOT configured. Create a .env file (copy .env.example) and fill in the ARANYA_SMTP_* lines.")
    sys.exit(2)
ok = send_reset_code(sys.argv[1], "123456")
print("SUCCESS - check the inbox (and spam folder)." if ok else "FAILED - see the message above.")
