# 🎮 Solo Leveling - Snake & Ladder Game

A stunning anime-themed educational Snake & Ladder game inspired by Solo Leveling, featuring 11,000+ Indian GK questions across Classes 6-10.

![Solo Leveling Game](https://img.shields.io/badge/Game-Solo%20Leveling-blue?style=for-the-badge)
![Questions](https://img.shields.io/badge/Questions-11000%2B-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Ready-success?style=for-the-badge)

---

## ✨ Features

### 🎯 Game Features
- **2-4 Player Support** - Multiplayer snake & ladder gameplay
- **Online Multiplayer** - Play with friends on different devices! 🌐
- **Real-time Chat** - Chat with players during lobby and gameplay 💬
- **Group System** - Create or join game rooms
- **Class Selection** - Choose difficulty from Class 6 to Class 10
- **11,000+ Questions** - Comprehensive Indian GK database
- **MCQ System** - Answer questions on every tile landing
- **Snakes & Ladders** - Classic board game mechanics
- **Solo Leveling Theme** - Dark anime UI with stunning effects

### 🎨 Visual Effects
- ✅ **Portal Loading Animation** - Epic game entry
- ✅ **Shadow Aura** - Glowing player tokens
- ✅ **GSAP Animations** - Smooth tile-by-tile movement
- ✅ **Beru Drag Effect** - Wrong answer punishment animation
- ✅ **Shadow Army Burst** - Correct answer celebration
- ✅ **XP Level Up** - Floating text effects
- ✅ **Screen Shake** - Dice roll impact
- ✅ **Neon UI** - Glowing buttons and borders
- ✅ **Particle Effects** - Floating background particles

### 🔧 Admin Panel Features
- **Password Protected** - Secure admin access (default: `admin123`)
- **Multi-Format Import** - Upload questions from:
  - 📄 PDF files (with text extraction)
  - 📊 CSV files
  - 📝 TXT files
  - 🔧 JSON files
- **Question Management** - Add, edit, delete questions
- **Search & Filter** - Find questions by class or keyword
- **Bulk Operations** - Import/export thousands of questions
- **Export Options** - Download as JSON, CSV, or TXT

### 💾 Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Animations**: GSAP, Anime.js
- **Storage**: IndexedDB (offline-first)
- **PDF Parsing**: PDF.js
- **Fonts**: Orbitron, Rajdhani (Google Fonts)

---

## 📂 Project Structure

```
game2/
├── index.html              # Main game page
├── admin.html              # Admin panel
├── style.css               # Main styles
├── animations.css          # Animation effects
├── admin.css               # Admin panel styles
├── multiplayer.css         # Multiplayer UI styles
├── game.js                 # Game logic
├── admin.js                # Admin panel logic
├── multiplayer.js          # Online multiplayer logic
├── questions.json          # 11,000+ questions database
├── generate_questions.py   # Question generator script
├── README.md               # Main documentation
├── DEPLOYMENT.md           # Deployment guide
├── MULTIPLAYER_SETUP.md    # Multiplayer setup guide
├── QUICKSTART.md           # Quick start guide
├── assets/
│   └── README.txt          # Audio files guide
└── LICENSE                 # MIT License
```

---

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone or Download** this repository
2. **Open with Live Server**:
   - Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code
   - Right-click `index.html` → "Open with Live Server"
3. **Start Playing!**

### Option 2: Direct File Access

1. Simply open `index.html` in a modern browser
2. Note: Some features may require a local server

---

## 🎮 How to Play

### Step 1: Login
- Enter your name and username
- Username must be unique for online play
- Click "ENTER ARENA"

### Step 2: Choose Game Mode
- **SINGLE DEVICE**: Play locally on one phone/computer
- **ONLINE MULTIPLAYER**: Play with friends on different devices

### For Single Device Mode:

### Step 3: Select Players
- Choose 2, 3, or 4 players
- Click on the player count button

### Step 4: Choose Class Level
- Each player selects their difficulty (Class 6-10)
- Higher classes have harder questions
- Click "START BATTLE" when ready

### For Online Multiplayer Mode:

### Step 3: Create or Join Group
- **Create Group**: Start a new game room, invite friends
- **Join Group**: Browse and join existing game rooms

### Step 4: Wait in Lobby
- See all players in the group
- Chat with other players
- Creator starts the game when ready

### Step 5: Play the Game
1. **Roll Dice** - Click the glowing dice button
2. **Move Token** - Watch your token move tile-by-tile
3. **Answer Question** - MCQ appears on every landing
4. **Correct Answer** ✅ - Shadow army burst + stay on tile
5. **Wrong Answer** ❌ - Beru drags you back to tile 0!
6. **Snakes** 🐍 - Slide down to lower tile
7. **Ladders** 🪜 - Climb up to higher tile
8. **Win** 🏆 - First to reach tile 100 wins!

---

## 🌐 Online Multiplayer Setup

### Quick Setup (5 minutes)

1. **Create Firebase Account** (Free)
   - Go to https://console.firebase.google.com/
   - Create new project
   - Enable Realtime Database

2. **Get Firebase Config**
   - Add web app in Firebase Console
   - Copy the configuration object

3. **Update Game**
   - Open `multiplayer.js`
   - Replace `firebaseConfig` (lines 8-16) with your config
   - Save file

4. **Deploy to GitHub Pages**
   - Push code to GitHub
   - Enable Pages in repository settings
   - Share URL with friends!

**Detailed Guide**: See `MULTIPLAYER_SETUP.md`

### Features
- ✅ Create/Join game groups
- ✅ Real-time chat in lobby and game
- ✅ Automatic game state sync
- ✅ Works on all devices
- ✅ No server costs (Firebase free tier)

---

## 🔐 Admin Panel

### Access Admin Panel
1. Navigate to `/admin.html`
2. Enter password: `admin123`
3. Click "ACCESS SYSTEM"

### Import Questions

#### From JSON
```json
[
  {
    "class": "6",
    "question": "What is the capital of India?",
    "options": ["New Delhi", "Mumbai", "Kolkata", "Chennai"],
    "answer": "New Delhi"
  }
]
```

#### From CSV
```csv
Class,Question,Option A,Option B,Option C,Option D,Answer
6,"What is 2+2?","4","3","5","6","4"
```

#### From TXT
```
Class: 6
Question: What is the capital of India?
A) New Delhi
B) Mumbai
C) Kolkata
D) Chennai
Answer: New Delhi
```

#### From PDF
- Upload any PDF with questions in the above TXT format
- The system will automatically extract and parse questions

### Manage Questions
- **Search**: Find questions by keyword
- **Filter**: Filter by class level
- **Edit**: Modify existing questions
- **Delete**: Remove questions
- **Clear All**: Delete entire database (with confirmation)

### Export Database
- **JSON**: Full database export
- **CSV**: Spreadsheet-compatible format
- **TXT**: Human-readable format
- **By Class**: Export specific class questions

---

## 🌐 Deploy to GitHub Pages

### Method 1: GitHub Desktop

1. **Create Repository**
   - Open GitHub Desktop
   - File → New Repository
   - Name: `solo-leveling-game`
   - Local Path: Select `game2` folder
   - Click "Create Repository"

2. **Publish to GitHub**
   - Click "Publish repository"
   - Uncheck "Keep this code private" (for GitHub Pages)
   - Click "Publish repository"

3. **Enable GitHub Pages**
   - Go to repository on GitHub.com
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` → `/root`
   - Click "Save"

4. **Access Your Game**
   - URL: `https://[username].github.io/solo-leveling-game/`
   - Wait 2-3 minutes for deployment

### Method 2: Git Command Line

```bash
cd game2
git init
git add .
git commit -m "Initial commit - Solo Leveling Game"
git branch -M main
git remote add origin https://github.com/[username]/solo-leveling-game.git
git push -u origin main
```

Then enable GitHub Pages in repository settings.

### Method 3: Upload via GitHub Web

1. Create new repository on GitHub.com
2. Click "uploading an existing file"
3. Drag and drop all files from `game2` folder
4. Commit changes
5. Enable GitHub Pages in Settings

---

## 🎵 Adding Audio Files

The game supports background music and sound effects:

1. **Download royalty-free sounds** from:
   - [Freesound.org](https://freesound.org/)
   - [Mixkit.co](https://mixkit.co/free-sound-effects/)
   - [Zapsplat.com](https://www.zapsplat.com/)

2. **Required files** (place in `assets/` folder):
   - `bg-music.mp3` - Background music
   - `dice.mp3` - Dice roll sound
   - `correct.mp3` - Correct answer sound
   - `wrong.mp3` - Wrong answer sound
   - `win.mp3` - Victory sound

3. **Recommended**:
   - Use Solo Leveling OST for background music
   - Keep file sizes under 5MB for faster loading
   - Format: MP3 (best browser compatibility)

---

## 🛠️ Customization

### Change Admin Password
Edit `admin.js` line 68:
```javascript
const correctPassword = 'your_new_password';
```

### Modify Board Layout
Edit `game.js` lines 15-22:
```javascript
snakes: {
    98: 28, // From tile 98 to tile 28
    // Add more snakes
},
ladders: {
    4: 56, // From tile 4 to tile 56
    // Add more ladders
}
```

### Change Color Theme
Edit `style.css` lines 9-17:
```css
:root {
    --primary-blue: #00d4ff;
    --primary-purple: #8b5cf6;
    /* Modify colors */
}
```

### Add More Questions
1. Use admin panel to import
2. Or edit `questions.json` directly
3. Or run `generate_questions.py` to create more

---

## 📊 Question Database

### Statistics
- **Total Questions**: 11,000+
- **Classes Covered**: 6, 7, 8, 9, 10
- **Subjects**: Science, Math, History, Geography, Civics
- **Format**: Multiple Choice Questions (4 options)

### Question Distribution
- Class 6: ~2,200 questions
- Class 7: ~2,200 questions
- Class 8: ~2,200 questions
- Class 9: ~2,200 questions
- Class 10: ~2,200 questions

### Regenerate Questions
```bash
python generate_questions.py
```

---

## 🐛 Troubleshooting

### Questions Not Loading
- Check browser console for errors
- Ensure `questions.json` exists
- Clear browser cache and reload

### Admin Panel Not Working
- Check if IndexedDB is enabled in browser
- Try incognito/private mode
- Ensure JavaScript is enabled

### Animations Not Smooth
- Close other browser tabs
- Update to latest browser version
- Check GPU acceleration is enabled

### Audio Not Playing
- Check if audio files exist in `assets/` folder
- Some browsers block autoplay - click to enable
- Ensure files are in MP3 format

---

## 🌟 Features Breakdown

### Game Flow
```
Player Selection → Class Selection → Game Board → Questions → Winner
```

### Question System
```
Land on Tile → Show MCQ → 30s Timer → Answer → Result → Next Turn
```

### Correct Answer Flow
```
Correct ✓ → Shadow Army Burst → +5 XP → Stay on Tile → Next Turn
```

### Wrong Answer Flow
```
Wrong ✗ → Beru Appears → Drag Animation → Back to Tile 0 → Next Turn
```

---

## 💡 Tips & Tricks

### For Players
- Higher classes = harder questions but more challenge
- Watch out for snakes near the end!
- Ladders can help you catch up quickly
- Answer carefully - wrong answers reset you to 0!

### For Admins
- Regularly backup your question database
- Test imported questions before deploying
- Use CSV for bulk editing in Excel/Sheets
- Keep questions appropriate for class level

---

## 📜 License

This project is open source and available for educational purposes.

### Credits
- **Inspired by**: Solo Leveling (Manhwa/Anime)
- **Game Concept**: Snake & Ladder (Traditional Board Game)
- **Fonts**: Google Fonts (Orbitron, Rajdhani)
- **Animations**: GSAP, Anime.js

---

## 🤝 Contributing

Want to improve the game? Here's how:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### Ideas for Contribution
- Add more question categories
- Create new animation effects
- Improve mobile responsiveness
- Add multiplayer online mode
- Create difficulty levels
- Add achievements system

---

## 📞 Support

Having issues? Here's how to get help:

1. **Check README** - Most answers are here
2. **Browser Console** - Check for error messages
3. **GitHub Issues** - Report bugs or request features
4. **Documentation** - Read inline code comments

---

## 🎯 Roadmap

### Planned Features
- [ ] Mobile app version
- [ ] Online multiplayer
- [ ] Leaderboard system
- [ ] More animation effects
- [ ] Voice narration
- [ ] Achievement badges
- [ ] Daily challenges
- [ ] Custom board editor

---

## 📸 Screenshots

### Game Screens
- **Screen 1**: Player selection with neon buttons
- **Screen 2**: Class selection with glowing cards
- **Screen 3**: Game board with animated tokens
- **Question Modal**: MCQ with timer and effects
- **Winner Screen**: Victory celebration

### Admin Panel
- **Login**: Password-protected access
- **Import**: Multi-format file upload
- **Manage**: Search, filter, edit questions
- **Export**: Download database in various formats

---

## 🔥 Performance

### Optimizations
- IndexedDB for fast question retrieval
- CSS animations for GPU acceleration
- Lazy loading for better initial load
- Compressed assets for faster download

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🎊 Acknowledgments

Special thanks to:
- Solo Leveling creators for the amazing theme
- Open source community for libraries
- Contributors and testers
- You for playing!

---

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✅ Complete game implementation
- ✅ 11,000+ questions database
- ✅ Admin panel with import/export
- ✅ Solo Leveling theme and effects
- ✅ Full offline support
- ✅ Multi-format question import
- ✅ Comprehensive documentation

---

## 🚀 Get Started Now!

1. Open `index.html`
2. Select players
3. Choose classes
4. Start playing!

**Enjoy the game and level up your knowledge! 🎮✨**

---

Made with ❤️ for education and fun

**ARISE!** 👑
