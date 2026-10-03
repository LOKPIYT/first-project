// SnapDot - Application Logic & Interactive Engine

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    contacts: [
      { name: "Sarah", streak: 48 },
      { name: "Alex", streak: 124 },
      { name: "Jake", streak: 15 }
    ],
    message: ".",
    delay: 3.0,
    scheduleHours: 24,
    activeTab: "config",
    simRunning: false
  };

  // DOM Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const tagsBox = document.getElementById('contacts-tags-box');
  const inputNewContact = document.getElementById('input-new-contact');
  const btnAddContact = document.getElementById('btn-add-contact');
  const btnClearContacts = document.getElementById('btn-clear-contacts');
  const btnLoadSamples = document.getElementById('btn-load-samples');
  const recipientCount = document.getElementById('recipient-count');
  const inputMessage = document.getElementById('input-message');
  const presetChips = document.querySelectorAll('.preset-buttons .preset-chip');
  const inputDelay = document.getElementById('input-delay');
  const delayLabel = document.getElementById('delay-label');
  const selectSchedule = document.getElementById('select-schedule');
  const bookmarkletLink = document.getElementById('main-bookmarklet-link');
  const bookmarkletCodeDisplay = document.getElementById('bookmarklet-code-display');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const pythonCodeDisplay = document.getElementById('python-code-display');
  const btnCopyPython = document.getElementById('btn-copy-python');
  const toast = document.getElementById('toast');

  // Device Switcher Elements
  const btnDevicePhone = document.getElementById('btn-device-phone');
  const btnDeviceDesktop = document.getElementById('btn-device-desktop');
  const viewModePhone = document.getElementById('view-mode-phone');
  const viewModeDesktop = document.getElementById('view-mode-desktop');
  const mobileBtnCount = document.getElementById('mobile-btn-count');

  // Mobile Step Runner Modal Elements
  const btnLaunchMobileRunner = document.getElementById('btn-launch-mobile-runner');
  const mobileRunnerModal = document.getElementById('mobile-runner-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalFriendName = document.getElementById('modal-friend-name');
  const modalStepCurr = document.getElementById('modal-step-curr');
  const modalStepTotal = document.getElementById('modal-step-total');
  const modalCopiedText = document.getElementById('modal-copied-text');
  const modalOpenSnapBtn = document.getElementById('modal-open-snap-btn');
  const modalNextFriendBtn = document.getElementById('modal-next-friend-btn');

  // Simulator Elements
  const btnSimStart = document.getElementById('btn-sim-start');
  const btnSimReset = document.getElementById('btn-sim-reset');
  const simProgressFill = document.getElementById('sim-progress-fill');
  const simProgressText = document.getElementById('sim-progress-text');
  const simStatusLabel = document.getElementById('sim-status-label');
  const simTerminal = document.getElementById('sim-terminal');
  const mockupChatList = document.getElementById('mockup-chat-list');
  const mockupActiveName = document.getElementById('mockup-active-name');
  const mockupActiveStreak = document.getElementById('mockup-active-streak');
  const mockupMessagesFeed = document.getElementById('mockup-messages-feed');
  const mockupInputBox = document.getElementById('mockup-input-box');

  // ==========================================
  // DEVICE SWITCHER (Phone vs Desktop)
  // ==========================================
  if (btnDevicePhone && btnDeviceDesktop) {
    btnDevicePhone.addEventListener('click', () => {
      btnDevicePhone.classList.add('active');
      btnDeviceDesktop.classList.remove('active');
      if (viewModePhone) viewModePhone.style.display = 'block';
      if (viewModeDesktop) viewModeDesktop.style.display = 'none';
    });

    btnDeviceDesktop.addEventListener('click', () => {
      btnDeviceDesktop.classList.add('active');
      btnDevicePhone.classList.remove('active');
      if (viewModeDesktop) viewModeDesktop.style.display = 'block';
      if (viewModePhone) viewModePhone.style.display = 'none';
    });
  }

  // ==========================================
  // MOBILE 1-TAP RUNNER MODAL
  // ==========================================
  let currentMobileIndex = 0;

  function updateMobileModalUI() {
    if (state.contacts.length === 0) {
      alert('Please add at least one recipient first!');
      if (mobileRunnerModal) mobileRunnerModal.classList.remove('active');
      return;
    }

    if (currentMobileIndex >= state.contacts.length) {
      // Completed all contacts!
      if (modalFriendName) modalFriendName.innerText = "All Sent!";
      if (modalStepCurr) modalStepCurr.innerText = state.contacts.length;
      if (modalStepTotal) modalStepTotal.innerText = state.contacts.length;
      if (modalCopiedText) modalCopiedText.innerText = "🎉 All Done!";
      if (modalOpenSnapBtn) {
        modalOpenSnapBtn.style.display = 'none';
      }
      if (modalNextFriendBtn) {
        modalNextFriendBtn.innerText = "Close Runner";
        modalNextFriendBtn.className = "btn btn-primary";
      }
      showToast(`Finished sending to all ${state.contacts.length} friends!`);
      return;
    }

    const currentContact = state.contacts[currentMobileIndex];
    if (modalFriendName) modalFriendName.innerText = currentContact.name;
    if (modalStepCurr) modalStepCurr.innerText = currentMobileIndex + 1;
    if (modalStepTotal) modalStepTotal.innerText = state.contacts.length;
    if (modalCopiedText) modalCopiedText.innerText = `"${state.message}"`;

    // Automatically copy message to clipboard
    navigator.clipboard.writeText(state.message).catch(() => {});

    // Set deep link to Snapchat conversation
    if (modalOpenSnapBtn) {
      modalOpenSnapBtn.style.display = 'inline-flex';
      // Official Snapchat URL scheme to launch chat directly
      modalOpenSnapBtn.href = `snapchat://chat/${encodeURIComponent(currentContact.name)}`;
      modalOpenSnapBtn.innerText = `📱 Open Chat with ${currentContact.name}`;
    }

    if (modalNextFriendBtn) {
      const isLast = currentMobileIndex === state.contacts.length - 1;
      modalNextFriendBtn.innerText = isLast ? "Finish 🎉" : `Next Friend (${state.contacts[currentMobileIndex + 1]?.name || 'Next'}) ➔`;
      modalNextFriendBtn.className = "btn btn-secondary";
    }
  }

  if (btnLaunchMobileRunner) {
    btnLaunchMobileRunner.addEventListener('click', () => {
      if (state.contacts.length === 0) {
        alert('Please add at least one recipient first!');
        return;
      }
      currentMobileIndex = 0;
      updateMobileModalUI();
      if (mobileRunnerModal) mobileRunnerModal.classList.add('active');
      showToast(`Copied "${state.message}" to clipboard!`);
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      if (mobileRunnerModal) mobileRunnerModal.classList.remove('active');
    });
  }

  if (modalNextFriendBtn) {
    modalNextFriendBtn.addEventListener('click', () => {
      if (currentMobileIndex >= state.contacts.length) {
        if (mobileRunnerModal) mobileRunnerModal.classList.remove('active');
        return;
      }
      currentMobileIndex++;
      updateMobileModalUI();
    });
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      state.activeTab = tabId;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) targetContent.classList.add('active');

      if (tabId === 'simulator') {
        renderMockupChatList();
      }
    });
  });

  // ==========================================
  // CONTACTS MANAGEMENT
  // ==========================================
  function renderContacts() {
    tagsBox.innerHTML = '';

    if (state.contacts.length === 0) {
      tagsBox.innerHTML = '<span style="color:var(--text-muted); font-size:12px; padding:4px;">No contacts chosen yet. Add at least one person!</span>';
    } else {
      state.contacts.forEach((contact, index) => {
        const chip = document.createElement('div');
        chip.className = 'contact-chip';
        chip.innerHTML = `
          <span><b>${escapeHtml(contact.name)}</b></span>
          <span class="streak-flame">🔥 ${contact.streak}</span>
          <button class="remove-chip" data-index="${index}" title="Remove">✕</button>
        `;

        chip.querySelector('.remove-chip').addEventListener('click', () => {
          state.contacts.splice(index, 1);
          renderContacts();
          updateGeneratedScripts();
          renderMockupChatList();
        });

        tagsBox.appendChild(chip);
      });
    }

    if (recipientCount) recipientCount.innerText = state.contacts.length;
    if (mobileBtnCount) mobileBtnCount.innerText = state.contacts.length;
    updateGeneratedScripts();
  }

  function addContact(name) {
    const trimmed = name.trim().replace(/^@/, '');
    if (!trimmed) return;

    // Support comma-separated batch adding
    if (trimmed.includes(',')) {
      trimmed.split(',').forEach(item => addContact(item));
      return;
    }

    if (!state.contacts.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      state.contacts.push({
        name: trimmed,
        streak: Math.floor(Math.random() * 80) + 12
      });
    }

    renderContacts();
    renderMockupChatList();
  }

  btnAddContact.addEventListener('click', () => {
    addContact(inputNewContact.value);
    inputNewContact.value = '';
    inputNewContact.focus();
  });

  inputNewContact.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addContact(inputNewContact.value);
      inputNewContact.value = '';
    }
  });

  btnClearContacts.addEventListener('click', (e) => {
    e.preventDefault();
    state.contacts = [];
    renderContacts();
    renderMockupChatList();
    showToast('Contacts cleared.');
  });

  btnLoadSamples.addEventListener('click', () => {
    state.contacts = [
      { name: "Sarah", streak: 48 },
      { name: "Alex", streak: 124 },
      { name: "Jake", streak: 15 },
      { name: "Emma", streak: 92 },
      { name: "Liam", streak: 33 }
    ];
    renderContacts();
    renderMockupChatList();
    showToast('Sample contacts loaded!');
  });

  // ==========================================
  // MESSAGE & SETTINGS CONTROLS
  // ==========================================
  inputMessage.addEventListener('input', (e) => {
    state.message = e.target.value || '.';
    updateGeneratedScripts();
  });

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const msg = chip.getAttribute('data-msg');
      state.message = msg;
      inputMessage.value = msg;
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updateGeneratedScripts();
    });
  });

  inputDelay.addEventListener('input', (e) => {
    state.delay = parseFloat(e.target.value);
    delayLabel.innerText = `${state.delay.toFixed(1)}s`;
    updateGeneratedScripts();
  });

  selectSchedule.addEventListener('change', (e) => {
    state.scheduleHours = parseInt(e.target.value);
    updateGeneratedScripts();
  });

  // ==========================================
  // SCRIPT GENERATORS
  // ==========================================
  function generateBookmarkletCode() {
    const contactNames = state.contacts.map(c => c.name);
    const jsonContacts = JSON.stringify(contactNames);
    const msgEscaped = JSON.stringify(state.message);
    const delay = state.delay;
    const schedule = state.scheduleHours;

    // Clean, portable bookmarklet code that runs on web.snapchat.com
    return `javascript:(function(){
      window.__SNAPDOT_CONFIG__={contacts:${jsonContacts},message:${msgEscaped},delay:${delay},schedule:${schedule}};
      const s=document.createElement('script');
      s.src='https://antigravity.luch.dev/site/e3bd3a31-da87-4f61-9f20-7cfe17762e2f/ddc84a24866e2fb73bd64cb4/snapdot-bookmarklet.js?t='+Date.now();
      document.body.appendChild(s);
    })();`.replace(/\s+/g, ' ').trim();
  }

  function generatePythonCode() {
    const contactListPy = state.contacts.map(c => `    "${c.name}"`).join(',\n');
    return `"""
SnapDot - Python Automated Snapchat Streak & Dot Sender
Generated for ${state.contacts.length} recipients.
"""

import asyncio
import random
import time
from datetime import datetime
from playwright.async_api import async_playwright

TARGET_CONTACTS = [
${contactListPy}
]

MESSAGE_TEXT = ${JSON.stringify(state.message)}
DELAY_BETWEEN_PEOPLE_SECONDS = ${state.delay}
REPEAT_INTERVAL_HOURS = ${state.scheduleHours}
USER_DATA_DIR = "./snapchat_browser_session"

async def human_sleep(seconds: float):
    jitter = random.uniform(-0.4, 0.4)
    await asyncio.sleep(max(0.8, seconds + jitter))

async def send_to_contact(page, name: str, msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Finding chat for {name}...")
    el = page.locator(f"text='{name}'").first
    if not await el.is_visible():
        search = page.locator("input[placeholder*='Search']").first
        if await search.is_visible():
            await search.fill(name)
            await human_sleep(1.5)
            await page.locator("div[role='listbox'] div[role='option'], li").first.click()
    else:
        await el.click()

    await human_sleep(1.8)
    box = page.locator("div[contenteditable='true'], div[role='textbox'], textarea").first
    await box.wait_for(state="visible", timeout=7000)
    await box.click()
    await box.fill(msg)
    await human_sleep(0.4)
    await box.press("Enter")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Sent '{msg}' to {name}")

async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(USER_DATA_DIR, headless=False)
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        await page.goto("https://web.snapchat.com")
        input("Log in to Snapchat Web if needed, then press [ENTER]: ")

        while True:
            for idx, c in enumerate(TARGET_CONTACTS, 1):
                try:
                    await send_to_contact(page, c, MESSAGE_TEXT)
                except Exception as e:
                    print(f"Error on {c}: {e}")
                if idx < len(TARGET_CONTACTS):
                    await human_sleep(DELAY_BETWEEN_PEOPLE_SECONDS)

            if REPEAT_INTERVAL_HOURS <= 0:
                break
            print(f"Sleeping for {REPEAT_INTERVAL_HOURS}h...")
            await asyncio.sleep(REPEAT_INTERVAL_HOURS * 3600)

if __name__ == "__main__":
    asyncio.run(main())
`;
  }

  function updateGeneratedScripts() {
    const bmCode = generateBookmarkletCode();
    bookmarkletLink.setAttribute('href', bmCode);
    bookmarkletCodeDisplay.innerText = bmCode;

    const pyCode = generatePythonCode();
    pythonCodeDisplay.innerText = pyCode;
  }

  // Copy code handlers
  btnCopyCode.addEventListener('click', () => {
    navigator.clipboard.writeText(bookmarkletCodeDisplay.innerText).then(() => {
      showToast('Bookmarklet code copied! Paste in Snapchat Web console.');
    });
  });

  btnCopyPython.addEventListener('click', () => {
    navigator.clipboard.writeText(pythonCodeDisplay.innerText).then(() => {
      showToast('Python script copied to clipboard!');
    });
  });

  function showToast(msg) {
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // ==========================================
  // LIVE SIMULATOR ENGINE
  // ==========================================
  function renderMockupChatList(activeIndex = 0) {
    mockupChatList.innerHTML = '';

    if (state.contacts.length === 0) {
      mockupChatList.innerHTML = '<div style="color:#666; font-size:11px; padding:10px; text-align:center;">No contacts in list. Add contacts in Tab 1!</div>';
      mockupActiveName.innerText = "Nobody";
      mockupActiveStreak.innerText = "🔥 0";
      return;
    }

    state.contacts.forEach((contact, idx) => {
      const item = document.createElement('div');
      item.className = `mockup-chat-item ${idx === activeIndex ? 'active' : ''}`;
      item.id = `mock-contact-item-${idx}`;
      item.innerHTML = `
        <div class="mockup-avatar" style="background:${getAvatarColor(contact.name)};">
          ${contact.name.charAt(0).toUpperCase()}
        </div>
        <div class="mockup-chat-info">
          <div class="mockup-chat-name">${escapeHtml(contact.name)}</div>
          <div class="mockup-chat-sub">
            <span style="color:#ff9800;">🔥 ${contact.streak}</span>
            <span>• Tap to chat</span>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        if (!state.simRunning) {
          selectSimContact(idx);
        }
      });

      mockupChatList.appendChild(item);
    });

    selectSimContact(Math.min(activeIndex, state.contacts.length - 1));
  }

  function selectSimContact(idx) {
    if (idx < 0 || idx >= state.contacts.length) return;
    const contact = state.contacts[idx];

    document.querySelectorAll('.mockup-chat-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    mockupActiveName.innerText = contact.name;
    mockupActiveStreak.innerText = `🔥 ${contact.streak}`;
    mockupMessagesFeed.innerHTML = `
      <div class="mock-msg incoming">
        Hey ${contact.name}! Let's keep our streak alive! 🔥
      </div>
    `;
  }

  function getAvatarColor(name) {
    const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f97316'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  }

  function logSim(msg) {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    simTerminal.innerText += `\n[${time}] ${msg}`;
    simTerminal.scrollTop = simTerminal.scrollHeight;
  }

  const delayMs = (ms) => new Promise(res => setTimeout(res, ms));

  async function runSimulation() {
    if (state.contacts.length === 0) {
      alert('Please add at least one recipient first in Tab 1.');
      return;
    }

    if (state.simRunning) return;
    state.simRunning = true;
    btnSimStart.disabled = true;
    btnSimStart.innerText = "⏳ Running...";

    simTerminal.innerText = `[SnapDot Simulator] Starting batch for ${state.contacts.length} recipients...`;
    logSim(`Target message: "${state.message}" | Delay: ${state.delay}s`);

    const total = state.contacts.length;

    for (let i = 0; i < total; i++) {
      const contact = state.contacts[i];
      const progressPercent = Math.round(((i) / total) * 100);
      simProgressFill.style.width = `${progressPercent}%`;
      simProgressText.innerText = `${i} / ${total}`;
      simStatusLabel.innerText = `[${i + 1}/${total}] Opening chat with ${contact.name}...`;

      selectSimContact(i);
      logSim(`Opening chat for "${contact.name}"...`);
      await delayMs(900);

      // Typing animation in input box
      mockupInputBox.innerText = "";
      const textToType = state.message;
      for (let charIdx = 0; charIdx < textToType.length; charIdx++) {
        mockupInputBox.innerText += textToType[charIdx];
        await delayMs(80);
      }
      logSim(`Typed "${state.message}" into message box.`);
      await delayMs(400);

      // Press send
      mockupInputBox.innerText = "Send a chat...";
      const newMsg = document.createElement('div');
      newMsg.className = 'mock-msg outgoing snap-style';
      newMsg.innerHTML = `<span>${escapeHtml(state.message)}</span><div style="font-size:9px; color:#555; text-align:right;">Delivered</div>`;
      mockupMessagesFeed.appendChild(newMsg);
      mockupMessagesFeed.scrollTop = mockupMessagesFeed.scrollHeight;

      // Update streak count
      contact.streak += 1;
      mockupActiveStreak.innerText = `🔥 ${contact.streak}`;
      const itemSub = document.querySelector(`#mock-contact-item-${i} .mockup-chat-sub`);
      if (itemSub) itemSub.innerHTML = `<span style="color:#ff9800;">🔥 ${contact.streak}</span> • Sent just now`;

      logSim(`✅ Delivered "${state.message}" to ${contact.name}. Streak increased to 🔥${contact.streak}!`);

      if (i < total - 1) {
        logSim(`Waiting safety delay (${state.delay}s)...`);
        await delayMs(state.delay * 1000);
      }
    }

    simProgressFill.style.width = `100%`;
    simProgressText.innerText = `${total} / ${total}`;
    simStatusLabel.innerText = `🎉 Finished! Sent to all ${total} contacts.`;
    logSim(`🎉 Simulation complete! All ${total} contacts received "${state.message}".`);

    showToast(`Simulation complete: sent to ${total} friends!`);
    btnSimStart.disabled = false;
    btnSimStart.innerText = "▶ Run Simulation";
    state.simRunning = false;
  }

  btnSimStart.addEventListener('click', () => {
    runSimulation();
  });

  btnSimReset.addEventListener('click', () => {
    state.simRunning = false;
    btnSimStart.disabled = false;
    btnSimStart.innerText = "▶ Run Simulation";
    simProgressFill.style.width = '0%';
    simProgressText.innerText = `0 / ${state.contacts.length}`;
    simStatusLabel.innerText = 'Ready. Click Run Simulation.';
    simTerminal.innerText = '[SnapDot Simulator] Demo reset. Ready to test.';
    renderMockupChatList();
    showToast('Demo reset.');
  });

  // ==========================================
  // UTILITIES
  // ==========================================
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  renderContacts();
  renderMockupChatList();
  updateGeneratedScripts();
});
