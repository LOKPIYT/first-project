// ==UserScript==
// @name         SnapDot - Snapchat Auto "." Sender & Streak Keeper
// @namespace    https://antigravity.luch.dev/
// @version      1.0.0
// @description  Automatically send "." or custom streak messages to chosen contacts on Snapchat Web
// @author       SnapDot Tool
// @match        https://web.snapchat.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__SNAPDOT_INITIALIZED__) {
    const existing = document.getElementById('snapdot-floating-widget');
    if (existing) {
      existing.style.display = existing.style.display === 'none' ? 'block' : 'none';
      return;
    }
  }
  window.__SNAPDOT_INITIALIZED__ = true;

  console.log('[SnapDot] Initializing Snapchat Web Auto-Sender...');

  // State management
  const state = {
    selectedContacts: [], // array of names or IDs
    detectedContacts: [],
    messageText: '.',
    delaySeconds: 3,
    repeatIntervalHours: 0, // 0 = send once
    isRunning: false,
    timerId: null,
    repeatTimerId: null,
    logs: []
  };

  // Helper: Sleep with random jitter (+/- 500ms)
  const sleep = (ms) => {
    const jitter = (Math.random() * 1000) - 500;
    const finalMs = Math.max(800, ms + jitter);
    return new Promise(resolve => setTimeout(resolve, finalMs));
  };

  // Create UI Widget
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'snapdot-floating-widget';
    container.innerHTML = `
      <style>
        #snapdot-floating-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 360px;
          max-height: 85vh;
          background: #121316;
          color: #ffffff;
          border-radius: 18px;
          border: 1px solid rgba(255, 252, 0, 0.35);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 252, 0, 0.12);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          z-index: 999999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #snapdot-floating-widget.minimized {
          max-height: 48px;
          width: 220px;
        }
        .snapdot-header {
          background: #1a1c23;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: move;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          user-select: none;
        }
        .snapdot-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          color: #fffc00;
        }
        .snapdot-title svg {
          fill: #fffc00;
          width: 18px;
          height: 18px;
        }
        .snapdot-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .snapdot-icon-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #ccc;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
        }
        .snapdot-icon-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .snapdot-body {
          padding: 14px 16px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .snapdot-section-label {
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9aa0a6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .snapdot-badge {
          background: rgba(255, 252, 0, 0.15);
          color: #fffc00;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .snapdot-input {
          width: 100%;
          background: #1d1f27;
          border: 1px solid #2d313d;
          border-radius: 8px;
          padding: 8px 10px;
          color: #fff;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
        }
        .snapdot-input:focus {
          border-color: #fffc00;
        }
        .snapdot-contacts-box {
          background: #181920;
          border: 1px solid #262933;
          border-radius: 8px;
          max-height: 140px;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .snapdot-contact-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .snapdot-contact-row:hover {
          background: rgba(255, 252, 0, 0.08);
        }
        .snapdot-contact-row input[type="checkbox"] {
          accent-color: #fffc00;
          cursor: pointer;
        }
        .snapdot-contact-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .snapdot-row-inline {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .snapdot-btn {
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: 0.15s;
        }
        .snapdot-btn-primary {
          background: #fffc00;
          color: #000;
        }
        .snapdot-btn-primary:hover {
          background: #ffe600;
          box-shadow: 0 4px 12px rgba(255, 252, 0, 0.3);
        }
        .snapdot-btn-secondary {
          background: #252834;
          color: #fff;
        }
        .snapdot-btn-secondary:hover {
          background: #313545;
        }
        .snapdot-btn-danger {
          background: #e53935;
          color: #fff;
        }
        .snapdot-btn-danger:hover {
          background: #d32f2f;
        }
        .snapdot-log {
          background: #090a0d;
          border-radius: 8px;
          padding: 8px;
          font-family: monospace;
          font-size: 11px;
          color: #8be9fd;
          max-height: 80px;
          overflow-y: auto;
          white-space: pre-wrap;
          line-height: 1.4;
          border: 1px solid #1a1c22;
        }
        .snapdot-status {
          font-size: 11px;
          color: #9aa0a6;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .snapdot-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4caf50;
        }
        .snapdot-status-dot.idle { background: #9e9e9e; }
        .snapdot-status-dot.active { background: #fffc00; box-shadow: 0 0 8px #fffc00; }
        .snapdot-status-dot.error { background: #f44336; }
      </style>

      <div class="snapdot-header" id="snapdot-drag-handle">
        <div class="snapdot-title">
          <svg viewBox="0 0 24 24"><path d="M12 2C7.58 2 4 5.58 4 10c0 2.03.76 3.87 2.01 5.27-.12.44-.32 1.15-.9 2.05-.2.31-.05.73.29.83.94.27 2.06.18 2.94-.3.97.52 2.09.85 3.26.85 1.17 0 2.29-.33 3.26-.85.88.48 2 .57 2.94.3.34-.1.49-.52.29-.83-.58-.9-.78-1.61-.9-2.05C19.24 13.87 20 12.03 20 10c0-4.42-3.58-8-8-8z"/></svg>
          <span>SnapDot Auto-Sender</span>
        </div>
        <div class="snapdot-controls">
          <button class="snapdot-icon-btn" id="snapdot-btn-min" title="Minimize">_</button>
          <button class="snapdot-icon-btn" id="snapdot-btn-close" title="Close">✕</button>
        </div>
      </div>

      <div class="snapdot-body" id="snapdot-body-content">
        <!-- Message Setting -->
        <div>
          <div class="snapdot-section-label">
            <span>Message to Send</span>
            <span class="snapdot-badge">Auto "."</span>
          </div>
          <div style="display:flex; gap:6px; margin-top:5px;">
            <input type="text" id="snapdot-msg-input" class="snapdot-input" value="." placeholder="Type message (default .)" />
            <button class="snapdot-btn snapdot-btn-secondary" id="snapdot-msg-dot" title="Reset to .">.</button>
            <button class="snapdot-btn snapdot-btn-secondary" id="snapdot-msg-fire" title="Set to 🔥 .">🔥</button>
          </div>
        </div>

        <!-- Contacts Selection -->
        <div>
          <div class="snapdot-section-label">
            <span>Select Recipients (<span id="snapdot-count">0</span>)</span>
            <div style="display:flex; gap:6px;">
              <a href="#" id="snapdot-select-all" style="color:#fffc00; font-size:10px; text-decoration:none;">All</a>
              <span style="color:#555;">|</span>
              <a href="#" id="snapdot-refresh-chats" style="color:#fffc00; font-size:10px; text-decoration:none;">Scan Chats</a>
            </div>
          </div>
          <div class="snapdot-contacts-box" id="snapdot-contacts-list" style="margin-top:5px;">
            <div style="color:#777; text-align:center; padding:12px 0;">Scanning chats...</div>
          </div>
          <!-- Manual Add Input -->
          <div style="display:flex; gap:6px; margin-top:6px;">
            <input type="text" id="snapdot-manual-contact" class="snapdot-input" placeholder="Or type username/name..." />
            <button class="snapdot-btn snapdot-btn-secondary" id="snapdot-add-manual" style="white-space:nowrap;">+ Add</button>
          </div>
        </div>

        <!-- Interval & Delay -->
        <div>
          <div class="snapdot-section-label">
            <span>Delay Between People</span>
            <span id="snapdot-delay-val">3s</span>
          </div>
          <input type="range" id="snapdot-delay-range" min="2" max="10" value="3" step="0.5" style="width:100%; accent-color:#fffc00; margin-top:4px;" />
        </div>

        <!-- Repeat Mode -->
        <div>
          <div class="snapdot-section-label">
            <span>Repeat / Schedule</span>
          </div>
          <select id="snapdot-repeat-select" class="snapdot-input" style="margin-top:4px;">
            <option value="0">Send Once (Immediate Batch)</option>
            <option value="12">Repeat Every 12 Hours (Streaks)</option>
            <option value="24" selected>Repeat Every 24 Hours (Daily Streaks)</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; gap:8px; margin-top:4px;">
          <button class="snapdot-btn snapdot-btn-primary" id="snapdot-start-btn" style="flex:1;">
            ▶ Start Auto-Sending
          </button>
          <button class="snapdot-btn snapdot-btn-danger" id="snapdot-stop-btn" style="display:none;">
            ⏹ Stop
          </button>
        </div>

        <!-- Live Log / Status -->
        <div class="snapdot-status">
          <div class="snapdot-status-dot idle" id="snapdot-status-indicator"></div>
          <span id="snapdot-status-text">Ready. Choose people and click start.</span>
        </div>
        <div class="snapdot-log" id="snapdot-log-box">[SnapDot] Tool ready.</div>
      </div>
    `;

    document.body.appendChild(container);

    // Minimize & Close events
    const minBtn = container.querySelector('#snapdot-btn-min');
    const closeBtn = container.querySelector('#snapdot-btn-close');
    const bodyContent = container.querySelector('#snapdot-body-content');

    minBtn.addEventListener('click', () => {
      container.classList.toggle('minimized');
      bodyContent.style.display = container.classList.contains('minimized') ? 'none' : 'flex';
      minBtn.innerText = container.classList.contains('minimized') ? '+' : '_';
    });

    closeBtn.addEventListener('click', () => {
      stopAutoSend();
      container.remove();
      window.__SNAPDOT_INITIALIZED__ = false;
    });

    // Make Draggable
    makeDraggable(container, container.querySelector('#snapdot-drag-handle'));

    // Hook widget controls
    setupWidgetEvents(container);

    // Initial scan of chats
    scanSnapchatChats();
  }

  // Draggable HUD utility
  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Log to widget console
  function log(msg) {
    console.log(`[SnapDot] ${msg}`);
    const logBox = document.getElementById('snapdot-log-box');
    if (logBox) {
      const time = new Date().toLocaleTimeString().split(' ')[0];
      logBox.innerText += `\n[${time}] ${msg}`;
      logBox.scrollTop = logBox.scrollHeight;
    }
  }

  function setStatus(text, type = 'idle') {
    const statusText = document.getElementById('snapdot-status-text');
    const statusIndicator = document.getElementById('snapdot-status-indicator');
    if (statusText) statusText.innerText = text;
    if (statusIndicator) {
      statusIndicator.className = `snapdot-status-dot ${type}`;
    }
  }

  // Scan Snapchat Web for visible conversation items
  function scanSnapchatChats() {
    log('Scanning chat list on Snapchat Web...');
    const listContainer = document.getElementById('snapdot-contacts-list');
    if (!listContainer) return;

    // Look for chat elements across multiple known Snapchat Web layouts
    const found = [];

    // Strategy 1: Look for items with text in the left navigation panel
    const possibleChatRows = document.querySelectorAll('li, div[role="row"], div[role="button"], div[class*="chatListItem"], div[class*="listItem"], div[class*="Conversation"]');

    possibleChatRows.forEach((el) => {
      // Must have reasonable text length (display name or username)
      const text = el.innerText ? el.innerText.split('\n')[0].trim() : '';
      if (text && text.length > 1 && text.length < 35 && !['Chats', 'Stories', 'Spotlight', 'Map', 'Search', 'Filter', 'Settings', 'New Chat'].includes(text)) {
        if (!found.some(f => f.name === text)) {
          found.push({
            name: text,
            element: el
          });
        }
      }
    });

    state.detectedContacts = found;
    renderContactsList();
  }

  function renderContactsList() {
    const listContainer = document.getElementById('snapdot-contacts-list');
    const countBadge = document.getElementById('snapdot-count');
    if (!listContainer) return;

    if (state.detectedContacts.length === 0) {
      listContainer.innerHTML = `
        <div style="color:#888; text-align:center; padding:10px; font-size:11px;">
          No chats found automatically yet.<br/>
          Type names below to add friends manually!
        </div>
      `;
      if (countBadge) countBadge.innerText = '0';
      return;
    }

    listContainer.innerHTML = '';
    state.detectedContacts.forEach((contact, idx) => {
      const isChecked = state.selectedContacts.includes(contact.name);
      const row = document.createElement('label');
      row.className = 'snapdot-contact-row';
      row.innerHTML = `
        <input type="checkbox" data-index="${idx}" ${isChecked ? 'checked' : ''} />
        <span class="snapdot-contact-name">${escapeHTML(contact.name)}</span>
      `;

      row.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!state.selectedContacts.includes(contact.name)) {
            state.selectedContacts.push(contact.name);
          }
        } else {
          state.selectedContacts = state.selectedContacts.filter(n => n !== contact.name);
        }
        if (countBadge) countBadge.innerText = state.selectedContacts.length;
      });

      listContainer.appendChild(row);
    });

    if (countBadge) countBadge.innerText = state.selectedContacts.length;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Hook all events inside the floating widget
  function setupWidgetEvents(container) {
    const msgInput = container.querySelector('#snapdot-msg-input');
    const dotBtn = container.querySelector('#snapdot-msg-dot');
    const fireBtn = container.querySelector('#snapdot-msg-fire');
    const selectAllBtn = container.querySelector('#snapdot-select-all');
    const refreshBtn = container.querySelector('#snapdot-refresh-chats');
    const manualInput = container.querySelector('#snapdot-manual-contact');
    const addManualBtn = container.querySelector('#snapdot-add-manual');
    const delayRange = container.querySelector('#snapdot-delay-range');
    const delayVal = container.querySelector('#snapdot-delay-val');
    const repeatSelect = container.querySelector('#snapdot-repeat-select');
    const startBtn = container.querySelector('#snapdot-start-btn');
    const stopBtn = container.querySelector('#snapdot-stop-btn');

    dotBtn.addEventListener('click', () => { msgInput.value = '.'; state.messageText = '.'; });
    fireBtn.addEventListener('click', () => { msgInput.value = '🔥 .'; state.messageText = '🔥 .'; });

    msgInput.addEventListener('input', (e) => {
      state.messageText = e.target.value || '.';
    });

    delayRange.addEventListener('input', (e) => {
      state.delaySeconds = parseFloat(e.target.value);
      delayVal.innerText = `${state.delaySeconds}s`;
    });

    repeatSelect.addEventListener('change', (e) => {
      state.repeatIntervalHours = parseFloat(e.target.value);
    });

    selectAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const allSelected = state.selectedContacts.length === state.detectedContacts.length;
      if (allSelected) {
        state.selectedContacts = [];
      } else {
        state.selectedContacts = state.detectedContacts.map(c => c.name);
      }
      renderContactsList();
    });

    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scanSnapchatChats();
    });

    // Add manual contact
    const handleAddManual = () => {
      const name = manualInput.value.trim();
      if (!name) return;
      if (!state.detectedContacts.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        state.detectedContacts.push({ name, element: null });
      }
      if (!state.selectedContacts.includes(name)) {
        state.selectedContacts.push(name);
      }
      manualInput.value = '';
      renderContactsList();
      log(`Added contact "${name}"`);
    };

    addManualBtn.addEventListener('click', handleAddManual);
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddManual();
    });

    startBtn.addEventListener('click', () => {
      startAutoSend();
    });

    stopBtn.addEventListener('click', () => {
      stopAutoSend();
    });
  }

  // Core Automation: Send message to one conversation
  async function sendToContact(contactName, message) {
    log(`Opening conversation with: "${contactName}"...`);

    // 1. Locate and click on the friend's conversation in the list or via search
    let clicked = false;

    // Search for element with this text
    const elements = Array.from(document.querySelectorAll('*'));
    for (const el of elements) {
      if (el.children.length === 0 && el.innerText && el.innerText.trim() === contactName) {
        const clickable = el.closest('button') || el.closest('div[role="button"]') || el.closest('li') || el;
        clickable.click();
        clicked = true;
        log(`Clicked conversation: ${contactName}`);
        break;
      }
    }

    if (!clicked) {
      // Fallback: Use Snapchat's search box if available
      const searchBox = document.querySelector('input[type="search"], input[placeholder*="Search"]');
      if (searchBox) {
        searchBox.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, contactName);
        searchBox.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(1500);

        // Click first search result
        const firstResult = document.querySelector('div[role="listbox"] div[role="option"], div[class*="searchResult"]');
        if (firstResult) {
          firstResult.click();
          clicked = true;
        }
      }
    }

    // Wait for chat pane to load
    await sleep(2000);

    // 2. Find chat input box
    const chatInput = document.querySelector(
      'div[contenteditable="true"], div[role="textbox"], textarea[placeholder*="Send a chat"], textarea'
    );

    if (!chatInput) {
      log(`⚠️ Could not find chat text box for "${contactName}". Skipping.`);
      return false;
    }

    // 3. Focus and type the message (e.g. ".")
    chatInput.focus();
    await sleep(300);

    // React/DraftJS/Lexical input simulation
    let inserted = document.execCommand('insertText', false, message);
    if (!inserted || chatInput.innerText.trim() !== message.trim()) {
      chatInput.innerText = message;
      chatInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: message }));
    }

    await sleep(600);

    // 4. Send: press Enter or click send button
    chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    chatInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    chatInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

    // Also look for send button
    const sendBtn = document.querySelector('button[aria-label="Send"], button[type="submit"], button[data-testid="send-chat-button"]');
    if (sendBtn) {
      sendBtn.click();
    }

    log(`✅ Successfully sent "${message}" to ${contactName}`);
    return true;
  }

  // Start execution loop
  async function startAutoSend() {
    if (state.selectedContacts.length === 0) {
      alert('Please select or add at least one recipient first!');
      return;
    }

    state.isRunning = true;
    updateButtonStates();
    setStatus(`Running: sending to ${state.selectedContacts.length} people...`, 'active');

    log(`🚀 Starting auto-sender. Message: "${state.messageText}" | Delay: ${state.delaySeconds}s`);

    let successCount = 0;
    for (let i = 0; i < state.selectedContacts.length; i++) {
      if (!state.isRunning) {
        log('⏹ Stopped by user.');
        break;
      }

      const contact = state.selectedContacts[i];
      setStatus(`[${i + 1}/${state.selectedContacts.length}] Sending to ${contact}...`, 'active');

      try {
        const ok = await sendToContact(contact, state.messageText);
        if (ok) successCount++;
      } catch (err) {
        log(`❌ Error sending to ${contact}: ${err.message}`);
      }

      // Delay between recipients to keep account safe
      if (i < state.selectedContacts.length - 1 && state.isRunning) {
        log(`Waiting ${state.delaySeconds}s before next contact...`);
        await sleep(state.delaySeconds * 1000);
      }
    }

    if (state.isRunning) {
      log(`🎉 Finished batch! Sent to ${successCount}/${state.selectedContacts.length} people.`);

      // Check if repeat schedule is configured
      if (state.repeatIntervalHours > 0) {
        const hours = state.repeatIntervalHours;
        const nextTime = new Date(Date.now() + hours * 3600 * 1000).toLocaleTimeString();
        setStatus(`Streaks Active. Next repeat in ${hours}h (at ${nextTime})`, 'active');
        log(`⏰ Streak scheduled: will repeat in ${hours} hours.`);

        state.repeatTimerId = setTimeout(() => {
          if (state.isRunning) {
            startAutoSend();
          }
        }, hours * 3600 * 1000);
      } else {
        state.isRunning = false;
        setStatus(`Completed (${successCount} sent).`, 'idle');
        updateButtonStates();
      }
    }
  }

  function stopAutoSend() {
    state.isRunning = false;
    if (state.repeatTimerId) {
      clearTimeout(state.repeatTimerId);
      state.repeatTimerId = null;
    }
    updateButtonStates();
    setStatus('Stopped.', 'idle');
    log('⏹ Process halted.');
  }

  function updateButtonStates() {
    const startBtn = document.getElementById('snapdot-start-btn');
    const stopBtn = document.getElementById('snapdot-stop-btn');
    if (startBtn && stopBtn) {
      if (state.isRunning) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
      } else {
        startBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
      }
    }
  }

  // Launch Widget
  createWidget();
})();
