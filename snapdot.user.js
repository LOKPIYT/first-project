// ==UserScript==
// @name         SnapDot - Automatic Snapchat Streak & Dot Sender
// @namespace    https://antigravity.luch.dev/
// @version      1.0.0
// @description  Automatically send "." or custom streak messages to chosen contacts on Snapchat Web
// @author       SnapDot
// @match        https://web.snapchat.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=snapchat.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  function waitForSnapchat() {
    if (document.body) {
      const script = document.createElement('script');
      script.src = 'https://antigravity.luch.dev/site/e3bd3a31-da87-4f61-9f20-7cfe17762e2f/ddc84a24866e2fb73bd64cb4/snapdot-bookmarklet.js';
      script.onerror = () => {
        // Fallback: embed directly if network is offline
        console.log('[SnapDot] Initializing embedded core...');
      };
      // Inject directly
      loadEmbeddedCore();
    } else {
      setTimeout(waitForSnapchat, 500);
    }
  }

  function loadEmbeddedCore() {
    if (window.__SNAPDOT_INITIALIZED__) return;
    window.__SNAPDOT_INITIALIZED__ = true;

    const state = {
      selectedContacts: [],
      detectedContacts: [],
      messageText: '.',
      delaySeconds: 3,
      repeatIntervalHours: 24,
      isRunning: false,
      repeatTimerId: null
    };

    const sleep = (ms) => {
      const jitter = (Math.random() * 1000) - 500;
      return new Promise(r => setTimeout(r, Math.max(800, ms + jitter)));
    };

    function injectUI() {
      const container = document.createElement('div');
      container.id = 'snapdot-floating-widget';
      container.innerHTML = `
        <style>
          #snapdot-floating-widget {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 350px;
            max-height: 85vh;
            background: #121316;
            color: #ffffff;
            border-radius: 16px;
            border: 1px solid rgba(255, 252, 0, 0.4);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 252, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            z-index: 9999999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .sd-head {
            background: #1a1c23;
            padding: 12px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 700;
            color: #fffc00;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: move;
          }
          .sd-body {
            padding: 12px 14px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .sd-input {
            width: 100%;
            background: #1a1c22;
            border: 1px solid #2d313d;
            border-radius: 8px;
            padding: 7px 10px;
            color: #fff;
            box-sizing: border-box;
            outline: none;
          }
          .sd-input:focus { border-color: #fffc00; }
          .sd-list {
            background: #16171d;
            border: 1px solid #262933;
            border-radius: 8px;
            max-height: 130px;
            overflow-y: auto;
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .sd-btn {
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .sd-btn-yellow { background: #fffc00; color: #000; }
          .sd-btn-yellow:hover { background: #ffe600; }
          .sd-btn-sub { background: #252834; color: #fff; }
          .sd-btn-red { background: #e53935; color: #fff; }
          .sd-log {
            background: #090a0d;
            border-radius: 8px;
            padding: 6px 8px;
            font-family: monospace;
            font-size: 11px;
            color: #8be9fd;
            max-height: 75px;
            overflow-y: auto;
          }
        </style>
        <div class="sd-head" id="sd-header">
          <span>👻 SnapDot Auto-Sender</span>
          <div>
            <button id="sd-close-btn" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:14px;">✕</button>
          </div>
        </div>
        <div class="sd-body">
          <div>
            <div style="font-size:11px; color:#888; font-weight:600; margin-bottom:4px; text-transform:uppercase;">Message to Send</div>
            <div style="display:flex; gap:6px;">
              <input type="text" id="sd-msg-input" class="sd-input" value="." />
              <button class="sd-btn sd-btn-sub" id="sd-msg-dot">.</button>
              <button class="sd-btn sd-btn-sub" id="sd-msg-fire">🔥</button>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:#888; font-weight:600; margin-bottom:4px;">
              <span>Recipients (<span id="sd-count">0</span>)</span>
              <a href="#" id="sd-scan-btn" style="color:#fffc00; text-decoration:none;">Scan Chats</a>
            </div>
            <div class="sd-list" id="sd-contacts-box">
              <div style="color:#777; text-align:center; padding:10px;">Click 'Scan Chats' or add below</div>
            </div>
            <div style="display:flex; gap:6px; margin-top:6px;">
              <input type="text" id="sd-manual-input" class="sd-input" placeholder="Type friend's name..." />
              <button class="sd-btn sd-btn-sub" id="sd-manual-add">+ Add</button>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <div style="flex:1;">
              <label style="font-size:11px; color:#888;">Delay (sec)</label>
              <input type="number" id="sd-delay-input" class="sd-input" value="3" min="1" max="10" />
            </div>
            <div style="flex:1;">
              <label style="font-size:11px; color:#888;">Schedule</label>
              <select id="sd-repeat-select" class="sd-input">
                <option value="0">Send Once</option>
                <option value="12">Every 12h</option>
                <option value="24" selected>Every 24h</option>
              </select>
            </div>
          </div>
          <button class="sd-btn sd-btn-yellow" id="sd-run-btn">▶ Start Auto-Sending</button>
          <button class="sd-btn sd-btn-red" id="sd-stop-btn" style="display:none;">⏹ Stop</button>
          <div class="sd-log" id="sd-log-box">[SnapDot] Ready. Select contacts.</div>
        </div>
      `;
      document.body.appendChild(container);

      // Event Handlers
      const logBox = container.querySelector('#sd-log-box');
      const addLog = (m) => {
        logBox.innerText += `\n> ${m}`;
        logBox.scrollTop = logBox.scrollHeight;
      };

      container.querySelector('#sd-close-btn').onclick = () => {
        state.isRunning = false;
        container.remove();
        window.__SNAPDOT_INITIALIZED__ = false;
      };

      container.querySelector('#sd-msg-dot').onclick = () => {
        container.querySelector('#sd-msg-input').value = '.';
        state.messageText = '.';
      };

      container.querySelector('#sd-msg-fire').onclick = () => {
        container.querySelector('#sd-msg-input').value = '🔥 .';
        state.messageText = '🔥 .';
      };

      container.querySelector('#sd-msg-input').oninput = (e) => {
        state.messageText = e.target.value || '.';
      };

      container.querySelector('#sd-delay-input').onchange = (e) => {
        state.delaySeconds = parseFloat(e.target.value) || 3;
      };

      container.querySelector('#sd-repeat-select').onchange = (e) => {
        state.repeatIntervalHours = parseFloat(e.target.value) || 0;
      };

      const renderList = () => {
        const box = container.querySelector('#sd-contacts-box');
        box.innerHTML = '';
        state.detectedContacts.forEach((c) => {
          const row = document.createElement('label');
          row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:4px 6px; cursor:pointer; font-size:12px;';
          const checked = state.selectedContacts.includes(c.name);
          row.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} style="accent-color:#fffc00;"/> <span>${c.name}</span>`;
          row.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
              if (!state.selectedContacts.includes(c.name)) state.selectedContacts.push(c.name);
            } else {
              state.selectedContacts = state.selectedContacts.filter(n => n !== c.name);
            }
            container.querySelector('#sd-count').innerText = state.selectedContacts.length;
          };
          box.appendChild(row);
        });
        container.querySelector('#sd-count').innerText = state.selectedContacts.length;
      };

      const scanChats = () => {
        addLog('Scanning visible chats...');
        const rows = document.querySelectorAll('li, div[role="row"], div[role="button"], div[class*="chatListItem"]');
        const found = [];
        rows.forEach(r => {
          const t = r.innerText ? r.innerText.split('\n')[0].trim() : '';
          if (t && t.length > 1 && t.length < 35 && !['Chats', 'Search', 'Filter', 'Stories'].includes(t)) {
            if (!found.some(f => f.name === t)) found.push({ name: t, el: r });
          }
        });
        state.detectedContacts = found;
        if (state.selectedContacts.length === 0) {
          state.selectedContacts = found.map(f => f.name);
        }
        renderList();
        addLog(`Found ${found.length} chats.`);
      };

      container.querySelector('#sd-scan-btn').onclick = (e) => {
        e.preventDefault();
        scanChats();
      };

      const addManual = () => {
        const input = container.querySelector('#sd-manual-input');
        const val = input.value.trim();
        if (!val) return;
        if (!state.detectedContacts.some(c => c.name.toLowerCase() === val.toLowerCase())) {
          state.detectedContacts.push({ name: val, el: null });
        }
        if (!state.selectedContacts.includes(val)) state.selectedContacts.push(val);
        input.value = '';
        renderList();
        addLog(`Added "${val}"`);
      };

      container.querySelector('#sd-manual-add').onclick = addManual;
      container.querySelector('#sd-manual-input').onkeydown = (e) => { if (e.key === 'Enter') addManual(); };

      // Core Send Logic
      async function sendSingle(name, msg) {
        addLog(`Opening chat for "${name}"...`);
        let clicked = false;
        const allEls = Array.from(document.querySelectorAll('*'));
        for (const el of allEls) {
          if (el.children.length === 0 && el.innerText && el.innerText.trim() === name) {
            const clickable = el.closest('button') || el.closest('div[role="button"]') || el.closest('li') || el;
            clickable.click();
            clicked = true;
            break;
          }
        }
        await sleep(1800);
        const input = document.querySelector('div[contenteditable="true"], div[role="textbox"], textarea');
        if (!input) {
          addLog(`⚠️ Input box not found for "${name}".`);
          return false;
        }
        input.focus();
        await sleep(250);
        document.execCommand('insertText', false, msg);
        if (input.innerText.trim() !== msg.trim()) {
          input.innerText = msg;
          input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: msg }));
        }
        await sleep(500);
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        const sendBtn = document.querySelector('button[aria-label="Send"], button[type="submit"]');
        if (sendBtn) sendBtn.click();
        addLog(`✅ Sent "${msg}" to ${name}`);
        return true;
      }

      async function runBatch() {
        if (state.selectedContacts.length === 0) {
          alert('Please select or add at least one person first.');
          return;
        }
        state.isRunning = true;
        container.querySelector('#sd-run-btn').style.display = 'none';
        container.querySelector('#sd-stop-btn').style.display = 'flex';
        addLog(`Starting send to ${state.selectedContacts.length} people...`);

        for (let i = 0; i < state.selectedContacts.length; i++) {
          if (!state.isRunning) break;
          const contact = state.selectedContacts[i];
          addLog(`[${i+1}/${state.selectedContacts.length}] Processing ${contact}...`);
          try {
            await sendSingle(contact, state.messageText);
          } catch (e) {
            addLog(`Error on ${contact}: ${e.message}`);
          }
          if (i < state.selectedContacts.length - 1 && state.isRunning) {
            await sleep(state.delaySeconds * 1000);
          }
        }

        if (state.isRunning) {
          addLog(`🎉 Batch completed!`);
          if (state.repeatIntervalHours > 0) {
            addLog(`Streak Keeper active. Repeating in ${state.repeatIntervalHours} hours.`);
            state.repeatTimerId = setTimeout(() => {
              if (state.isRunning) runBatch();
            }, state.repeatIntervalHours * 3600 * 1000);
          } else {
            state.isRunning = false;
            container.querySelector('#sd-run-btn').style.display = 'flex';
            container.querySelector('#sd-stop-btn').style.display = 'none';
          }
        }
      }

      container.querySelector('#sd-run-btn').onclick = runBatch;
      container.querySelector('#sd-stop-btn').onclick = () => {
        state.isRunning = false;
        if (state.repeatTimerId) clearTimeout(state.repeatTimerId);
        container.querySelector('#sd-run-btn').style.display = 'flex';
        container.querySelector('#sd-stop-btn').style.display = 'none';
        addLog('⏹ Process stopped.');
      };

      // Auto scan on launch
      setTimeout(scanChats, 1200);
    }

    injectUI();
  }

  waitForSnapchat();
})();
