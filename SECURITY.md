# Quinta - Security Architecture

## Overview

Quinta uses Firebase Realtime Database for multiplayer synchronization. This document describes the security model and known limitations.

## Database Structure

```
rooms/
  {roomCode}/
    roomId: string
    status: 'waiting' | 'playing' | 'finished'
    settings: GameSettings
    board: BoardCell[][]
    players: Player[] (without hands)
    currentPlayerIndex: number
    deck: Card[]
    discardPile: Card[]
    winner: PlayerId | null
    createdAt: number

    privateHands/
      {playerId}/
        hand: Card[]

    presence/
      {playerId}/
        online: boolean
        lastSeen: number
```

## Security Rules

### Hand Privacy
Player hands are stored in `privateHands/{playerId}/` with rules that only allow the owning player to read their hand. This prevents players from seeing each other's cards through the Firebase console or network inspection.

### Presence
Each player can only write to their own presence node (`presence/{playerId}`). This prevents spoofing other players' online status.

### Room Access
Currently all rooms are publicly readable to allow joining via room code. The room code acts as a "password" - it's difficult to guess a valid 6-character code.

## Known Limitations

### 1. Deck Visibility (Medium Risk)
**Issue:** The deck is stored in the main room data and is readable by all players.

**Impact:** A technically savvy player could see what cards are coming next.

**Mitigation:** For a game played with trusted friends/family, this is acceptable. For a public game, the deck should be managed server-side.

**Future Fix:** Implement Firebase Cloud Functions to handle card draws server-side.

### 2. Client-Side Turn Execution (Medium Risk)
**Issue:** Turn logic runs on the client and writes directly to Firebase.

**Impact:** A player could theoretically craft an invalid move and write it directly.

**Mitigation:** The game logic validates moves before execution. Other players' clients would detect inconsistencies.

**Future Fix:** Move turn execution to Cloud Functions for server-side validation.

### 3. No Authentication (Low Risk)
**Issue:** Players are identified by session-generated IDs, not authenticated accounts.

**Impact:** A player could potentially impersonate another by obtaining their session ID.

**Mitigation:** Session IDs are randomly generated and stored in sessionStorage (not shared). Room codes provide access control.

**Future Fix:** Add optional Firebase Authentication for persistent accounts.

## Deployment Instructions

### 1. Deploy Security Rules

**Option A: Firebase CLI** (recommended)
```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login and select project
firebase login
firebase use --add  # Select your project

# Deploy rules (uses firebase.json config)
firebase deploy --only database
```

**Option B: Firebase Console** (manual)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Realtime Database → Rules
3. Copy contents of `database.rules.json`
4. Click "Publish"

### 2. Test Rules

After deploying:
1. Create a test game
2. Open browser dev tools → Network tab
3. Verify you can only read your own hand from `privateHands`
4. Verify presence writes are restricted

## Security Checklist

- [x] Hand privacy via separate storage path
- [x] Presence write restrictions
- [x] Basic data validation rules
- [ ] Server-side turn validation (requires Cloud Functions)
- [ ] Server-side deck management (requires Cloud Functions)
- [ ] Rate limiting (requires Cloud Functions)
- [ ] Room expiration enforcement (currently client-side cleanup)

## Recommendations for Production

For a production game with untrusted players:

1. **Add Cloud Functions** for:
   - Turn execution and validation
   - Card draws from deck
   - Room cleanup

2. **Add Authentication** for:
   - Persistent player identity
   - Stricter access control
   - Ban/report functionality

3. **Add Rate Limiting** for:
   - Room creation
   - Join attempts
   - Turn submissions

For a family/friends game, the current security model is sufficient.
