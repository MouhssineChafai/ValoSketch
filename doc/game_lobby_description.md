## 1. Game Lobby Layout
The game screen is divided into three sections:
- **Left Panel**: Player List & Game Info.
- **Center Panel**: Drawing Canvas & Timer.
- **Right Panel**: Chat & Guessing System.

### Left Panel - Player List & Game Info
- Displays all players in the lobby.
- Highlights the **current drawer**.
- Shows the host with a ⭐️ icon.
- Displays game settings:
  - Game mode (Custom mode only for now)
  - Guessing time
  - Max players
  - Enabled categories (Agents, Maps, Abilities, etc.)

### Center Panel - Drawing Canvas & Timer
- Large canvas for the drawer to draw on with a white background.
- Drawing tools:
  - Color selection
  - Brush size adjustment
  - Eraser tool
  - Trash button (clears canvas)
- Timer display (default: 90s per round).
- Word display (only visible to the drawer).

### Right Panel - Chat & Guessing System
- Live chat for players to communicate.
- Players type guesses into an input box.
- Messages are color-coded:
  - **Green**: Correct guess.
  - **White**: Regular chat.
  - **Red**: Muted/spam warning.

---

## 2. Image-Based Drawing System
### Image Selection Logic
- Instead of a word, the **drawer gets an image** to replicate.
- The image is randomly selected based on the **lobby’s enabled categories**:
  - **Agents** (Jett, Phoenix, etc.)
  - **Maps** (Ascent, Bind, etc.)
  - **Abilities** (Sova’s Recon Bolt, etc.)
  - **Guns** (Vandal, Operator, etc.)
  - **Skins** (Prime Vandal, etc.)

### Implementation Details
- Images are stored in **Firebase Storage** (or another backend solution).
- When a round starts:
  1. The system checks the **lobby’s selected categories**.
  2. It fetches a **random image** from the corresponding category.
  3. The image is displayed **only to the drawer**.
- A "View Image" button allows the drawer to reopen the reference image.

---

## 3. Game Flow
### Round Start
- System assigns a drawer.
- A **random image** is displayed to the drawer.

### Drawing Phase
- The drawer replicates the image using the drawing tools.
- Other players guess what the drawing represents.

### Guessing System
- Players type their guesses.
- If the guess matches the **image category**, the player scores points.
- If no one guesses correctly, the round ends after **90s**.

### End of Round & Scoring
- Correct guessers receive points.
- The next drawer is assigned.

### End of Game
- After **X rounds**, the player with the most points is declared the winner.

---

## 4. Technical Implementation Instructions
### Frontend
- **Angular Components:**
  - `<player-list-panel>`
  - `<drawing-board>`
  - `<chat-box>`
- **Canvas API for drawing**
  - Free-hand drawing
  - Brush size & color selection

### Backend & Real-Time Features
- **Firebase for:**
  - Player list & game state management
  - Storing & retrieving images
  - Real-time chat & guessing system
- **WebSockets for real-time updates**
- **Routing Implementation:**
  - `/lobby/<lobby_code>` → Loads the game lobby
  - Unrecognized routes → Redirect to `/`

---

## 5. Additional Features
### Lobby Settings (For Host)
- Guess time selection (60s, 90s, etc.)
- Enable/disable re-rolls
- Kick idle players
- Allow category selection

### Invite & Sharing
- **"Invite" button** to copy/share the game link.

### Leaderboard & Score Tracking
- Scores are displayed after each round.
- Final leaderboard is shown at game end.

---

