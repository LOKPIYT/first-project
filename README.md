# 👻 SnapDot — Snapchat Automatic "." Sender & Streak Keeper

> **Automatically send "." or custom streak messages to chosen Snapchat contacts with smart anti-ban protection.**

Available live on the web: **[Launch SnapDot Web App](https://antigravity.luch.dev/site/e3bd3a31-da87-4f61-9f20-7cfe17762e2f/ddc84a24866e2fb73bd64cb4/)**

---

## 🌟 Features

- **Multi-Recipient Selector**: Choose one, multiple, or all your friends.
- **Auto "." Sending**: Sends a single dot (`.`) or streak emojis (`🔥 .`) to keep streaks alive.
- **Smart Anti-Spam Delays**: Customizable randomized human delay (1.5s - 8s) between messages to prevent rate-limiting and protect your account.
- **Live Simulator**: Test the entire automation workflow inside a realistic Snapchat Web interactive preview before using it.
- **Multiple Running Options**:
  1. **1-Click Bookmarklet / Console Runner**: Runs instantly on [web.snapchat.com](https://web.snapchat.com).
  2. **Tampermonkey / Violentmonkey UserScript (`snapdot.user.js`)**: Auto-injects whenever you visit Snapchat Web.
  3. **Python Playwright Script (`snapchat_auto_dot.py`)**: Runs fully automated in the background on PC, Mac, or Linux server.
  4. **Mobile Guide**: Instructions for Android AutoClicker and iOS Shortcuts.

---

## 🚀 How to Use

### Method 1: Snapchat Web Bookmarklet (Recommended)

1. Open the [SnapDot Generator](https://antigravity.luch.dev/site/e3bd3a31-da87-4f61-9f20-7cfe17762e2f/ddc84a24866e2fb73bd64cb4/).
2. Add the friends you want to send `.` to.
3. Drag the **SnapDot Bookmarklet** button to your bookmarks bar, or click **Copy Code**.
4. Go to **[web.snapchat.com](https://web.snapchat.com)** and log in.
5. Click your bookmarklet (or press `F12` -> Console and paste the code).
6. The SnapDot control panel will open right inside Snapchat Web. Click **"Start Auto-Sending"**!

### Method 2: Python Background Script

1. Install Playwright:
   ```bash
   pip install playwright
   playwright install chromium
   ```
2. Run the script:
   ```bash
   python snapchat_auto_dot.py
   ```
3. Log in once on Snapchat Web in the browser window that appears.
4. Press Enter in terminal — it will send `.` to your chosen contacts and repeat on your schedule (e.g. every 24 hours).

---

## 🔒 Safety & Guidelines

Snapchat monitors for bot-like behavior. SnapDot includes:
- Jittered typing delays.
- Standard browser sessions (no third-party API tokens).
- Recommended delay of **3+ seconds** between contacts.

*Designed for personal streak keeping and educational purposes.*
