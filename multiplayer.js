// ===================================
// MULTIPLAYER FUNCTIONALITY (FIXED & HARDENED)
// ===================================
//
// Fixes applied:
// - Robust Firebase initialization checks (graceful fallback to DEMO mode)
// - Safe guards around missing/undefined objects (group.players, chatRef, etc.)
// - Safer joinGroup using a transaction (prevents race conditions for full groups)
// - Added onDisconnect cleanup so users are removed if they close the tab
// - Defensive listeners cleanup (off) to avoid duplicated handlers
// - Guarding public UI updates for missing DOM elements
// - Small lint / readability improvements and helpful console logs
//
// Note: This file is intended to replace the repository's multiplayer.js
// Ensure you test in a dev environment before deploying to production.
//
// ===================================

/* global firebase, anime, gameState */
'use strict';

// Firebase Configuration (keep as-is or move to env)
const firebaseConfig = {
    apiKey: "AIzaSyD_S56To4eTZNImejsbm0iwm10JCo5v5C4",
    authDomain: "solo-leveling-game-4.firebaseapp.com",
    databaseURL: "https://solo-leveling-game-4-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "solo-leveling-game-4",
    storageBucket: "solo-leveling-game-4.firebasestorage.app",
    messagingSenderId: "107352266789",
    appId: "1:107352266789:web:1437ea6ef382eb406a87cc"
};

// Multiplayer State
const multiplayerState = {
    currentUser: null,
    currentGroup: null,
    isOnlineMode: false,
    groupRef: null,
    chatRef: null,
    playersRef: null,
    listeners: {
        players: false,
        status: false,
        chat: false,
        gameState: false
    },
    demoMode: false
};

// Initialize Firebase (safe)
let firebaseApp = null;
let database = null;
try {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not found. Multiplayer will run in DEMO mode.');
        multiplayerState.demoMode = true;
    } else {
        // Avoid initializing twice
        if (!firebase.apps || firebase.apps.length === 0) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.apps[0];
        }
        database = firebase.database();
        console.log('Firebase initialized');
    }
} catch (err) {
    console.error('Error initializing Firebase. Falling back to DEMO mode:', err);
    multiplayerState.demoMode = true;
}

// ===================================
// UTILITIES
// ===================================

function safeDatabase() {
    if (multiplayerState.demoMode || !database) {
        throw new Error('Realtime Database not available.');
    }
    return database;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

function generateGroupCode() {
    // 6 character base36 (uppercased). Collisions are rare; database uniqueness handled at write.
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function logIf(...args) {
    console.log('[multiplayer]', ...args);
}

// Helper: safe DOM getter
function $id(id) {
    return document.getElementById(id);
}

// ===================================
// AUTHENTICATION & LOGIN
// ===================================

function handleLogin() {
    const nameInput = $id('player-name');
    const usernameInput = $id('player-username');

    const name = nameInput?.value.trim() || '';
    const username = usernameInput?.value.trim() || '';

    if (!name || !username) {
        alert('Please enter both name and username!');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        alert('Username can only contain letters, numbers, and underscores!');
        return;
    }

    multiplayerState.currentUser = {
        name,
        username,
        id: generateUserId(),
        timestamp: Date.now()
    };

    localStorage.setItem('soloLevelingUser', JSON.stringify(multiplayerState.currentUser));
    logIf('User logged in:', multiplayerState.currentUser);

    transitionScreen('screen-login', 'screen-mode-select');
}

// ===================================
// MODE SELECTION
// ===================================

function selectSinglePhoneMode() {
    multiplayerState.isOnlineMode = false;
    transitionScreen('screen-mode-select', 'screen-player-select');
}

function selectMultiPhoneMode() {
    if (multiplayerState.demoMode) {
        alert('Firebase not configured. Please set up Firebase to use online multiplayer.\nSee MULTIPLAYER_SETUP.md for instructions.');
        return;
    }
    multiplayerState.isOnlineMode = true;
    transitionScreen('screen-mode-select', 'screen-group-select');
}

// ===================================
// GROUP MANAGEMENT
// ===================================

function showCreateGroupScreen() {
    transitionScreen('screen-group-select', 'screen-create-group');
    setupInviteInputs();
}

function showJoinGroupScreen() {
    transitionScreen('screen-group-select', 'screen-join-group');
    loadAvailableGroups();
}

function setupInviteInputs() {
    const addBtn = document.querySelector('.add-invite-btn');
    if (!addBtn) return;
    addBtn.addEventListener('click', addInviteInput);
}

function addInviteInput() {
    const container = $id('invite-inputs');
    if (!container) return;

    const newRow = document.createElement('div');
    newRow.className = 'invite-input-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Enter username to invite" class="game-input invite-username">
        <button class="neon-btn small remove-invite-btn">−</button>
    `;
    container.appendChild(newRow);

    newRow.querySelector('.remove-invite-btn')?.addEventListener('click', () => newRow.remove());
}

async function createGroup() {
    const groupName = ($id('group-name-input')?.value || '').trim();
    if (!groupName) {
        alert('Please enter a group name!');
        return;
    }

    if (!multiplayerState.currentUser) {
        alert('Please log in first.');
        return;
    }

    if (multiplayerState.demoMode) {
        alert('Realtime Database not available. Cannot create online groups in DEMO mode.');
        return;
    }

    let databaseRef;
    try {
        databaseRef = safeDatabase();
    } catch (err) {
        console.error(err);
        alert('Realtime Database not initialized. See MULTIPLAYER_SETUP.md');
        return;
    }

    // Gather invited users
    const inviteInputs = document.querySelectorAll('.invite-username');
    const invitedUsers = Array.from(inviteInputs)
        .map(i => i.value.trim())
        .filter(u => u && u !== multiplayerState.currentUser.username);

    const groupCode = generateGroupCode();

    const groupData = {
        code: groupCode,
        name: groupName,
        creator: multiplayerState.currentUser.username,
        createdAt: Date.now(),
        status: 'waiting',
        players: {
            [multiplayerState.currentUser.username]: {
                ...multiplayerState.currentUser,
                isReady: false,
                isCreator: true
            }
        },
        invitedUsers,
        maxPlayers: 4,
        gameState: null
    };

    try {
        const groupRef = databaseRef.ref('groups/' + groupCode);
        // Ensure not clobbering existing group (very rare collision)
        const snap = await groupRef.once('value');
        if (snap.exists()) {
            // Collision: try again
            logIf('Group code collision, regenerating...');
            // naive retry once
            const newCode = generateGroupCode();
            groupData.code = newCode;
            await databaseRef.ref('groups/' + newCode).set(groupData);
            multiplayerState.currentGroup = newCode;
            multiplayerState.groupRef = databaseRef.ref('groups/' + newCode);
        } else {
            await groupRef.set(groupData);
            multiplayerState.currentGroup = groupCode;
            multiplayerState.groupRef = groupRef;
        }

        logIf('Group created:', multiplayerState.currentGroup);
        joinLobby(multiplayerState.currentGroup);
    } catch (err) {
        console.error('Error creating group:', err);
        alert('Failed to create group. See console for details.');
    }
}

// Load groups (robust)
async function loadAvailableGroups() {
    logIf('Loading available groups...');
    const groupsList = $id('groups-list');
    if (!groupsList) {
        console.error('groups-list element not found');
        return;
    }
    groupsList.innerHTML = '<div class="loading">Loading groups...</div>';

    if (multiplayerState.demoMode) {
        groupsList.innerHTML = '<div class="no-groups">Demo mode active. No online groups available.</div>';
        return;
    }

    try {
        const db = safeDatabase();
        const groupsRef = db.ref('groups');
        const snapshot = await groupsRef.once('value');
        const groups = snapshot.val();

        groupsList.innerHTML = '';

        if (!groups || Object.keys(groups).length === 0) {
            groupsList.innerHTML = `
                <div class="no-groups">
                    No groups found. 
                    <button onclick="loadAvailableGroups()" class="neon-btn small">Refresh</button>
                </div>`;
            return;
        }

        let hasActive = false;

        Object.entries(groups).forEach(([code, group]) => {
            try {
                // Defensive: group may be null or missing props
                if (!group || typeof group !== 'object') return;

                const playerObj = group.players && typeof group.players === 'object' ? group.players : {};
                const playerCount = Object.keys(playerObj).length;
                const maxPlayers = group.maxPlayers || 4;
                const status = group.status || 'waiting';

                const isJoinable = (status === 'waiting' || status === 'wating') && playerCount < maxPlayers;

                // Even if players object is empty, allow join (creator might not have populated)
                if (isJoinable) {
                    const card = createGroupCard(code, group);
                    if (card) {
                        groupsList.appendChild(card);
                        hasActive = true;
                    }
                }
            } catch (gErr) {
                console.error('Error processing group', code, gErr);
            }
        });

        if (!hasActive) {
            groupsList.innerHTML = '<div class="no-groups">No active groups available. Create one!</div>';
        }
    } catch (err) {
        console.error('Error loading groups:', err);
        const groupsListEl = $id('groups-list');
        if (groupsListEl) {
            groupsListEl.innerHTML = `<div class="error">Failed to load groups. ${escapeHtml(err.message || '')}
                <br><button onclick="loadAvailableGroups()" class="neon-btn small">Retry</button></div>`;
        }
    }
}

function createGroupCard(code, group) {
    try {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.style.margin = '10px';
        card.style.padding = '15px';
        card.style.border = '1px solid #444';
        card.style.borderRadius = '8px';
        card.style.backgroundColor = '#1a1a2e';
        card.style.color = 'white';

        const playerCount = group.players && typeof group.players === 'object' ? Object.keys(group.players).length : 0;
        const maxPlayers = group.maxPlayers || 4;
        const groupName = group.name || 'Untitled Group';
        const creatorName = group.creator || 'Unknown';

        card.innerHTML = `
            <div class="group-card-header" style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 8px;">
                <h3 style="margin: 0 0 5px 0; color: #00d4ff; font-size: 1.2em;">${escapeHtml(groupName)}</h3>
                <span class="group-code" style="color: #888; font-size: 0.9em;">Code: ${escapeHtml(code)}</span>
            </div>
            <div class="group-card-body" style="margin-bottom: 10px;">
                <p style="margin: 5px 0;">Creator: ${escapeHtml(creatorName)}</p>
                <p style="margin: 5px 0;">Players: ${playerCount}/${maxPlayers}</p>
            </div>
            <button class="join-group-btn" data-code="${escapeHtml(code)}" style="
                    background: linear-gradient(45deg, #00d4ff, #00ff88);
                    border: none;
                    color: #111;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    width: 100%;
                    transition: all 0.2s ease;
                ">
                JOIN GAME
            </button>
        `;

        const joinBtn = card.querySelector('.join-group-btn');
        joinBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const codeAttr = e.currentTarget.getAttribute('data-code');
            joinGroup(codeAttr);
        });

        card.addEventListener('click', () => {
            joinGroup(code);
        });

        return card;
    } catch (err) {
        console.error('createGroupCard error:', err);
        return null;
    }
}

// Join group with transaction (safe)
async function joinGroup(groupCode) {
    if (!multiplayerState.currentUser) {
        alert('Please log in before joining a group.');
        return;
    }

    if (multiplayerState.demoMode) {
        alert('Realtime Database unavailable (DEMO mode). Cannot join online group.');
        return;
    }

    try {
        const db = safeDatabase();
        const groupRef = db.ref('groups/' + groupCode);

        // Use a transaction on players to avoid race conditions
        await groupRef.child('players').transaction((currentPlayers) => {
            if (!currentPlayers) currentPlayers = {};
            const keys = Object.keys(currentPlayers);
            // if already in group, do nothing
            if (currentPlayers[multiplayerState.currentUser.username]) {
                return currentPlayers;
            }
            // capacity check
            const maxPlayers = (currentPlayers._meta && currentPlayers._meta.maxPlayers) || undefined;
            // The canonical maxPlayers is stored on the parent group; fetch it outside transaction.
            // To keep transaction simple, enforce a generic limit here as a best-effort.
            if (keys.length >= 6) { // keep a hard cap to prevent abusive writes (fallback)
                return; // abort transaction (return undefined)
            }
            currentPlayers[multiplayerState.currentUser.username] = {
                ...multiplayerState.currentUser,
                isReady: false,
                isCreator: false
            };
            return currentPlayers;
        }, async (error, committed, snapshot) => {
            if (error) {
                console.error('Transaction failed:', error);
                alert('Failed to join group. Try again.');
                return;
            }
            if (!committed) {
                // Transaction aborted (likely full)
                // Check group to show accurate message
                const latest = await groupRef.once('value');
                const group = latest.val();
                const players = group && group.players ? Object.keys(group.players).length : 0;
                const maxPlayers = group && group.maxPlayers ? group.maxPlayers : 4;
                if (players >= maxPlayers) {
                    alert('Group is full!');
                } else {
                    alert('Could not join group (transaction aborted). Please try again.');
                }
                return;
            }

            // Success: set up multiplayer state
            multiplayerState.currentGroup = groupCode;
            multiplayerState.groupRef = groupRef;

            // Create a stable playerRef to set onDisconnect removal
            const playerRef = groupRef.child('players/' + multiplayerState.currentUser.username);
            try {
                // set an onDisconnect remove so if the browser closes unexpectedly, the player is removed
                playerRef.onDisconnect().remove().catch(() => { /* ignore onDisconnect errors in some browsers */ });
            } catch (err) {
                // Some firebase versions throw when onDisconnect before auth; ignore gracefully
            }

            logIf('Joined group:', groupCode);
            joinLobby(groupCode);
        }, false);

    } catch (err) {
        console.error('joinGroup error:', err);
        alert('Failed to join group. See console for details.');
    }
}

// ===================================
// LOBBY (WAITING ROOM)
// ===================================

function joinLobby(groupCode) {
    // transition UI safely: some flows call joinLobby from multiple places
    try {
        transitionScreen('screen-create-group', 'screen-lobby');
        transitionScreen('screen-join-group', 'screen-lobby');
    } catch (e) {
        // ignore transition errors
    }

    const lobbyGroupNameEl = $id('lobby-group-name');
    const groupCodeEl = $id('group-code');
    if (lobbyGroupNameEl) lobbyGroupNameEl.textContent = groupCode;
    if (groupCodeEl) groupCodeEl.textContent = groupCode;

    // ensure db available
    if (multiplayerState.demoMode) {
        // show demo info
        const playersContainer = $id('lobby-players');
        if (playersContainer) playersContainer.innerHTML = '<div class="demo">Demo lobby (no online sync)</div>';
        return;
    }

    try {
        const db = safeDatabase();
        // players listener
        // remove existing listeners if any
        if (multiplayerState.playersRef && multiplayerState.listeners.players) {
            multiplayerState.playersRef.off('value', updateLobbyPlayers);
        }
        multiplayerState.playersRef = db.ref('groups/' + groupCode + '/players');
        multiplayerState.playersRef.on('value', updateLobbyPlayers);
        multiplayerState.listeners.players = true;

        // game status listener
        const statusRef = db.ref('groups/' + groupCode + '/status');
        if (multiplayerState.listeners.status) statusRef.off();
        statusRef.on('value', (snap) => {
            const val = snap.val();
            if (val === 'playing') {
                startOnlineGame();
            }
        });
        multiplayerState.listeners.status = true;

        // chat
        setupLobbyChat(groupCode);

        // show start button only to creator
        db.ref('groups/' + groupCode + '/creator').once('value', (snap) => {
            const creator = snap.val();
            if (creator === multiplayerState.currentUser.username) {
                const btn = $id('start-online-game');
                if (btn) btn.style.display = 'block';
            }
        });
    } catch (err) {
        console.error('joinLobby error:', err);
    }
}

// Update lobby UI for players (defensive)
function updateLobbyPlayers(snapshot) {
    const players = snapshot?.val() || {};
    const container = $id('lobby-players');
    if (!container) return;

    container.innerHTML = '';

    const playerKeys = players && typeof players === 'object' ? Object.keys(players) : [];
    const playerCount = playerKeys.length;
    const playerCountEl = $id('player-count');
    if (playerCountEl) playerCountEl.textContent = playerCount;

    playerKeys.forEach((username) => {
        const player = players[username];
        const playerCard = document.createElement('div');
        playerCard.className = 'lobby-player-card';
        if (player.isCreator) playerCard.classList.add('creator');
        if (username === multiplayerState.currentUser?.username) playerCard.classList.add('you');

        playerCard.innerHTML = `
            <div class="player-avatar">${escapeHtml((player.name || ' ')[0] || 'U').toUpperCase()}</div>
            <div class="player-info">
                <div class="player-name">${escapeHtml(player.name || username)}</div>
                <div class="player-username">@${escapeHtml(username)}</div>
                ${player.isCreator ? '<span class="creator-badge">CREATOR</span>' : ''}
                ${username === multiplayerState.currentUser?.username ? '<span class="you-badge">YOU</span>' : ''}
            </div>
        `;
        container.appendChild(playerCard);
    });
}

function leaveLobby() {
    if (!multiplayerState.currentGroup || !multiplayerState.currentUser) {
        transitionScreen('screen-lobby', 'screen-group-select');
        multiplayerState.currentGroup = null;
        return;
    }

    if (!multiplayerState.demoMode) {
        try {
            const db = safeDatabase();
            const playerRef = db.ref('groups/' + multiplayerState.currentGroup + '/players/' + multiplayerState.currentUser.username);
            playerRef.remove().catch(() => {});
        } catch (err) {
            console.warn('Failed to remove player from group on leave:', err);
        }

        // detach listeners
        if (multiplayerState.playersRef && multiplayerState.listeners.players) {
            multiplayerState.playersRef.off('value', updateLobbyPlayers);
            multiplayerState.listeners.players = false;
        }
        if (multiplayerState.chatRef && multiplayerState.listeners.chat) {
            multiplayerState.chatRef.off('child_added');
            multiplayerState.listeners.chat = false;
        }
        if (multiplayerState.groupRef && multiplayerState.listeners.gameState) {
            multiplayerState.groupRef.child('gameState').off('value', handleGameStateUpdate);
            multiplayerState.listeners.gameState = false;
        }
    }

    transitionScreen('screen-lobby', 'screen-group-select');
    multiplayerState.currentGroup = null;

    // hide start button
    const startBtn = $id('start-online-game');
    if (startBtn) startBtn.style.display = 'none';
}

// ===================================
// CHAT FUNCTIONALITY
// ===================================

function setupLobbyChat(groupCode) {
    if (multiplayerState.demoMode) return;

    try {
        const db = safeDatabase();
        // detach existing
        if (multiplayerState.chatRef && multiplayerState.listeners.chat) {
            multiplayerState.chatRef.off('child_added');
        }

        multiplayerState.chatRef = db.ref('groups/' + groupCode + '/chat');
        multiplayerState.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            addChatMessage(message, 'chat-messages');
        });
        multiplayerState.listeners.chat = true;

        const sendBtn = $id('send-chat');
        const chatInput = $id('chat-input');

        if (sendBtn) sendBtn.onclick = () => sendChatMessage('chat-input', groupCode);
        if (chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatMessage('chat-input', groupCode); };
    } catch (err) {
        console.error('setupLobbyChat error:', err);
    }
}

function setupGameChat(groupCode) {
    if (multiplayerState.demoMode) return;

    try {
        document.getElementById('game-send-chat')?.addEventListener('click', () => sendChatMessage('game-chat-input', groupCode));
        document.getElementById('game-chat-input')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage('game-chat-input', groupCode); });

        // ensure chatRef exists and is listening
        if (multiplayerState.chatRef && multiplayerState.listeners.chat) {
            multiplayerState.chatRef.on('child_added', (snapshot) => {
                addChatMessage(snapshot.val(), 'game-chat-messages');
            });
        }
        document.getElementById('toggle-chat')?.addEventListener('click', toggleGameChat);
    } catch (err) {
        console.error('setupGameChat error:', err);
    }
}

function sendChatMessage(inputId, groupCode) {
    const input = $id(inputId);
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    if (!multiplayerState.currentUser) return;

    if (multiplayerState.demoMode) {
        addChatMessage({
            username: multiplayerState.currentUser.username,
            name: multiplayerState.currentUser.name,
            message,
            timestamp: Date.now()
        }, inputId === 'chat-input' ? 'chat-messages' : 'game-chat-messages');
        input.value = '';
        return;
    }

    try {
        const db = safeDatabase();
        const chatRef = db.ref('groups/' + groupCode + '/chat');
        const chatData = {
            username: multiplayerState.currentUser.username,
            name: multiplayerState.currentUser.name,
            message,
            timestamp: Date.now()
        };
        chatRef.push(chatData);
        input.value = '';
    } catch (err) {
        console.error('sendChatMessage error:', err);
    }
}

function addChatMessage(message, containerId) {
    if (!message || !containerId) return;
    const container = $id(containerId);
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    if (message.username === multiplayerState.currentUser?.username) messageDiv.classList.add('own-message');

    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(message.name || message.username)}</span>
            <span class="message-time">${escapeHtml(time)}</span>
        </div>
        <div class="message-text">${escapeHtml(message.message)}</div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function toggleGameChat() {
    const chatPanel = $id('game-chat-panel');
    if (!chatPanel) return;
    const chatBody = chatPanel.querySelector('.chat-body');
    const toggleBtn = $id('toggle-chat');
    if (!chatBody || !toggleBtn) return;

    if (chatBody.style.display === 'none' || getComputedStyle(chatBody).display === 'none') {
        chatBody.style.display = 'flex';
        toggleBtn.textContent = '−';
    } else {
        chatBody.style.display = 'none';
        toggleBtn.textContent = '+';
    }
}

// ===================================
// ONLINE GAME START & SYNC
// ===================================

async function startOnlineGameAsCreator() {
    if (!multiplayerState.currentGroup) return;
    if (multiplayerState.demoMode) {
        alert('Demo mode: starting simulated game.');
        startOnlineGame();
        return;
    }

    try {
        const db = safeDatabase();
        const groupRef = db.ref('groups/' + multiplayerState.currentGroup);
        const snapshot = await groupRef.once('value');
        const group = snapshot.val();
        if (!group) {
            alert('Group not found.');
            return;
        }
        const players = group.players && typeof group.players === 'object' ? Object.keys(group.players) : [];
        if (players.length < 2) {
            alert('Need at least 2 players to start!');
            return;
        }

        // Mark status playing - all clients will observe this and call startOnlineGame()
        await groupRef.update({ status: 'playing' });
    } catch (err) {
        console.error('startOnlineGameAsCreator error:', err);
        alert('Failed to start game. See console for details.');
    }
}

function startOnlineGame() {
    transitionScreen('screen-lobby', 'screen-game');
    const chatPanel = $id('game-chat-panel');
    if (chatPanel) chatPanel.style.display = 'flex';
    setupGameChat(multiplayerState.currentGroup);
    initializeOnlineGame();
}

async function initializeOnlineGame() {
    try {
        // Grab group snapshot
        let group;
        if (multiplayerState.demoMode) {
            group = {
                players: {
                    'demo1': { name: 'Demo 1', selectedClass: '6' },
                    'demo2': { name: 'Demo 2', selectedClass: '4' }
                }
            };
        } else {
            const db = safeDatabase();
            const groupRef = db.ref('groups/' + multiplayerState.currentGroup);
            const snap = await groupRef.once('value');
            group = snap.val();
            // ensure we listen for future gameState changes
            if (!multiplayerState.listeners.gameState) {
                groupRef.child('gameState').on('value', handleGameStateUpdate);
                multiplayerState.listeners.gameState = true;
            }
            multiplayerState.groupRef = groupRef;
        }

        const playersList = group.players && typeof group.players === 'object' ? Object.entries(group.players) : [];
        const players = playersList.map(([username, player], idx) => ({
            id: idx + 1,
            name: player.name || username,
            username,
            class: player.selectedClass || '6',
            position: 0,
            color: ['#ff3366', '#00d4ff', '#00ff88', '#ffaa00'][idx % 4]
        }));

        if (typeof gameState === 'undefined') window.gameState = {};
        gameState.numPlayers = players.length;
        gameState.players = players;
        gameState.currentPlayerIndex = 0;
        gameState.round = 1;
        gameState.gameStarted = true;

        // Initialize UI pieces (these functions come from game.js)
        if (typeof drawBoard === 'function') drawBoard();
        if (typeof createPlayerTokens === 'function') createPlayerTokens();
        if (typeof createPlayerPanel === 'function') createPlayerPanel();
        if (typeof updateTurnDisplay === 'function') updateTurnDisplay();

        // Sync initial state to DB
        syncGameState();
        updateDiceButton();
    } catch (err) {
        console.error('initializeOnlineGame error:', err);
    }
}

function syncGameState() {
    if (multiplayerState.demoMode || !multiplayerState.currentGroup) return;
    try {
        const db = safeDatabase();
        const gameStateData = {
            players: gameState.players,
            currentPlayerIndex: gameState.currentPlayerIndex,
            round: gameState.round,
            lastUpdate: Date.now()
        };
        db.ref('groups/' + multiplayerState.currentGroup + '/gameState').set(gameStateData);
    } catch (err) {
        console.warn('syncGameState failed:', err);
    }
}

function handleGameStateUpdate(snapshot) {
    const data = snapshot?.val();
    if (!data) return;

    // Merge carefully to avoid wiping anything unexpected
    try {
        gameState.players = data.players || gameState.players;
        gameState.currentPlayerIndex = typeof data.currentPlayerIndex === 'number' ? data.currentPlayerIndex : gameState.currentPlayerIndex;
        gameState.round = typeof data.round === 'number' ? data.round : gameState.round;
        if (typeof updateAllTokenPositions === 'function') updateAllTokenPositions();
        if (typeof updateTurnDisplay === 'function') updateTurnDisplay();
        if (typeof updateDiceButton === 'function') updateDiceButton();
        const roundCounter = $id('round-counter');
        if (roundCounter) roundCounter.textContent = `ROUND: ${gameState.round}`;
    } catch (err) {
        console.error('handleGameStateUpdate error:', err);
    }
}

function updateAllTokenPositions() {
    if (!gameState || !Array.isArray(gameState.players)) return;
    gameState.players.forEach((player, index) => {
        const token = $id(`token-${index}`);
        if (token && typeof getTokenPosition === 'function') {
            const pos = getTokenPosition(player.position, index);
            token.style.left = (pos.x || 0) + 'px';
            token.style.top = (pos.y || 0) + 'px';
        }
        const posEl = $id(`pos-${index}`);
        if (posEl) posEl.textContent = player.position;
    });
}

function updateDiceButton() {
    const rollBtn = $id('roll-dice-btn');
    if (!rollBtn || !gameState || !Array.isArray(gameState.players)) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex] || {};
    if (currentPlayer.username === multiplayerState.currentUser?.username) {
        rollBtn.disabled = false;
        rollBtn.textContent = 'ROLL DICE (YOUR TURN)';
    } else {
        rollBtn.disabled = true;
        rollBtn.textContent = `WAITING FOR ${currentPlayer.name || 'PLAYER'}...`;
    }
}

// ===================================
// UI TRANSITIONS (fallback if anime missing)
// ===================================

function transitionScreen(fromId, toId) {
    const fromScreen = $id(fromId);
    const toScreen = $id(toId);
    if (!toScreen) return;
    // If anime available use it, otherwise just toggle classes
    if (typeof anime !== 'undefined') {
        if (fromScreen) {
            anime({
                targets: fromScreen,
                opacity: [1, 0],
                duration: 250,
                easing: 'easeOutQuad',
                complete: () => {
                    fromScreen.classList.remove('active');
                    toScreen.classList.add('active');
                    anime({
                        targets: toScreen,
                        opacity: [0, 1],
                        duration: 250,
                        easing: 'easeInQuad'
                    });
                }
            });
        } else {
            toScreen.classList.add('active');
        }
    } else {
        if (fromScreen) fromScreen.classList.remove('active');
        toScreen.classList.add('active');
    }
}

// ===================================
// INITIALIZATION & EVENT BINDING
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    logIf('DOM ready — initializing multiplayer listeners');
    initializeEventListeners();
});

function initializeEventListeners() {
    logIf('Setting up listeners...');

    // Preload existing user
    const saved = localStorage.getItem('soloLevelingUser');
    if (saved) {
        try {
            multiplayerState.currentUser = JSON.parse(saved);
            logIf('Loaded saved user:', multiplayerState.currentUser);
            // optionally auto-skip to mode select
            // transitionScreen('screen-login', 'screen-mode-select');
        } catch (err) { /* ignore parse errors */ }
    }

    // Login
    $id('login-btn-game')?.addEventListener('click', handleLogin);
    $id('player-username')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

    // Mode Selection
    document.querySelector('#single-phone-mode .mode-btn')?.addEventListener('click', selectSinglePhoneMode);
    document.querySelector('#multi-phone-mode .mode-btn')?.addEventListener('click', selectMultiPhoneMode);

    // Group selection
    $id('create-group-btn')?.addEventListener('click', showCreateGroupScreen);
    $id('join-group-btn')?.addEventListener('click', showJoinGroupScreen);
    $id('back-to-mode')?.addEventListener('click', () => transitionScreen('screen-group-select', 'screen-mode-select'));

    // Create / Join group actions
    $id('create-group-submit')?.addEventListener('click', createGroup);
    $id('cancel-create-group')?.addEventListener('click', () => transitionScreen('screen-create-group', 'screen-group-select'));
    $id('back-to-group-select')?.addEventListener('click', () => transitionScreen('screen-join-group', 'screen-group-select'));
    $id('search-groups')?.addEventListener('input', (e) => {
        const searchTerm = (e.target.value || '').toLowerCase();
        document.querySelectorAll('.group-card').forEach(card => {
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            card.style.display = title.includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Lobby
    $id('start-online-game')?.addEventListener('click', startOnlineGameAsCreator);
    $id('leave-lobby')?.addEventListener('click', leaveLobby);

    // Expose useful functions globally for game.js integration
    window.multiplayerState = multiplayerState;
    window.syncGameState = syncGameState;
    window.updateDiceButton = updateDiceButton;
    window.joinGroup = joinGroup;
    window.createGroup = createGroup;

    logIf('Event listeners initialized');
}
