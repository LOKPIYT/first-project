// SnapDot - Production Native Application Engine

(function () {
  'use strict';

  // ========================================================
  // AUDIO SYNTHESIS ENGINE (Web Audio API - No External Files)
  // ========================================================
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playPop() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (e) {}
    }

    playSnapSent() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.05);   // A5
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      } catch (e) {}
    }

    playSuccessChime() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.12, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.25);
        });
      } catch (e) {}
    }
  }

  const sfx = new SoundFX();

  // ========================================================
  // DEFAULT DATA & PERSISTENCE
  // ========================================================
  const STORAGE_KEY = 'snapdot_app_state_v2';

  const defaultContacts = [
    {
      id: 'c1',
      name: 'Sarah',
      username: 'sarah_x',
      streak: 148,
      expiringHours: 2, // 2h left!
      selected: true,
      avatarColor: '#f59e0b',
      messages: [
        { id: 'm1', fromMe: false, text: "Streaks? Don't lose it! 🔥", time: 'Yesterday 10:45 PM' },
        { id: 'm2', fromMe: true, text: '.', time: 'Yesterday 10:46 PM', isDot: true, status: 'Delivered' }
      ]
    },
    {
      id: 'c2',
      name: 'Alex',
      username: 'alex_99',
      streak: 92,
      expiringHours: 3, // 3h left!
      selected: true,
      avatarColor: '#3b82f6',
      messages: [
        { id: 'm1', fromMe: false, text: "Almost lost our streak haha 😅", time: 'Yesterday 9:15 PM' },
        { id: 'm2', fromMe: true, text: '.', time: 'Yesterday 9:16 PM', isDot: true, status: 'Delivered' }
      ]
    },
    {
      id: 'c3',
      name: 'Jake',
      username: 'jake_streaks',
      streak: 45,
      expiringHours: null,
      selected: true,
      avatarColor: '#10b981',
      messages: [
        { id: 'm1', fromMe: false, text: 'Streaks ⚡', time: 'Today 1:20 PM' }
      ]
    },
    {
      id: 'c4',
      name: 'Emma',
      username: 'emma_snap',
      streak: 120,
      expiringHours: null,
      selected: true,
      avatarColor: '#ec4899',
      messages: [
        { id: 'm1', fromMe: false, text: 'Hey Emma!', time: 'Yesterday 6:00 PM' }
      ]
    },
    {
      id: 'c5',
      name: 'Liam',
      username: 'liam_w',
      streak: 33,
      expiringHours: null,
      selected: true,
      avatarColor: '#8b5cf6',
      messages: [
        { id: 'm1', fromMe: false, text: 'Streak 🔥', time: 'Yesterday 8:00 PM' }
      ]
    }
  ];

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      contacts: defaultContacts,
      messageText: '.',
      safetyDelay: 3.0,
      autopilotEnabled: true,
      activeChatId: 'c1',
      stats: {
        streaksSaved: 248,
        sentToday: 12,
        longestStreak: 148,
        history: [
          { time: '10:30 AM', note: 'Auto-pilot preserved streak with Sarah' },
          { time: '08:15 AM', note: 'Sent "." to Alex and Jake' }
        ]
      }
    };
  }

  const appState = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {}
  }

  // ========================================================
  // DOM REFERENCES
  // ========================================================
  const navItemBtns = document.querySelectorAll('.nav-item-btn');
  const viewPages = document.querySelectorAll('.view-page');
  const contactsListContainer = document.getElementById('contacts-list-container');
  const contactSearchInput = document.getElementById('contact-search-input');
  const btnToggleSelectAll = document.getElementById('btn-toggle-select-all');
  const btnStartAutoSend = document.getElementById('btn-start-auto-send');
  const btnSelectedCount = document.getElementById('btn-selected-count');
  const masterMsgInput = document.getElementById('master-msg-input');
  const chipDots = document.querySelectorAll('.chip-dot');
  const expiringAlertBar = document.getElementById('expiring-alert-bar');
  const expiringCountLabel = document.getElementById('expiring-count-label');
  const btnQuickSaveExpiring = document.getElementById('btn-quick-save-expiring');
  const sendProgressContainer = document.getElementById('send-progress-container');
  const progressStatusText = document.getElementById('progress-status-text');
  const progressPercentText = document.getElementById('progress-percent-text');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const headerStreaksActiveCount = document.getElementById('header-streaks-active-count');
  const btnHeaderAutopilot = document.getElementById('btn-header-autopilot');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const appToast = document.getElementById('app-toast');

  // Chat Pane
  const chatPaneRight = document.getElementById('chat-pane-right');
  const btnBackChat = document.getElementById('btn-back-chat');
  const activeChatAvatar = document.getElementById('active-chat-avatar');
  const activeChatName = document.getElementById('active-chat-name');
  const activeChatStreakInfo = document.getElementById('active-chat-streak-info');
  const chatMessagesFeed = document.getElementById('chat-messages-feed');
  const chatDirectInput = document.getElementById('chat-direct-input');
  const btnChatSend = document.getElementById('btn-chat-send');
  const btnChatSingleSend = document.getElementById('btn-chat-single-send');

  // Modal References
  const addFriendModal = document.getElementById('add-friend-modal');
  const btnOpenAddModal = document.getElementById('btn-open-add-modal');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnSaveNewFriend = document.getElementById('btn-save-new-friend');
  const newFriendName = document.getElementById('new-friend-name');
  const newFriendUsername = document.getElementById('new-friend-username');
  const newFriendStreak = document.getElementById('new-friend-streak');

  // Stats
  const statStreaksSaved = document.getElementById('stat-streaks-saved');
  const statSentToday = document.getElementById('stat-sent-today');
  const statLongestStreak = document.getElementById('stat-longest-streak');
  const activityLogFeed = document.getElementById('activity-log-feed');
  const autopilotCountdown = document.getElementById('autopilot-countdown');

  // ========================================================
  // TOAST UTILITY
  // ========================================================
  let toastTimer = null;
  function showToast(msg) {
    if (!appToast) return;
    appToast.innerText = msg;
    appToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      appToast.classList.remove('show');
    }, 2800);
  }

  // ========================================================
  // NAVIGATION & TAB SWITCHER
  // ========================================================
  navItemBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      const pageId = btn.getAttribute('data-page');

      navItemBtns.forEach(b => b.classList.remove('active'));
      viewPages.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPage = document.getElementById(`page-${pageId}`);
      if (targetPage) targetPage.classList.add('active');

      if (pageId === 'stats') updateStatsDisplay();
    });
  });

  // Sound toggle
  btnToggleSound.addEventListener('click', () => {
    sfx.muted = !sfx.muted;
    btnToggleSound.style.opacity = sfx.muted ? '0.4' : '1';
    showToast(sfx.muted ? 'Audio Muted' : 'Audio Enabled 🔔');
  });

  // Autopilot badge toggle
  btnHeaderAutopilot.addEventListener('click', () => {
    appState.autopilotEnabled = !appState.autopilotEnabled;
    updateAutopilotUI();
    saveState();
    showToast(appState.autopilotEnabled ? '24/7 Streak Guardian Enabled' : 'Auto-Pilot Paused');
  });

  function updateAutopilotUI() {
    if (!btnHeaderAutopilot) return;
    if (appState.autopilotEnabled) {
      btnHeaderAutopilot.innerHTML = '<div class="autopilot-pulse"></div><span>Auto-Pilot: ON</span>';
      btnHeaderAutopilot.style.color = 'var(--snap-green)';
    } else {
      btnHeaderAutopilot.innerHTML = '<div style="width:7px; height:7px; background:#666; border-radius:50%;"></div><span>Auto-Pilot: OFF</span>';
      btnHeaderAutopilot.style.color = '#888';
    }
  }

  // ========================================================
  // CONTACTS RENDERING & MANAGEMENT
  // ========================================================
  function renderContactsList(filterText = '') {
    contactsListContainer.innerHTML = '';

    const query = filterText.toLowerCase().trim();
    const filtered = appState.contacts.filter(c => 
      c.name.toLowerCase().includes(query) || c.username.toLowerCase().includes(query)
    );

    const expiringCount = appState.contacts.filter(c => c.expiringHours !== null).length;
    if (expiringAlertBar) {
      expiringAlertBar.style.display = expiringCount > 0 ? 'flex' : 'none';
      if (expiringCountLabel) expiringCountLabel.innerText = expiringCount;
    }

    if (filtered.length === 0) {
      contactsListContainer.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-sub); font-size:12px;">
          No friends found. Click '+' above to add a friend!
        </div>
      `;
      updateSelectionCounts();
      return;
    }

    filtered.forEach(contact => {
      const card = document.createElement('div');
      card.className = `contact-item-card ${contact.id === appState.activeChatId ? 'active-chat' : ''}`;
      card.id = `contact-card-${contact.id}`;

      const lastMsg = contact.messages && contact.messages.length > 0 
        ? contact.messages[contact.messages.length - 1] 
        : null;

      const lastMsgPreview = lastMsg 
        ? (lastMsg.fromMe ? `Delivered "${lastMsg.text}"` : lastMsg.text)
        : 'Tap to chat';

      const expiringBadge = contact.expiringHours !== null
        ? `<span class="streak-tag expiring">⌛ ${contact.expiringHours}h left</span>`
        : `<span class="streak-tag">🔥 ${contact.streak}</span>`;

      card.innerHTML = `
        <div class="contact-check-wrap" data-stop="true">
          <div class="custom-checkbox ${contact.selected ? 'checked' : ''}" data-id="${contact.id}">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
        </div>

        <div class="avatar-badge-wrap">
          <div class="contact-avatar" style="background:${contact.avatarColor};">
            ${contact.name.charAt(0).toUpperCase()}
          </div>
          <div class="status-online-dot"></div>
        </div>

        <div class="contact-info">
          <div class="contact-name-row">
            <span class="contact-display-name">${escapeHTML(contact.name)}</span>
            ${expiringBadge}
          </div>
          <div class="contact-sub-row">
            <span class="last-msg-text">@${escapeHTML(contact.username)} • ${lastMsgPreview}</span>
            <button class="quick-send-row-btn" data-id="${contact.id}" title="Send . immediately">
              Send .
            </button>
          </div>
        </div>
      `;

      // Checkbox click
      const checkWrap = card.querySelector('.contact-check-wrap');
      checkWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playPop();
        contact.selected = !contact.selected;
        card.querySelector('.custom-checkbox').classList.toggle('checked', contact.selected);
        updateSelectionCounts();
        saveState();
      });

      // Quick Send "." single button click
      const quickSendBtn = card.querySelector('.quick-send-row-btn');
      quickSendBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        sfx.playPop();
        await sendDotToSingleFriend(contact);
      });

      // Card click opens conversation
      card.addEventListener('click', () => {
        sfx.playPop();
        selectActiveChat(contact.id);
      });

      contactsListContainer.appendChild(card);
    });

    updateSelectionCounts();
    if (headerStreaksActiveCount) {
      headerStreaksActiveCount.innerText = appState.contacts.length;
    }
  }

  function updateSelectionCounts() {
    const selectedCount = appState.contacts.filter(c => c.selected).length;
    if (btnSelectedCount) btnSelectedCount.innerText = selectedCount;

    if (btnToggleSelectAll) {
      const allSelected = selectedCount === appState.contacts.length && appState.contacts.length > 0;
      btnToggleSelectAll.innerText = allSelected ? 'Deselect' : 'Select All';
    }
  }

  // Search input filter
  contactSearchInput.addEventListener('input', (e) => {
    renderContactsList(e.target.value);
  });

  // Select all toggle
  btnToggleSelectAll.addEventListener('click', () => {
    sfx.playPop();
    const allSelected = appState.contacts.every(c => c.selected);
    appState.contacts.forEach(c => c.selected = !allSelected);
    renderContactsList(contactSearchInput.value);
    saveState();
  });

  // Quick save all expiring streaks
  if (btnQuickSaveExpiring) {
    btnQuickSaveExpiring.addEventListener('click', () => {
      sfx.playPop();
      appState.contacts.forEach(c => {
        c.selected = (c.expiringHours !== null);
      });
      renderContactsList();
      runAutoSender();
    });
  }

  // Preset chips
  chipDots.forEach(chip => {
    chip.addEventListener('click', () => {
      sfx.playPop();
      chipDots.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const msg = chip.getAttribute('data-msg');
      masterMsgInput.value = msg;
      appState.messageText = msg;
      saveState();
    });
  });

  masterMsgInput.addEventListener('input', (e) => {
    appState.messageText = e.target.value || '.';
    saveState();
  });

  // ========================================================
  // ACTIVE CHAT & CONVERSATION FEED
  // ========================================================
  function selectActiveChat(contactId) {
    appState.activeChatId = contactId;
    saveState();

    document.querySelectorAll('.contact-item-card').forEach(c => {
      c.classList.remove('active-chat');
    });
    const targetCard = document.getElementById(`contact-card-${contactId}`);
    if (targetCard) targetCard.classList.add('active-chat');

    const contact = appState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    if (activeChatAvatar) {
      activeChatAvatar.style.background = contact.avatarColor;
      activeChatAvatar.innerText = contact.name.charAt(0).toUpperCase();
    }
    if (activeChatName) activeChatName.innerText = contact.name;
    if (activeChatStreakInfo) {
      activeChatStreakInfo.innerText = `🔥 ${contact.streak} Day Streak ${contact.expiringHours ? '(⌛ Expiring Soon)' : ''}`;
    }

    renderMessagesFeed(contact);

    // Mobile slide-over
    if (window.innerWidth <= 860 && chatPaneRight) {
      chatPaneRight.classList.add('open-mobile');
    }
  }

  function renderMessagesFeed(contact) {
    chatMessagesFeed.innerHTML = `
      <div class="chat-date-separator">
        <span>Today</span>
      </div>
    `;

    if (!contact.messages || contact.messages.length === 0) {
      chatMessagesFeed.innerHTML += `
        <div style="text-align:center; color:var(--text-dim); font-size:12px; margin-top:20px;">
          No messages yet. Send "." to maintain your streak!
        </div>
      `;
      return;
    }

    contact.messages.forEach(msg => {
      const bubbleWrap = document.createElement('div');
      const isSnapDot = msg.isDot || msg.text === '.';
      bubbleWrap.className = `bubble-wrap ${msg.fromMe ? 'outgoing' : 'incoming'} ${isSnapDot ? 'snap-dot-msg' : ''}`;

      bubbleWrap.innerHTML = `
        <div class="chat-bubble">
          ${escapeHTML(msg.text)}
        </div>
        <div class="bubble-meta">
          <span>${msg.time || 'Just now'}</span>
          ${msg.fromMe ? '<span>• Delivered ✓</span>' : ''}
        </div>
      `;
      chatMessagesFeed.appendChild(bubbleWrap);
    });

    chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
  }

  // Mobile Back button
  if (btnBackChat) {
    btnBackChat.addEventListener('click', () => {
      sfx.playPop();
      if (chatPaneRight) chatPaneRight.classList.remove('open-mobile');
    });
  }

  // Send message directly from chat feed
  function sendDirectMessage() {
    const text = chatDirectInput.value.trim();
    if (!text) return;
    const contact = appState.contacts.find(c => c.id === appState.activeChatId);
    if (!contact) return;

    contact.messages.push({
      id: 'm_' + Date.now(),
      fromMe: true,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDot: text === '.'
    });

    if (text === '.') {
      contact.streak += 1;
      contact.expiringHours = null;
    }

    chatDirectInput.value = '';
    sfx.playSnapSent();
    renderMessagesFeed(contact);
    renderContactsList(contactSearchInput.value);
    saveState();
  }

  btnChatSend.addEventListener('click', sendDirectMessage);
  chatDirectInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendDirectMessage();
  });

  // Single friend header dot send
  btnChatSingleSend.addEventListener('click', () => {
    const contact = appState.contacts.find(c => c.id === appState.activeChatId);
    if (contact) sendDotToSingleFriend(contact);
  });

  async function sendDotToSingleFriend(contact) {
    selectActiveChat(contact.id);
    const msg = appState.messageText || '.';

    // Animate typing into input field
    chatDirectInput.value = '';
    for (let char of msg) {
      chatDirectInput.value += char;
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 200));

    contact.messages.push({
      id: 'm_' + Date.now(),
      fromMe: true,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDot: true
    });

    contact.streak += 1;
    contact.expiringHours = null;
    chatDirectInput.value = '';
    sfx.playSnapSent();

    renderMessagesFeed(contact);
    renderContactsList(contactSearchInput.value);

    // Update stats
    appState.stats.sentToday += 1;
    appState.stats.streaksSaved += 1;
    appState.stats.history.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: `Sent "${msg}" to ${contact.name} (Streak: 🔥${contact.streak})`
    });
    saveState();

    showToast(`Sent "${msg}" to ${contact.name}! Streak 🔥${contact.streak}`);
  }

  // ========================================================
  // THE MASTER AUTOMATED SENDER ENGINE
  // ========================================================
  let isAutoSending = false;

  async function runAutoSender() {
    const selected = appState.contacts.filter(c => c.selected);
    if (selected.length === 0) {
      alert('Please select at least one friend with the checkbox first!');
      return;
    }

    if (isAutoSending) return;
    isAutoSending = true;

    btnStartAutoSend.disabled = true;
    btnStartAutoSend.classList.add('running');
    sendProgressContainer.classList.add('active');

    sfx.playPop();

    const total = selected.length;
    const msg = appState.messageText || '.';

    for (let i = 0; i < total; i++) {
      const contact = selected[i];
      const percent = Math.round(((i) / total) * 100);
      progressBarFill.style.width = `${percent}%`;
      progressPercentText.innerText = `${i + 1} / ${total}`;
      progressStatusText.innerText = `Auto-sending to ${contact.name}...`;

      // Highlight in list & open chat pane
      selectActiveChat(contact.id);
      const cardEl = document.getElementById(`contact-card-${contact.id}`);
      if (cardEl) cardEl.classList.add('sending-now');

      // Typewriter simulation
      chatDirectInput.value = '';
      for (let char of msg) {
        chatDirectInput.value += char;
        await new Promise(r => setTimeout(r, 50));
      }
      await new Promise(r => setTimeout(r, 250));

      // Deliver message
      contact.messages.push({
        id: 'm_' + Date.now(),
        fromMe: true,
        text: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDot: true
      });

      contact.streak += 1;
      contact.expiringHours = null;
      chatDirectInput.value = '';

      sfx.playSnapSent();
      renderMessagesFeed(contact);

      if (cardEl) cardEl.classList.remove('sending-now');

      // Stats
      appState.stats.sentToday += 1;
      appState.stats.streaksSaved += 1;
      appState.stats.history.unshift({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: `Auto-sent "${msg}" to ${contact.name} (Streak: 🔥${contact.streak})`
      });

      // Safety delay with randomized jitter between contacts
      if (i < total - 1) {
        const jitter = (Math.random() * 0.8) - 0.4;
        const delaySeconds = Math.max(1.2, appState.safetyDelay + jitter);
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
      }
    }

    progressBarFill.style.width = '100%';
    progressStatusText.innerText = `🎉 Successfully sent to all ${total} friends!`;

    renderContactsList(contactSearchInput.value);
    saveState();

    sfx.playSuccessChime();
    showToast(`🎉 All ${total} streaks preserved automatically!`);

    setTimeout(() => {
      sendProgressContainer.classList.remove('active');
      btnStartAutoSend.disabled = false;
      btnStartAutoSend.classList.remove('running');
      isAutoSending = false;
    }, 2200);
  }

  btnStartAutoSend.addEventListener('click', runAutoSender);

  // ========================================================
  // STATS & COUNTDOWN ENGINE
  // ========================================================
  function updateStatsDisplay() {
    if (statStreaksSaved) statStreaksSaved.innerText = appState.stats.streaksSaved;
    if (statSentToday) statSentToday.innerText = appState.stats.sentToday;

    const highest = Math.max(...appState.contacts.map(c => c.streak), 0);
    if (statLongestStreak) statLongestStreak.innerText = `🔥 ${highest}`;

    if (activityLogFeed) {
      activityLogFeed.innerHTML = '';
      if (!appState.stats.history || appState.stats.history.length === 0) {
        activityLogFeed.innerHTML = '<div>No recent activity recorded.</div>';
      } else {
        appState.stats.history.slice(0, 8).forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'padding:6px 8px; background:var(--bg-input); border-radius:6px;';
          row.innerHTML = `<span style="color:var(--snap-yellow); font-weight:700;">[${item.time}]</span> ${escapeHTML(item.note)}`;
          activityLogFeed.appendChild(row);
        });
      }
    }
  }

  // 24H Countdown Loop
  let countdownSeconds = 14 * 3600 + 22 * 60 + 45;
  setInterval(() => {
    countdownSeconds = Math.max(0, countdownSeconds - 1);
    if (autopilotCountdown) {
      const h = String(Math.floor(countdownSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(countdownSeconds % 60).padStart(2, '0');
      autopilotCountdown.innerText = `${h}:${m}:${s}`;
    }
    if (countdownSeconds === 0 && appState.autopilotEnabled) {
      countdownSeconds = 24 * 3600;
      runAutoSender();
    }
  }, 1000);

  // ========================================================
  // ADD FRIEND MODAL
  // ========================================================
  btnOpenAddModal.addEventListener('click', () => {
    sfx.playPop();
    addFriendModal.classList.add('active');
    newFriendName.focus();
  });

  btnCloseAddModal.addEventListener('click', () => {
    addFriendModal.classList.remove('active');
  });

  btnSaveNewFriend.addEventListener('click', () => {
    const name = newFriendName.value.trim();
    const username = (newFriendUsername.value.trim() || name.toLowerCase().replace(/\s+/g, '_')).replace(/^@/, '');
    const streak = parseInt(newFriendStreak.value) || 1;

    if (!name) {
      alert("Please enter friend's name!");
      return;
    }

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f97316'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newContact = {
      id: 'c_' + Date.now(),
      name: name,
      username: username,
      streak: streak,
      expiringHours: null,
      selected: true,
      avatarColor: color,
      messages: [
        { id: 'm1', fromMe: false, text: 'Added you on Snapchat!', time: 'Just now' }
      ]
    };

    appState.contacts.unshift(newContact);
    saveState();

    newFriendName.value = '';
    newFriendUsername.value = '';
    addFriendModal.classList.remove('active');

    renderContactsList();
    selectActiveChat(newContact.id);
    showToast(`Added ${name} to your friends!`);
    sfx.playPop();
  });

  // ========================================================
  // UTILITIES & SERVICE WORKER
  // ========================================================
  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, t => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[t] || t));
  }

  // Register PWA service worker if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Initial Boot
  updateAutopilotUI();
  renderContactsList();
  if (appState.activeChatId) {
    selectActiveChat(appState.activeChatId);
  }
  updateStatsDisplay();

})();
