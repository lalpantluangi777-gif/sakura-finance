SAKURA FINANCE - PHONE APP (installable web app / PWA)
=====================================================

WHAT IT IS
  The same idea as the desktop app, made for phones: pink and white, Personal / Business modes,
  dashboard, activity, budgets, invoices (business), assistant that understands English and Mizo.
  It works offline once opened, and it can be installed on the home screen like a normal app.

PUT IT ON YOUR PHONE (free, about 5 minutes)
  A phone app of this kind must be opened from an https:// address (this is what makes encryption and
  fingerprint unlock possible). The easiest free way:
   1. On your computer open https://app.netlify.com/drop  (make a free account).
   2. Drag the whole folder "sakura_mobile" onto the page. You get an address like https://something.netlify.app
   3. Open that address on your phone in Chrome (Android) or Safari (iPhone).
   4. Chrome: menu (3 dots) > "Install app" / "Add to Home screen".   Safari: Share > "Add to Home Screen".
  (GitHub Pages or Cloudflare Pages work the same way.)

TRY IT ON YOUR COMPUTER FIRST
  Open cmd in this folder and run:  python -m http.server 8000
  Then open  http://localhost:8000  in Chrome.   (localhost counts as safe; 127.0.0.1 or a LAN IP will NOT
  allow fingerprint unlock.)

SECURITY - WHAT IS REAL
  * You create an account on the phone with a password (min. 8 characters). Nothing is sent anywhere:
    there is no server, no sign-up online, no analytics, no third-party scripts.
  * Your data is encrypted with AES-256-GCM. A random data key does the encrypting; your password protects
    that key (PBKDF2-SHA256, 310,000 rounds). If someone copies the phone's storage they only get ciphertext.
  * Tamper detection: if even one byte of the stored data is changed, it will not open (GCM authentication).
  * Fingerprint / face unlock (Settings > Security): uses the phone's WebAuthn passkey with the PRF extension,
    so the biometric really releases the key (it is not just a screen lock). If the phone/browser does not
    support PRF, the app says so and password unlock still works.
  * Wrong passwords are slowed down (locked 15s, 30s, 60s ... up to 15 min) and the app auto-locks after
    1-10 minutes of inactivity (default 2) or 30 seconds in the background.
  * The page uses a strict Content-Security-Policy and never inserts text as HTML, which blocks script injection.
  * Backups: Settings > Export encrypted backup. The file is useless without your password.

HONEST LIMITS
  * THERE IS NO "FORGOT PASSWORD". Without the password (or the backup + password) data cannot be recovered.
  * It protects against a lost phone or someone browsing the storage. It cannot protect against a phone that is
    already infected with spyware, or a rooted device controlled by an attacker.
  * "Integrity" in the sense of Google Play Integrity / app attestation exists only for native Android apps with
    a server. A web app cannot use it. Tamper detection of YOUR DATA is included (see above).
  * Data lives per browser/phone. Moving to another phone = export backup, import there.
  * The assistant is rule-based and offline (no AI service). Mizo words were written by an AI; ask a Mizo speaker
    to correct them in app.js (LANG.lus).


=====================================================
NEW: AUTO-ADD, THEMES, STUDENT MODE, MORE LANGUAGES
=====================================================
1) AUTO-ADD (no typing each entry)
   Tap the pink/red "Add from bank SMS / UPI / statement" button (Home or Activity).
   a) Messages: paste one or many bank / UPI / GPay / card SMS. Sakura finds the
      amount, debit or credit, shop/person, date and reference number, picks a
      category, skips OTP and bill-reminder messages, and shows a list to tick.
   b) Statement file: choose the .csv you download from your bank app or
      net-banking (comma / semicolon / tab separated are all fine).
   c) Android: after you install the app, in your Messages app long-press an
      SMS -> Share -> Sakura. The text arrives already filled in.
   d) If you change a category once, Sakura remembers it for that shop next time.
   e) Duplicates are ignored (same message/row is never added twice).
   f) Subscriptions (Netflix, Spotify ...) are detected automatically and listed.

   HONEST LIMIT: a website/PWA cannot read your SMS or log in to a bank or GPay
   by itself - phones and banks do not allow it, and Google Pay has no public
   API for personal data. True "hands-free" sync needs one of:
     * India: RBI Account Aggregator (Finvu, OneMoney, Anumati ...) - needs a
       registered company + server.
     * World: Plaid / TrueLayer / Salt Edge bank-connection services.
     * A native Android app with SMS permission (Google restricts this for
       Play Store apps).
   Sakura is written so that such a feed can call the same parser later.

2) THEMES: Settings -> Theme: Pink & White, Black & Red, or Automatic
   (follows the phone's dark mode).

3) STUDENT MODE (school / college): third choice on the first screen, or the
   switch at the top. Separate book, weekly allowance card, savings goals.

4) LANGUAGES: English, Mizo, Hindi, Bengali, Spanish, French, German, Chinese.
   Settings -> Language. Add any other language: Settings -> Language pack ->
   download template, translate the right-hand side, import the file.
   Translations other than English/Mizo are a first draft - please have a
   native speaker check them. The typing/voice assistant understands English
   and Mizo only.

5) COMPANIES / VERY LARGE ORGANISATIONS: this app keeps data on one phone
   (encrypted). A big company needs a server, user accounts, approvals and
   audit logs - that is the next stage, not part of this mini-project.


=====================================================
ACCOUNT LOGIN (Firebase): Google + email + password reset
=====================================================
Files: account.html, account.js, firebase-config.js (your public Firebase web config).
- Onboarding and Settings show an "Account (optional)" card -> Sign in / Sign up.
- Sign in with Google, or email + password, or "Forgot password" (Firebase sends the email).
- Sign-up also sends a verification email.
- The sign-in page is separate from the main app, so the main app keeps its strict
  security policy and never loads Google scripts.

Firebase console checklist (must be done once):
  1. Authentication -> Sign-in method: Email/Password = Enabled, Google = Enabled.
  2. Authentication -> Settings -> Authorized domains: add your site (user.github.io).

IMPORTANT, in plain words:
- Signing in only proves who you are and fills your name/email. Your transactions are NOT
  uploaded; there is no cloud sync, so a new phone starts empty unless you restore a backup.
- The app lock password (which encrypts your data) is separate from the Firebase password.
  "Reset password email" changes only the online account password. If the app lock password
  is forgotten, the data cannot be recovered; use a backup file or erase and start fresh.
- Phone-number (SMS) login is not included: Firebase charges for SMS.
