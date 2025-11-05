// ===================================
// MULTIPLAYER FUNCTIONALITY
// ===================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_S56To4eTZNImejsbm0iwm10JCo5v5C4",
    authDomain: "solo-leveling-game-4.firebaseapp.com",
    databaseURL: "https://solo-leveling-game-4-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "solo-leveling-game-4",
    storageBucket: "solo-leveling-game-4.firebasestorage.app",
    messagingSenderId: "107352266789",
    appId: "1:107352266789:web:1437ea6ef382eb406a87cc"
};

// Initialize Firebase
let firebaseApp, database;
try {
    console.log('Initializing Firebase...');
    firebaseApp = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback to demo mode if Firebase not configured
    console.warn('Running in DEMO mode - multiplayer features limited');
}

// Multiplayer State
const multiplayerState = {
    currentUser: null,
    currentGroup: null,
    isOnlineMode: false,
    groupRef: null,
    chatRef: null,
    playersRef: null
};

// ===================================
// USER AUTHENTICATION
// ===================================

function handleLogin() {
    const name = document.getElementById('player-name').value.trim();
    const username = document.getElementById('player-username').value.trim();
    
    if (!name || !username) {
        alert('Please enter both name and username!');
        return;
    }
    
    // Validate username (alphanumeric only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        alert('Username can only contain letters, numbers, and underscores!');
        return;
    }
    
    // Store user info
    multiplayerState.currentUser = {
        name: name,
        username: username,
        id: generateUserId(),
        timestamp: Date.now()
    };
    
    // Save to localStorage
    localStorage.setItem('soloLevelingUser', JSON.stringify(multiplayerState.currentUser));
    
    // Transition to mode selection
    transitionScreen('screen-login', 'screen-mode-select');
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===================================
// MODE SELECTION
// ===================================

function selectSinglePhoneMode() {
    multiplayerState.isOnlineMode = false;
    transitionScreen('screen-mode-select', 'screen-player-select');
}

function selectMultiPhoneMode() {
    multiplayerState.isOnlineMode = true;
    
    if (!database) {
        alert('Firebase not configured! Please set up Firebase to use online multiplayer.\n\nSee MULTIPLAYER_SETUP.md for instructions.');
        return;
    }
    
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
    addBtn.addEventListener('click', addInviteInput);
}

function addInviteInput() {
    const container = document.getElementById('invite-inputs');
    const newRow = document.createElement('div');
    newRow.className = 'invite-input-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Enter username to invite" class="game-input invite-username">
        <button class="neon-btn small remove-invite-btn">−</button>
    `;
    container.appendChild(newRow);
    
    newRow.querySelector('.remove-invite-btn').addEventListener('click', () => {
        newRow.remove();
    });
}

async function createGroup() {
    const groupName = document.getElementById('group-name-input').value.trim();
    
    if (!groupName) {
        alert('Please enter a group name!');
        return;
    }
    
    // Check if database is initialized
    if (!database) {
        alert('Firebase Realtime Database not initialized!\n\nPlease:\n1. Go to Firebase Console\n2. Enable Realtime Database\n3. Set security rules\n4. Refresh this page\n\nSee MULTIPLAYER_SETUP.md for details.');
        console.error('Firebase database not initialized. Please enable Realtime Database in Firebase Console.');
        return;
    }
    
    // Get invited usernames
    const inviteInputs = document.querySelectorAll('.invite-username');
    const invitedUsers = Array.from(inviteInputs)
        .map(input => input.value.trim())
        .filter(username => username && username !== multiplayerState.currentUser.username);
    
    // Generate group code
    const groupCode = generateGroupCode();
    
    console.log('Creating group:', groupName, 'with code:', groupCode);
    
    // Create group object
    const groupData = {
        code: groupCode,
        name: groupName,
        creator: multiplayerState.currentUser.username,
        createdAt: Date.now(),
        status: 'waiting', // waiting, playing, finished
        players: {
            [multiplayerState.currentUser.username]: {
                ...multiplayerState.currentUser,
                isReady: false,
                isCreator: true
            }
        },
        invitedUsers: invitedUsers,
        maxPlayers: 4,
        gameState: null
    };
    
    try {
        // Save to Firebase
        console.log('Saving to Firebase...');
        const groupRef = database.ref('groups/' + groupCode);
        await groupRef.set(groupData);
        
        console.log('Group created successfully!');
        
        multiplayerState.currentGroup = groupCode;
        multiplayerState.groupRef = groupRef;
        
        // Join lobby
        joinLobby(groupCode);
        
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group.\n\nError: ' + error.message + '\n\nPlease check:\n1. Realtime Database is enabled\n2. Security rules are set\n3. Internet connection\n\nSee browser console (F12) for details.');
    }
}

function generateGroupCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function loadAvailableGroups() {
    console.log('loadAvailableGroups called');
    const groupsList = document.getElementById('groups-list');
    
    if (!groupsList) {
        console.error('groups-list element not found in the DOM');
        return;
    }
    
    console.log('groupsList element found, setting loading state');
    groupsList.innerHTML = '<div class="loading">Loading groups...</div>';
    
    try {
        console.log('Loading groups from Firebase...');
        if (!database) {
            throw new Error('Firebase database is not initialized');
        }
        
        const groupsRef = database.ref('groups');
        console.log('Groups reference created, fetching data...');
        
        const snapshot = await groupsRef.once('value');
        const groups = snapshot.val();
        
        console.log('Raw groups data from Firebase:', groups);
        
        groupsList.innerHTML = '';
        
        if (!groups) {
            console.warn('No groups data received from Firebase');
            groupsList.innerHTML = `
                <div class="no-groups">
                    No groups found in the database. 
                    <button onclick="loadAvailableGroups()" class="neon-btn small">Refresh</button>
                </div>`;
            return;
        }
        
        const groupEntries = Object.entries(groups);
        console.log(`Found ${groupEntries.length} groups in database`);
        
        if (groupEntries.length === 0) {
            console.log('No groups found in database');
            groupsList.innerHTML = `
                <div class="no-groups">
                    No groups available. Create one!
                    <button onclick="loadAvailableGroups()" class="neon-btn small">Refresh</button>
                </div>`;
            return;
        }
        
        let hasActiveGroups = false;
        let processedGroups = 0;
        
        // Filter active groups
        groupEntries.forEach(([code, group]) => {
            try {
                processedGroups++;
                console.log(`\n--- Processing group ${processedGroups}/${groupEntries.length} ---`);
                console.log('Group code:', code);
                console.log('Group data:', group);
                
                // Check if group exists and has required properties
                if (!group) {
                    console.warn('Group is null or undefined');
                    return;
                }
                
                if (typeof group !== 'object') {
                    console.warn('Group is not an object:', group);
                    return;
                }
                
                // Log group status and player count for debugging
                console.log(`Group status: '${group.status}'`);
                const playerCount = group.players ? Object.keys(group.players).length : 0;
                console.log(`Player count: ${playerCount}/${group.maxPlayers || 4}`);
                
                // Check if group is joinable (handle both 'waiting' and 'wating' typos)
                const isStatusValid = group.status === 'waiting' || group.status === 'wating';
                const hasPlayers = group.players && typeof group.players === 'object';
                const hasSpace = hasPlayers ? (Object.keys(group.players).length < (group.maxPlayers || 4)) : false;
                
                console.log(`Status check (waiting/wating): ${isStatusValid}`);
                console.log(`Has players object: ${hasPlayers}`);
                console.log(`Has space: ${hasSpace}`);
                
                const isJoinable = isStatusValid && hasPlayers && hasSpace;
                
                if (isJoinable) {
                    console.log(`Group ${code} is joinable, creating card...`);
                    const groupCard = createGroupCard(code, group);
                    if (groupCard) {
                        groupsList.appendChild(groupCard);
                        hasActiveGroups = true;
                        console.log(`Added group ${code} to the list`);
                    } else {
                        console.warn('Failed to create group card for:', code);
                    }
                } else {
                    console.log(`Group ${code} is not joinable. Reasons:`);
                    if (!isStatusValid) console.log('- Status is not "waiting" or "wating"');
                    if (!hasPlayers) console.log('- Missing or invalid players object');
                    if (!hasSpace) console.log('- Group is full');
                }
            } catch (groupError) {
                console.error('Error processing group:', code, groupError);
            }
        });
        
        if (!hasActiveGroups) {
            console.log('No active groups available');
            groupsList.innerHTML = '<div class="no-groups">No active groups available. Create one!</div>';
        }
        
    } catch (error) {
        console.error('Error loading groups:', error);
        groupsList.innerHTML = `
            <div class="error">
                Failed to load groups. 
                ${error.message || ''}
                <br><br>
                <button onclick="loadAvailableGroups()" class="neon-btn small">Retry</button>
            </div>
        `;
    }
}

function createGroupCard(code, group) {
    console.log('Creating group card for:', code, group);
    
    try {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.style.margin = '10px';
        card.style.padding = '15px';
        card.style.border = '1px solid #444';
        card.style.borderRadius = '8px';
        card.style.backgroundColor = '#1a1a2e';
        card.style.color = 'white';
        
        const playerCount = group.players ? Object.keys(group.players).length : 0;
        const maxPlayers = group.maxPlayers || 4;
        const groupName = group.name || 'Untitled Group';
        const creatorName = group.creator || 'Unknown';
        
        // Create card content with basic styling
        card.innerHTML = `
            <div class="group-card-header" style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 8px;">
                <h3 style="margin: 0 0 5px 0; color: #00d4ff; font-size: 1.2em;">${escapeHtml(groupName)}</h3>
                <span class="group-code" style="color: #888; font-size: 0.9em;">Code: ${code}</span>
            </div>
            <div class="group-card-body" style="margin-bottom: 10px;">
                <p style="margin: 5px 0;">Creator: ${escapeHtml(creatorName)}</p>
                <p style="margin: 5px 0;">Players: ${playerCount}/${maxPlayers}</p>
            </div>
            <button class="join-group-btn" 
                    data-code="${code}"
                    style="
                        background: linear-gradient(45deg, #00d4ff, #00ff88);
                        border: none;
                        color: #111;
                        padding: 8px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        width: 100%;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 0 10px #00d4ff'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                JOIN GAME
            </button>
        `;
        
        // Add click handler for the join button
        const joinBtn = card.querySelector('.join-group-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Join button clicked for group:', code);
                joinGroup(code);
            });
        }
        
        // Make the whole card clickable
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target !== joinBtn) {
                console.log('Card clicked for group:', code);
                joinGroup(code);
            }
        });
        
        console.log('Successfully created group card for:', code);
        return card;
        
    } catch (error) {
        console.error('Error creating group card:', error);
        const errorCard = document.createElement('div');
        errorCard.className = 'error-card';
        errorCard.style.color = 'red';
        errorCard.style.padding = '10px';
        errorCard.style.border = '1px solid red';
        errorCard.style.margin = '5px';
        errorCard.textContent = `Error loading group: ${code}`;
        return errorCard;
    }
}

async function joinGroup(groupCode) {
    try {
        const groupRef = database.ref('groups/' + groupCode);
        const snapshot = await groupRef.once('value');
        const group = snapshot.val();
        
        if (!group) {
            alert('Group not found!');
            return;
        }
        
        if (Object.keys(group.players).length >= group.maxPlayers) {
            alert('Group is full!');
            return;
        }
        
        // Add player to group
        await groupRef.child('players/' + multiplayerState.currentUser.username).set({
            ...multiplayerState.currentUser,
            isReady: false,
            isCreator: false
        });
        
        multiplayerState.currentGroup = groupCode;
        multiplayerState.groupRef = groupRef;
        
        // Join lobby
        joinLobby(groupCode);
        
    } catch (error) {
        console.error('Error joining group:', error);
        alert('Failed to join group. Please try again.');
    }
}

// ===================================
// LOBBY (WAITING ROOM)
// ===================================

function joinLobby(groupCode) {
    transitionScreen('screen-create-group', 'screen-lobby');
    transitionScreen('screen-join-group', 'screen-lobby');
    
    // Setup lobby
    document.getElementById('lobby-group-name').textContent = groupCode;
    document.getElementById('group-code').textContent = groupCode;
    
    // Listen for player updates
    multiplayerState.playersRef = database.ref('groups/' + groupCode + '/players');
    multiplayerState.playersRef.on('value', updateLobbyPlayers);
    
    // Listen for game start
    database.ref('groups/' + groupCode + '/status').on('value', (snapshot) => {
        if (snapshot.val() === 'playing') {
            startOnlineGame();
        }
    });
    
    // Setup chat
    setupLobbyChat(groupCode);
    
    // Show start button for creator
    const groupRef = database.ref('groups/' + groupCode);
    groupRef.child('creator').once('value', (snapshot) => {
        if (snapshot.val() === multiplayerState.currentUser.username) {
            document.getElementById('start-online-game').style.display = 'block';
        }
    });
}

function updateLobbyPlayers(snapshot) {
    const players = snapshot.val();
    const container = document.getElementById('lobby-players');
    container.innerHTML = '';
    
    if (!players) return;
    
    const playerCount = Object.keys(players).length;
    document.getElementById('player-count').textContent = playerCount;
    
    Object.entries(players).forEach(([username, player]) => {
        const playerCard = document.createElement('div');
        playerCard.className = 'lobby-player-card';
        if (player.isCreator) playerCard.classList.add('creator');
        if (username === multiplayerState.currentUser.username) playerCard.classList.add('you');
        
        playerCard.innerHTML = `
            <div class="player-avatar">${player.name[0].toUpperCase()}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-username">@${username}</div>
                ${player.isCreator ? '<span class="creator-badge">CREATOR</span>' : ''}
                ${username === multiplayerState.currentUser.username ? '<span class="you-badge">YOU</span>' : ''}
            </div>
        `;
        
        container.appendChild(playerCard);
    });
}

function leaveLobby() {
    if (!multiplayerState.currentGroup) return;
    
    // Remove player from group
    const playerRef = database.ref('groups/' + multiplayerState.currentGroup + '/players/' + multiplayerState.currentUser.username);
    playerRef.remove();
    
    // Stop listening
    if (multiplayerState.playersRef) {
        multiplayerState.playersRef.off();
    }
    if (multiplayerState.chatRef) {
        multiplayerState.chatRef.off();
    }
    
    // Go back
    transitionScreen('screen-lobby', 'screen-group-select');
    
    multiplayerState.currentGroup = null;
}

// ===================================
// CHAT FUNCTIONALITY
// ===================================

function setupLobbyChat(groupCode) {
    multiplayerState.chatRef = database.ref('groups/' + groupCode + '/chat');
    
    // Listen for new messages
    multiplayerState.chatRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        addChatMessage(message, 'chat-messages');
    });
    
    // Send message handler
    document.getElementById('send-chat').onclick = () => sendChatMessage('chat-input', groupCode);
    document.getElementById('chat-input').onkeypress = (e) => {
        if (e.key === 'Enter') sendChatMessage('chat-input', groupCode);
    };
}

function setupGameChat(groupCode) {
    // Setup chat for game screen
    document.getElementById('game-send-chat').onclick = () => sendChatMessage('game-chat-input', groupCode);
    document.getElementById('game-chat-input').onkeypress = (e) => {
        if (e.key === 'Enter') sendChatMessage('game-chat-input', groupCode);
    };
    
    // Listen for messages
    multiplayerState.chatRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        addChatMessage(message, 'game-chat-messages');
    });
    
    // Toggle chat
    document.getElementById('toggle-chat').onclick = toggleGameChat;
}

function sendChatMessage(inputId, groupCode) {
    const input = document.getElementById(inputId);
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatData = {
        username: multiplayerState.currentUser.username,
        name: multiplayerState.currentUser.name,
        message: message,
        timestamp: Date.now()
    };
    
    database.ref('groups/' + groupCode + '/chat').push(chatData);
    input.value = '';
}

function addChatMessage(message, containerId) {
    const container = document.getElementById(containerId);
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    if (message.username === multiplayerState.currentUser.username) {
        messageDiv.classList.add('own-message');
    }
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${message.name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(message.message)}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function toggleGameChat() {
    const chatPanel = document.getElementById('game-chat-panel');
    const chatBody = chatPanel.querySelector('.chat-body');
    const toggleBtn = document.getElementById('toggle-chat');
    
    if (chatBody.style.display === 'none') {
        chatBody.style.display = 'flex';
        toggleBtn.textContent = '−';
    } else {
        chatBody.style.display = 'none';
        toggleBtn.textContent = '+';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// ONLINE GAME START
// ===================================

async function startOnlineGameAsCreator() {
    if (!multiplayerState.currentGroup) return;
    
    const groupRef = database.ref('groups/' + multiplayerState.currentGroup);
    const snapshot = await groupRef.once('value');
    const group = snapshot.val();
    
    const playerCount = Object.keys(group.players).length;
    
    if (playerCount < 2) {
        alert('Need at least 2 players to start!');
        return;
    }
    
    // Update group status
    await groupRef.update({ status: 'playing' });
}

function startOnlineGame() {
    // Show game screen
    transitionScreen('screen-lobby', 'screen-game');
    
    // Show chat panel
    document.getElementById('game-chat-panel').style.display = 'flex';
    setupGameChat(multiplayerState.currentGroup);
    
    // Initialize online game
    initializeOnlineGame();
}

async function initializeOnlineGame() {
    const groupRef = database.ref('groups/' + multiplayerState.currentGroup);
    const snapshot = await groupRef.once('value');
    const group = snapshot.val();
    
    // Get players and their classes
    const players = Object.entries(group.players).map(([username, player], index) => ({
        id: index + 1,
        name: player.name,
        username: username,
        class: player.selectedClass || '6',
        position: 0,
        color: ['#ff3366', '#00d4ff', '#00ff88', '#ffaa00'][index]
    }));
    
    gameState.numPlayers = players.length;
    gameState.players = players;
    gameState.currentPlayerIndex = 0;
    gameState.round = 1;
    gameState.gameStarted = true;
    
    // Draw board
    drawBoard();
    createPlayerTokens();
    createPlayerPanel();
    updateTurnDisplay();
    
    // Sync game state
    syncGameState();
    
    // Listen for game state changes
    groupRef.child('gameState').on('value', handleGameStateUpdate);
    
    // Enable dice only for current player
    updateDiceButton();
}

function syncGameState() {
    if (!multiplayerState.currentGroup) return;
    
    const gameStateData = {
        players: gameState.players,
        currentPlayerIndex: gameState.currentPlayerIndex,
        round: gameState.round,
        lastUpdate: Date.now()
    };
    
    database.ref('groups/' + multiplayerState.currentGroup + '/gameState').set(gameStateData);
}

function handleGameStateUpdate(snapshot) {
    const data = snapshot.val();
    if (!data) return;
    
    // Update local game state
    gameState.players = data.players;
    gameState.currentPlayerIndex = data.currentPlayerIndex;
    gameState.round = data.round;
    
    // Update UI
    updateAllTokenPositions();
    updateTurnDisplay();
    updateDiceButton();
    document.getElementById('round-counter').textContent = `ROUND: ${gameState.round}`;
}

function updateAllTokenPositions() {
    gameState.players.forEach((player, index) => {
        const token = document.getElementById(`token-${index}`);
        if (token) {
            const pos = getTokenPosition(player.position, index);
            token.style.left = pos.x + 'px';
            token.style.top = pos.y + 'px';
        }
        document.getElementById(`pos-${index}`).textContent = player.position;
    });
}

function updateDiceButton() {
    const rollBtn = document.getElementById('roll-dice-btn');
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.username === multiplayerState.currentUser.username) {
        rollBtn.disabled = false;
        rollBtn.textContent = 'ROLL DICE (YOUR TURN)';
    } else {
        rollBtn.disabled = true;
        rollBtn.textContent = `WAITING FOR ${currentPlayer.name}...`;
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function transitionScreen(fromId, toId) {
    const fromScreen = document.getElementById(fromId);
    const toScreen = document.getElementById(toId);
    
    if (!fromScreen || !toScreen) return;
    
    anime({
        targets: fromScreen,
        opacity: [1, 0],
        duration: 300,
        easing: 'easeOutQuad',
        complete: () => {
            fromScreen.classList.remove('active');
            toScreen.classList.add('active');
            anime({
                targets: toScreen,
                opacity: [0, 1],
                duration: 300,
                easing: 'easeInQuad'
            });
        }
    });
}

// ===================================
// EVENT LISTENERS SETUP
// ===================================

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing event listeners...');
    initializeEventListeners();
});

// Function to initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Check if we're on the join group screen
    const joinGroupScreen = document.getElementById('screen-join-group');
    if (joinGroupScreen) {
        console.log('Join group screen found, loading available groups...');
        loadAvailableGroups();
    }
    
    // Rest of the event listeners...
    // Check for existing user
    const savedUser = localStorage.getItem('soloLevelingUser');
    if (savedUser) {
        multiplayerState.currentUser = JSON.parse(savedUser);
        // Auto-skip to mode selection if user exists
        // Uncomment if you want auto-login:
        // transitionScreen('screen-login', 'screen-mode-select');
    }
    
    // Login
    document.getElementById('login-btn-game')?.addEventListener('click', handleLogin);
    document.getElementById('player-username')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Mode selection
    document.querySelector('#single-phone-mode .mode-btn')?.addEventListener('click', selectSinglePhoneMode);
    document.querySelector('#multi-phone-mode .mode-btn')?.addEventListener('click', selectMultiPhoneMode);
    
    // Group selection
    document.getElementById('create-group-btn')?.addEventListener('click', showCreateGroupScreen);
    document.getElementById('join-group-btn')?.addEventListener('click', showJoinGroupScreen);
    document.getElementById('back-to-mode')?.addEventListener('click', () => {
        transitionScreen('screen-group-select', 'screen-mode-select');
    });
    
    // Create group
    document.getElementById('create-group-submit')?.addEventListener('click', createGroup);
    document.getElementById('cancel-create-group')?.addEventListener('click', () => {
        transitionScreen('screen-create-group', 'screen-group-select');
    });
    
    // Join group
    document.getElementById('back-to-group-select')?.addEventListener('click', () => {
        transitionScreen('screen-join-group', 'screen-group-select');
    });
    
    // Search groups
    document.getElementById('search-groups')?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.group-card').forEach(card => {
            const groupName = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = groupName.includes(searchTerm) ? 'block' : 'none';
        });
    });
    
    // Lobby
    document.getElementById('start-online-game')?.addEventListener('click', startOnlineGameAsCreator);
    document.getElementById('leave-lobby')?.addEventListener('click', leaveLobby);

    // Export for use in game.js
    window.multiplayerState = multiplayerState;
    window.syncGameState = syncGameState;
    window.updateDiceButton = updateDiceButton;
    
    console.log('Multiplayer module initialized');
}
