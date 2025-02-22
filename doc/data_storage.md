# ValoSketch - Data Storage Specifications

## 1. Overview
This document details how game-related data should be stored in Firebase for ValoSketch, including chat persistence, game state, and round-specific data.

---

## 2. What Needs to Be Stored?

### ✅ Lobby Information
- `lobby_id`: Unique identifier for the lobby.
- `lobby_code`: Code used for players to join the lobby.
- `host_id`: The player who created the lobby.
- `created_at`: Timestamp of lobby creation.
- `game_settings`:
  - Selected categories (Agents, Maps, Abilities, etc.)
  - Max players allowed
  - Round duration
  - Other configurable settings
- `players`: List of players currently in the lobby.

### ✅ Chat Messages (Stored Only While Lobby Exists)
- Messages are stored **only for the duration of the lobby** and are deleted when the lobby is removed.
- Messages should be stored **in order** with timestamps.
- Message format:
  - `user`: The sender's name or ID.
  - `text`: The message content.
  - `timestamp`: Time the message was sent.

### ✅ Game State & Rounds
- `current_round`: The current active round number.
- `drawer_id`: ID of the player currently drawing.
- `selected_image`: URL reference to the randomly assigned Valorant-related image.
- `round_start_time`: Timestamp when the round began.
- `guesses`: List of player guesses for the current round.
- `scores`: Tracks player scores across rounds.
- `prompt_keyword`: The unique keyword that serves as the correct answer for the drawer's image.

### ✅ Player Actions & Guessing System
- **Winning Condition:** A player wins the guessing phase if they correctly guess the **exact** keyword linked to the image before time runs out.
- **Tracking Correct Guesses:**
  - `player_id`: The player who made the guess.
  - `guess`: The word they submitted.
  - `correct`: Boolean value indicating whether the guess was correct.
  - `timestamp`: The time the guess was submitted.
- **Spam Prevention:** Players spamming incorrect guesses can be flagged or muted.

### ✅ Canvas Data (Optional)
- If players need to reconnect and see ongoing drawings, periodic snapshots of the **canvas state** can be stored.

---

## 3. Firebase Structure Example
```json
{
  "lobbies": {
    "D04ACD": {
      "lobby_id": "D04ACD",
      "host_id": "player123",
      "game_settings": {
        "max_players": 12,
        "round_time": 90,
        "categories": ["Agents", "Maps"]
      },
      "players": {
        "player123": { "name": "Riftrogue", "score": 10 },
        "player456": { "name": "SkyHawk", "score": 5 }
      },
      "chat": {
        "msg_1": { "user": "SkyHawk", "text": "Nice drawing!", "timestamp": 1708456123 },
        "msg_2": { "user": "Riftrogue", "text": "It's Jett!", "timestamp": 1708456130 }
      },
      "current_round": {
        "drawer_id": "player123",
        "selected_image": "https://firebasestorage.com/valorant/jett.png",
        "prompt_keyword": "Jett",
        "round_start_time": 1708456100,
        "guesses": {
          "player456": { "guess": "Jett", "correct": true, "timestamp": 1708456135 }
        }
      }
    }
  }
}
```

---

## 4. Automatic Cleanup & Persistence Rules
- **Chat messages should be removed when the lobby is deleted.**
- **Game state should persist until all rounds are completed or the lobby is closed.**
- **Guesses should be stored only for the current round and cleared at the start of a new round.**
- **Scores should persist until the game ends and a winner is determined.**

---

## Conclusion
This storage strategy ensures that ValoSketch maintains real-time synchronization, proper game tracking, and efficient cleanup of unnecessary data after each game session. Let me know if any refinements are needed!

