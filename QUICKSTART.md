# ⚡ Quick Start Guide

Get your Solo Leveling game running in 60 seconds!

---

## 🎮 Play Locally (Easiest)

### Option 1: VS Code Live Server
1. Open `game2` folder in VS Code
2. Install **Live Server** extension
3. Right-click `index.html` → "Open with Live Server"
4. Game opens in browser automatically! 🎉

### Option 2: Direct Browser
1. Navigate to `C:\Users\HP\Desktop\game2`
2. Double-click `index.html`
3. Game opens in default browser
4. Start playing!

---

## 🎯 How to Play

### 3 Simple Steps:
1. **Choose Players** (2-4)
2. **Select Class** (6-10 for each player)
3. **Roll Dice & Answer Questions!**

### Game Rules:
- ✅ **Correct Answer** = Stay on tile + Shadow Army FX
- ❌ **Wrong Answer** = Beru drags you to tile 0!
- 🐍 **Snake** = Slide down
- 🪜 **Ladder** = Climb up
- 🏆 **First to 100** = Winner!

---

## 🔐 Admin Panel

### Access:
1. Open `admin.html` in browser
2. Password: `admin123`
3. Click "ACCESS SYSTEM"

### Quick Actions:
- **Import**: Upload JSON/CSV/TXT/PDF questions
- **Manage**: Edit/delete questions
- **Export**: Download database

---

## 🚀 Deploy to GitHub Pages

### Super Quick Method:
1. Create GitHub account
2. Install GitHub Desktop
3. Create new repository from `game2` folder
4. Publish repository
5. Enable Pages in Settings
6. Done! Share your URL 🎊

**Detailed guide**: See `DEPLOYMENT.md`

---

## 📁 Project Files

```
game2/
├── index.html          ← Main game (open this)
├── admin.html          ← Admin panel
├── game.js             ← Game logic
├── admin.js            ← Admin logic
├── style.css           ← Styles
├── animations.css      ← Effects
├── admin.css           ← Admin styles
├── questions.json      ← 11,000+ questions
├── README.md           ← Full documentation
├── DEPLOYMENT.md       ← Deploy guide
└── assets/             ← Audio files (optional)
```

---

## 🎵 Add Sounds (Optional)

1. Download free sounds from:
   - [Freesound.org](https://freesound.org/)
   - [Mixkit.co](https://mixkit.co/)

2. Save in `assets/` folder:
   - `bg-music.mp3`
   - `dice.mp3`
   - `correct.mp3`
   - `wrong.mp3`
   - `win.mp3`

3. Refresh game - sounds work automatically!

---

## 🐛 Troubleshooting

### Questions not loading?
- Check if `questions.json` exists
- Clear browser cache (Ctrl+Shift+Delete)
- Open browser console (F12) for errors

### Admin panel not working?
- Try incognito/private mode
- Check if JavaScript is enabled
- Verify IndexedDB support

### Animations laggy?
- Close other browser tabs
- Update browser to latest version
- Enable GPU acceleration

---

## ✨ Features at a Glance

- ✅ 11,000+ Indian GK questions
- ✅ Classes 6-10 difficulty levels
- ✅ 2-4 player multiplayer
- ✅ Solo Leveling anime theme
- ✅ Epic animations & effects
- ✅ Admin panel with import/export
- ✅ Fully offline (no internet needed)
- ✅ Mobile responsive

---

## 🎨 Customize

### Change Admin Password
Edit `admin.js` line 68:
```javascript
const correctPassword = 'your_password';
```

### Change Colors
Edit `style.css` lines 9-17:
```css
--primary-blue: #00d4ff;
--primary-purple: #8b5cf6;
```

### Add More Questions
1. Use admin panel to import
2. Or edit `questions.json` directly

---

## 📚 Need More Help?

- **Full Guide**: `README.md`
- **Deploy Guide**: `DEPLOYMENT.md`
- **Browser Console**: Press F12 for errors

---

## 🎊 That's It!

You're ready to play! 

**ARISE!** 👑

Enjoy the game and level up your knowledge! 🎮✨
