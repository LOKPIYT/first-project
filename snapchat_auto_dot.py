"""
SnapDot - Python Automated Snapchat Streak & Dot Sender
Uses Playwright to automate Snapchat Web with your existing browser profile.
Maintains streaks by sending "." or custom messages to chosen contacts on schedule.

Installation:
    pip install playwright
    playwright install chromium

Usage:
    python snapchat_auto_dot.py
"""

import asyncio
import random
import time
from datetime import datetime
from playwright.async_api import async_playwright

# ==========================================
# CONFIGURATION
# ==========================================
# List of friends' display names or usernames as they appear in Snapchat Web
TARGET_CONTACTS = [
    "Sarah",
    "Alex",
    "Jake"
]

# Message to send (default single dot '.')
MESSAGE_TEXT = "."

# Delay between sending each person (in seconds) to avoid spam filters
DELAY_BETWEEN_PEOPLE_SECONDS = 3.5

# Repeat mode: 0 = send once, 24 = repeat every 24 hours (daily streaks), 12 = every 12 hours
REPEAT_INTERVAL_HOURS = 24

# Directory where browser session/cookies will be saved so you only log in once!
USER_DATA_DIR = "./snapchat_browser_session"


async def human_sleep(seconds: float):
    """Sleep with natural human variation."""
    jitter = random.uniform(-0.5, 0.5)
    total = max(0.8, seconds + jitter)
    await asyncio.sleep(total)


async def send_dot_to_contact(page, contact_name: str, message: str) -> bool:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 Locating chat for '{contact_name}'...")

    try:
        # Search for the contact name in the left conversation pane
        # We try finding element with exact or matching text
        contact_el = page.locator(f"text='{contact_name}'").first
        is_visible = await contact_el.is_visible()

        if not is_visible:
            # Try searching via the search bar
            search_input = page.locator("input[placeholder*='Search'], input[type='search']").first
            if await search_input.is_visible():
                await search_input.fill(contact_name)
                await human_sleep(1.5)
                # Click first search result
                result = page.locator("div[role='listbox'] div[role='option'], li").first
                await result.click()
            else:
                print(f"⚠️ Could not find chat for '{contact_name}'")
                return False
        else:
            await contact_el.click()

        # Wait for chat conversation panel to open
        await human_sleep(2.0)

        # Locate the chat input box (contenteditable div or textarea)
        input_box = page.locator(
            "div[contenteditable='true'], div[role='textbox'], textarea[placeholder*='Send a chat']"
        ).first

        await input_box.wait_for(state="visible", timeout=8000)
        await input_box.click()
        await human_sleep(0.5)

        # Type message
        await input_box.fill(message)
        await human_sleep(0.6)

        # Press Enter to send
        await input_box.press("Enter")

        # Also check for send button if enter did not send
        send_btn = page.locator("button[aria-label='Send'], button[type='submit']").first
        if await send_btn.is_visible():
            await send_btn.click()

        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Sent '{message}' to {contact_name}")
        return True

    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Failed to send to {contact_name}: {e}")
        return False


async def run_batch(page):
    print("\n" + "=" * 50)
    print(f"🚀 Starting SnapDot batch for {len(TARGET_CONTACTS)} contacts...")
    print(f"Message: '{MESSAGE_TEXT}' | Delay: {DELAY_BETWEEN_PEOPLE_SECONDS}s")
    print("=" * 50)

    success = 0
    for idx, name in enumerate(TARGET_CONTACTS, 1):
        print(f"\n({idx}/{len(TARGET_CONTACTS)}) Processing: {name}")
        ok = await send_dot_to_contact(page, name, MESSAGE_TEXT)
        if ok:
            success += 1

        if idx < len(TARGET_CONTACTS):
            print(f"⏳ Waiting {DELAY_BETWEEN_PEOPLE_SECONDS}s before next contact...")
            await human_sleep(DELAY_BETWEEN_PEOPLE_SECONDS)

    print("\n" + "=" * 50)
    print(f"🎉 Batch complete! Successfully sent to {success}/{len(TARGET_CONTACTS)} contacts.")
    print("=" * 50 + "\n")


async def main():
    print("=" * 60)
    print("👻 SnapDot: Automatic Snapchat Streak & Dot Sender")
    print("=" * 60)
    print(f"Target contacts: {TARGET_CONTACTS}")
    print(f"Message: '{MESSAGE_TEXT}'")
    print(f"Repeat schedule: Every {REPEAT_INTERVAL_HOURS} hours" if REPEAT_INTERVAL_HOURS > 0 else "Repeat: Single Run")
    print("-" * 60)

    async with async_playwright() as p:
        # Launch persistent browser so cookies & login are remembered!
        print("🌐 Launching Chromium browser with persistent profile...")
        context = await p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=False,  # Set to True once logged in
            viewport={"width": 1280, "height": 800},
            args=["--disable-blink-features=AutomationControlled"]
        )

        page = context.pages[0] if context.pages else await context.new_page()
        await page.goto("https://web.snapchat.com", wait_until="networkidle")

        print("\n🔑 Please ensure you are logged into Snapchat Web.")
        print("If this is your first time, log in manually in the opened browser window.")
        print("Press Enter in this console once you see your chats on Snapchat Web...")
        input("Press [ENTER] to start automation: ")

        while True:
            await run_batch(page)

            if REPEAT_INTERVAL_HOURS <= 0:
                print("Single batch finished. Exiting.")
                break

            sleep_seconds = REPEAT_INTERVAL_HOURS * 3600
            next_run = datetime.fromtimestamp(time.time() + sleep_seconds).strftime('%Y-%m-%d %H:%M:%S')
            print(f"⏰ Sleeping for {REPEAT_INTERVAL_HOURS} hours until next streak batch ({next_run})...")
            await asyncio.sleep(sleep_seconds)

        await context.close()


if __name__ == "__main__":
    asyncio.run(main())
