# 🌐 Multiplayer Setup Guide

Complete guide to set up online multiplayer for Solo Leveling game using Firebase.

---

## 📋 Overview

The multiplayer mode allows players to:
- ✅ Create and join game groups
- ✅ Play together from different devices
- ✅ Chat in real-time during lobby and gameplay
- ✅ Sync game state across all players

---

## 🔥 Firebase Setup (FREE)

### Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Add project" or "Create a project"

2. **Project Setup**
   - Project name: `solo-leveling-game` (or any name)
   - Google Analytics: Optional (can disable)
   - Click "Create project"
   - Wait for project creation

### Step 2: Get Firebase Configuration

1. **Add Web App**
   - In Firebase Console, click the **Web icon** (</>)
   - App nickname: `Solo Leveling Game`
   - Firebase Hosting: No (we'll use GitHub Pages)
   - Click "Register app"

2. **Copy Configuration**
   - You'll see a `firebaseConfig` object
   - Copy the entire configuration
   - It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project.firebaseio.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

### Step 3: Enable Realtime Database

1. **Create Database**
   - In Firebase Console, go to **Build** → **Realtime Database**
   - Click "Create Database"
   - Location: Choose closest to your region
   - Security rules: Start in **test mode** (for development)
   - Click "Enable"

2. **Configure Security Rules**
   - Go to **Rules** tab
   - Replace with these rules:
   ```json
   {
     "rules": {
       "groups": {
         ".read": true,
         ".write": true,
         "$groupId": {
           ".indexOn": ["status", "createdAt"]
         }
       }
     }
   }
   ```
   - Click "Publish"

   **Note**: These are permissive rules for development. For production, implement proper authentication.

### Step 4: Update Game Configuration

1. **Open `multiplayer.js`**
   - Find line 8-16 (firebaseConfig)
   - Replace with YOUR Firebase config from Step 2

2. **Example**:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY_HERE",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       databaseURL: "https://YOUR_PROJECT.firebaseio.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

3. **Save the file**

---

## 🚀 Deploy to GitHub Pages

### Why GitHub Pages?

- ✅ Free hosting
- ✅ HTTPS enabled (required for Firebase)
- ✅ Custom domain support
- ✅ Easy deployment

### Deployment Steps

1. **Create GitHub Repository**
   ```bash
   cd C:\Users\HP\Desktop\game2
   git init
   git add .
   git commit -m "Add multiplayer support"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/solo-leveling-game.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Deploy from branch
   - Branch: `main` → `/ (root)`
   - Click Save

3. **Wait for Deployment**
   - GitHub Pages URL: `https://YOUR_USERNAME.github.io/solo-leveling-game/`
   - Deployment takes 2-5 minutes

4. **Update Firebase Authorized Domains**
   - Firebase Console → Authentication → Settings
   - Authorized domains → Add domain
   - Add: `YOUR_USERNAME.github.io`

---

## 🎮 How to Use Multiplayer

### For Players

#### 1. Login
- Enter your name and username
- Username must be unique
- Click "ENTER ARENA"

#### 2. Choose Mode
- **SINGLE DEVICE**: Play locally on one phone (original mode)
- **ONLINE MULTIPLAYER**: Play with friends online

#### 3. Online Multiplayer Options

**Option A: Create Group**
1. Click "CREATE GROUP"
2. Enter group name
3. (Optional) Invite friends by username
4. Click "CREATE & START"
5. Share group code with friends
6. Wait in lobby for players to join
7. Click "START GAME" when ready

**Option B: Join Group**
1. Click "JOIN GROUP"
2. Browse available groups
3. Click "JOIN" on desired group
4. Wait in lobby for game to start

#### 4. In Lobby
- See all players in the group
- Chat with other players
- Creator can start the game
- Anyone can leave

#### 5. During Game
- Only current player can roll dice
- Game state syncs automatically
- Chat with players using chat panel
- Toggle chat with +/− button

---

## 💬 Chat Features

### Lobby Chat
- Real-time messaging
- See all messages from group members
- Send messages before game starts

### Game Chat
- Floating chat panel on game screen
- Minimize/maximize with toggle button
- Chat while playing
- Messages sync across all players

---

## 🔧 Troubleshooting

### Issue: "Firebase not configured"

**Solution**:
1. Check if you replaced the Firebase config in `multiplayer.js`
2. Ensure all values are correct (no placeholder text)
3. Verify Firebase project is created

### Issue: "Failed to create/join group"

**Solution**:
1. Check internet connection
2. Verify Firebase Realtime Database is enabled
3. Check browser console for errors (F12)
4. Ensure security rules are published

### Issue: "Groups not loading"

**Solution**:
1. Refresh the page
2. Check Firebase Console → Realtime Database for data
3. Verify database URL in config
4. Check browser console for errors

### Issue: "Chat not working"

**Solution**:
1. Ensure you're in a group
2. Check Firebase security rules allow write access
3. Verify internet connection
4. Check browser console for errors

### Issue: "Game not syncing"

**Solution**:
1. All players must be on same group
2. Check internet connection for all players
3. Refresh page if stuck
4. Ensure Firebase database is accessible

---

## 🔒 Security Considerations

### Development vs Production

**Current Setup (Development)**:
- Open read/write access
- No authentication required
- Suitable for testing

**Production Recommendations**:
1. **Enable Firebase Authentication**
   ```json
   {
     "rules": {
       "groups": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```

2. **Add User Authentication**
   - Email/Password
   - Google Sign-In
   - Anonymous Auth

3. **Implement Proper Rules**
   - Users can only modify their own data
   - Validate data structure
   - Rate limiting

4. **Environment Variables**
   - Don't commit API keys to public repos
   - Use environment variables
   - Add `.env` to `.gitignore`

---

## 📊 Firebase Usage Limits (Free Tier)

### Realtime Database
- **Storage**: 1 GB
- **Downloads**: 10 GB/month
- **Connections**: 100 simultaneous

### Typical Usage
- **Per game session**: ~1 MB
- **Per chat message**: ~500 bytes
- **Estimated capacity**: 1000+ games/month

### If You Exceed Limits
1. Upgrade to Blaze plan (pay-as-you-go)
2. Implement data cleanup
3. Archive old games
4. Optimize data structure

---

## 🎯 Advanced Features

### Custom Domain

1. **Get Domain** (optional)
   - Buy from Namecheap, GoDaddy, etc.
   - Or use free subdomain

2. **Configure GitHub Pages**
   - Repository Settings → Pages
   - Custom domain: `yourdomain.com`
   - Wait for DNS propagation

3. **Update Firebase**
   - Add domain to authorized domains
   - Update CORS settings if needed

### Analytics

1. **Enable Google Analytics** (optional)
   - Firebase Console → Analytics
   - Track player behavior
   - Monitor game sessions

2. **Custom Events**
   - Track game completions
   - Monitor chat usage
   - Analyze player retention

---

## 📱 Mobile Optimization

### PWA (Progressive Web App)

Add `manifest.json`:
```json
{
  "name": "Solo Leveling Game",
  "short_name": "SL Game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0e27",
  "theme_color": "#00d4ff",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add to `index.html`:
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#00d4ff">
```

---

## 🧪 Testing Multiplayer

### Local Testing

1. **Start Local Server**
   ```bash
   python -m http.server 8000
   ```

2. **Open Multiple Browsers**
   - Chrome: Normal window
   - Chrome: Incognito window
   - Firefox: Normal window
   - Edge: Normal window

3. **Test Flow**
   - Login with different usernames in each
   - Create group in one browser
   - Join group from other browsers
   - Test chat functionality
   - Start game and test sync

### Online Testing

1. **Deploy to GitHub Pages**
2. **Share URL with friends**
3. **Test from different devices**
   - Desktop
   - Mobile
   - Tablet

---

## 📝 Data Structure

### Firebase Database Structure

```
groups/
  ├── ABCD12/
  │   ├── code: "ABCD12"
  │   ├── name: "My Game Room"
  │   ├── creator: "player1"
  │   ├── status: "waiting"
  │   ├── createdAt: 1699123456789
  │   ├── players/
  │   │   ├── player1/
  │   │   │   ├── name: "John"
  │   │   │   ├── username: "player1"
  │   │   │   ├── isCreator: true
  │   │   │   └── selectedClass: "8"
  │   │   └── player2/
  │   │       ├── name: "Jane"
  │   │       ├── username: "player2"
  │   │       └── selectedClass: "9"
  │   ├── chat/
  │   │   ├── msg1/
  │   │   │   ├── username: "player1"
  │   │   │   ├── message: "Hello!"
  │   │   │   └── timestamp: 1699123456789
  │   │   └── msg2/
  │   │       ├── username: "player2"
  │   │       ├── message: "Hi there!"
  │   │       └── timestamp: 1699123456790
  │   └── gameState/
  │       ├── currentPlayerIndex: 0
  │       ├── round: 1
  │       └── players: [...]
  └── XYZ789/
      └── ...
```

---

## 🎓 Best Practices

### For Players
1. Use unique usernames
2. Don't share group codes publicly
3. Be respectful in chat
4. Don't spam messages
5. Leave group if not playing

### For Developers
1. Implement rate limiting
2. Validate all inputs
3. Sanitize chat messages
4. Clean up old groups
5. Monitor Firebase usage
6. Implement error handling
7. Add loading states
8. Test on multiple devices

---

## 🆘 Support

### Getting Help

1. **Check Browser Console** (F12)
   - Look for error messages
   - Check network tab

2. **Firebase Console**
   - Check Realtime Database data
   - View usage statistics
   - Check security rules

3. **Common Issues**
   - CORS errors → Check authorized domains
   - Permission denied → Check security rules
   - Not syncing → Check internet connection
   - Can't join → Check group exists

---

## 🎉 Success Checklist

Before going live:
- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] Config updated in multiplayer.js
- [ ] Security rules published
- [ ] Deployed to GitHub Pages
- [ ] Tested with multiple users
- [ ] Chat working properly
- [ ] Game sync working
- [ ] Mobile responsive
- [ ] No console errors

---

## 📞 Quick Reference

### Firebase Console
https://console.firebase.google.com/

### GitHub Pages
https://pages.github.com/

### Your Game URL
https://YOUR_USERNAME.github.io/solo-leveling-game/

### Firebase Database URL
https://YOUR_PROJECT.firebaseio.com/

---

**Ready to play online! ARISE!** 👑

For more help, check the main README.md or open an issue on GitHub.
