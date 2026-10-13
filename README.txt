ULTD TRANS PRO v0.6.3 — Email Approval Integration Patch

WHAT THIS ADDS
- Approval/rejection buttons in the Approval Queue.
- A Resend email provider adapter using the built-in fetch API (no new npm package).
- Pending -> Sending -> Sent / Send Failed state transitions.
- Atomic claim before sending to prevent simultaneous double-click sends.
- Stable Resend Idempotency-Key per approval for duplicate request protection.
- Audit events and execution status updates after approval, rejection, delivery failure, or success.
- SAFE TEST MODE (default): provider requests always go to delivered@resend.dev; the intended customer recipient is not contacted.

IMPORTANT
- This patch is designed to overlay your existing ULTD-TRANS-PRO v0.6.2 project.
- Do NOT replace your whole project with this patch. Copy these files/folders into C:\Projects\ULTD-TRANS-PRO and merge/overwrite the indicated files.
- Do NOT overwrite .env. Copy values from .env.email.example into your existing .env.
- This application currently has a demo approval UI without real user authentication. Keep it local; do not expose approval endpoints publicly until proper authentication/authorization and CSRF/origin protections are implemented.

INSTALL THE PATCH
1. Extract this ZIP somewhere convenient, for example Downloads\ULTD-TRANS-PRO-v0.6.3-email-approval-patch.
2. In PowerShell, run (adjust the patch folder path if needed):
   powershell -ExecutionPolicy Bypass -File ".\apply-patch.ps1" -ProjectPath "C:\Projects\ULTD-TRANS-PRO"
   Run that command from the extracted patch folder. It backs up the files it replaces, appends the UI styles once, merges the ApprovalStatus enum values, and DOES NOT change .env.

DATABASE SCHEMA CHANGE
The script merges SENDING, SENT, and SEND_FAILED into the existing ApprovalStatus enum. Then run these from PowerShell:
  cd C:\Projects\ULTD-TRANS-PRO
  npx.cmd prisma migrate dev --name email_approval_delivery
  npx.cmd prisma generate

EMAIL SETUP
1. Create a Resend API key at https://resend.com/api-keys.
2. Add these to your EXISTING .env:
   EMAIL_PROVIDER="resend"
   EMAIL_API_KEY="re_..."
   EMAIL_FROM="onboarding@resend.dev"
   EMAIL_TEST_MODE="true"
3. Restart the app: npm.cmd run dev.
4. Open /approvals and click "Approve & send test" on the existing pending email request.
5. The provider call will target delivered@resend.dev (a provider test address); it will not send to sara@nova.example or another real target. Check Resend's logs for the response.

LIVE MODE
Only after you configure and verify a sending domain in Resend, set EMAIL_FROM to an address on that domain and change EMAIL_TEST_MODE="false". Approval will then send to the intended recipient. Treat this as a consequential side effect and test with an address you control first.

Resend supports Idempotency-Key for duplicate-send protection. Its idempotency window is provider-defined (currently documented as 24 hours), so this is a practical demo integration, not a complete production mail-queue. Keep the app local for now; production needs authentication/authorization, request-origin protection, rate limiting, and stronger operational handling.
