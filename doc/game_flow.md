# ValoSketch Game Flow

## Lobby System

### Public Lobbies (Future Implementation)
- Players can join existing public lobbies
- Lobbies have player number limits
- Automatically managed by the game system

### Private Lobbies
- Created by a host player
- Generates unique party code for sharing
- Friends can join using the party code

#### Host Configuration Options
- Gameplay elements selection:
  * Agents only
  * Agents + Weapons
  * Weapons only
  * Custom combinations
- Timer settings:
  * Drawing time duration
  * Initial waiting period before guessing
- Round configuration:
  * Number of rounds
  * Turns per round

## Game Flow

### Turn Order
- Based on FIFO (First In, First Out) joining order
- Example: If A, B, C join in that order, turns follow same sequence
- Late-joining players are added to end of turn order
- Players can join mid-game

### Turn Structure
1. Active player receives random image based on configuration
2. Drawing timer starts (configurable duration)
3. Other players must wait (configurable duration) before guessing
4. Guessing phase:
   - Players submit guesses in chat
   - Correct guesses:
     * Player receives notification
     * Points awarded based on speed
     * Player is locked out from further guessing
   - Wrong guesses:
     * Player notified
     * Can continue guessing until timer ends
5. Timer expiration:
   - Image revealed
   - Correct answer displayed
   - Turn ends

### Scoring System
- Points awarded based on guessing speed
- Only first correct guess per player counts
- No points for incorrect guesses

### Round Structure
- Configurable number of rounds
- Each round consists of configurable number of turn cycles
- Example: 2 rounds × 3 turns = 6 total turns per player

### Game End
- Occurs when all configured rounds are completed
- Final scores displayed
- Winner determined by total points