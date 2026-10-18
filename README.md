# 🕵️‍♂️ WHO'S THE IMPOSTER?
### *Multiplayer Social Deduction Party Video Game for the Web*

A full-stack, real-time, responsive multiplayer browser party game inspired by social deduction classics. Players gather around an animated virtual round table where everyone receives the same secret word—except one randomly selected **Imposter**, who receives only an ambiguous one-word hint. Players take turns giving subtle clues, debate suspicions, cast secret votes, and deduce who is bluffing!

---

## 🌟 Core Features & Systems

1. **Virtual Round Table Centerpiece**:
   - Circular trigonometric layout distributing 3–10 players evenly without card collisions.
   - Host crown badge, speaking microphone aura with sound waves, secret voting confirmation indicators, and connection status.
   - Mobile-adaptive stadium layout ensuring complete legibility on phones, tablets, and widescreen displays.

2. **Server-Authoritative Game Loop**:
   - `WAITING_ROOM` ➔ `DEALING_CARDS` ➔ `CARD_REVEAL` ➔ `CLUE_ROUND` ➔ `DISCUSSION` ➔ `VOTING` ➔ `VOTE_REVEAL` ➔ `IMPOSTER_GUESS` ➔ `ROUND_RESULTS` ➔ `MATCH_RESULTS`.
   - Authoritative random Imposter selection and secret word distribution.
   - Strict privacy: a player's device can *never* query or read other players' secret words or hints before the official reveal phase.

3. **Curated Word Bank (310+ Words & Hints across 16 Categories)**:
   - *Food & Drinks, Animals, Movies & TV, Games, Technology, Sports, Countries & Cities, School & College, Everyday Objects, Nature, Professions, Travel, Music, Science, Fantasy, and Random Mix*.
   - Filterable by difficulty (`ALL`, `EASY`, `MEDIUM`, `HARD`) and hint mode (`RELATED_WORD`, `CATEGORY_ONLY`, `NO_HINT`).

4. **Dedicated 3D Card Reveal Experience**:
   - Smooth 3D card flip animation with custom sound triggers.
   - Normal player card displays the secret word and category; Imposter card reveals suspenseful crimson styling with their hint.
   - Authoritative "I've Seen My Card" acknowledgment.

5. **Secret Ballots & Authoritative Resolution**:
   - Players cast private votes for suspected players (cannot vote for themselves).
   - Vote count indicators update without revealing vote targets.
   - Tie handling: tied votes allow the Imposter to escape.
   - Optional Last-Chance Redemption: caught Imposters can submit a private final guess for the secret word (+2 pts).

6. **Procedural Web Audio API Sound Engine**:
   - Zero-latency procedural sound effects for button clicks, card deals, card flips, countdown ticks, vote submissions, dramatic role reveals, and victory/defeat fanfares.
   - Volume slider, mute toggle, and reduced-motion accessibility preference.

7. **Social & Friend System**:
   - Username search, pending friend requests, direct room invitations with instant one-click join, online presence indicators, and activity notifications.

8. **Expressive Avatars & Customization**:
   - 12 illustrated cartoon avatars (*Detective, Astronaut, Ninja, Robot, Sly Fox, Alien, Mystery Cat, Wizard, Pirate, Vampire, Cool Bear, Jester*).
   - 10 vibrant background colors.
   - Interactive HTML5 Canvas crop & zoom tool for custom photo uploads.

---

## 🚀 Tech Stack

- **Frontend**: React 18/19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Zustand, Canvas-Confetti.
- **Audio**: Web Audio API procedural sound synthesis.
- **Backend & Database**:
  - PostgreSQL database with Row Level Security (RLS) enabled on all 10 tables.
  - Supabase Authentication (username/password mapped to internal auth identity).
  - Supabase Realtime for room presence, broadcasts, and database sync.
  - Multi-tab fallback `BroadcastChannel` engine enabling immediate offline / local testing without requiring external credentials.
- **Testing**: Vitest with `@testing-library/react` and `@testing-library/jest-dom`.

---

## 📁 Project Structure

```
├── public/
│   └── favicon.svg                          # Game branding icon
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── CardRevealModal.tsx          # 3D Flipping Card Reveal
│   │   │   ├── CharacterCard.tsx            # Round Table Player Card
│   │   │   ├── CluePhaseTracker.tsx         # Active Speaker & Clue Log
│   │   │   ├── DiscussionTimer.tsx          # Group Discussion Countdown
│   │   │   ├── ImposterGuessModal.tsx       # Last-Chance Word Guess
│   │   │   ├── RoundResultsModal.tsx        # Scoring & Debrief Breakdown
│   │   │   ├── VirtualRoundTable.tsx        # THE Round Table Component
│   │   │   └── VotingPanel.tsx              # Secret Ballot Interface
│   │   ├── layout/
│   │   │   └── Navbar.tsx                   # Header with profile & notifications
│   │   ├── profile/
│   │   │   └── AvatarSelectorModal.tsx      # Avatar Customizer & Image Crop
│   │   └── ui/
│   │       ├── Avatar.tsx                   # 12 Cartoon SVGs & Photo Fallback
│   │       ├── Badge.tsx                    # Status Badges
│   │       ├── Button.tsx                   # Glossy Sound-Enabled Buttons
│   │       ├── Input.tsx                    # Styled Inputs with Password Toggles
│   │       └── Modal.tsx                    # Accessible Animated Modals
│   ├── pages/
│   │   ├── CreateRoomPage.tsx               # Room Settings & Word Bank Filter
│   │   ├── DashboardPage.tsx                # Game Lobby, Public Browser & Stats
│   │   ├── FriendsPage.tsx                  # Friend Search & Room Invites
│   │   ├── GamePage.tsx                     # Main Playing Arena
│   │   ├── LandingPage.tsx                  # Home, Rules & Table Preview
│   │   ├── LoginPage.tsx                    # Username/Password + 1-Click Guest
│   │   ├── NotFoundPage.tsx                 # 404 Route
│   │   ├── ProfilePage.tsx                  # Player Stats & Profile
│   │   ├── SettingsPage.tsx                 # Sound & Accessibility
│   │   ├── SignUpPage.tsx                   # Registration Form
│   │   └── WaitingRoomPage.tsx              # Pre-Game Seating & Code Sharing
│   ├── services/
│   │   ├── auth/
│   │   │   └── authService.ts               # Username/Password Auth Mapping
│   │   ├── friends/
│   │   │   └── friendService.ts             # Social Management
│   │   ├── game/
│   │   │   ├── gameEngine.ts                # Authoritative Game Logic
│   │   │   ├── soundEngine.ts               # Procedural Web Audio FX
│   │   │   └── wordBank.ts                  # 310+ Curated Entries (16 Cats)
│   │   ├── rooms/
│   │   │   └── roomService.ts               # 6-Char Code Gen & Presence Sync
│   │   └── supabase/
│   │       └── client.ts                    # Supabase Client Initializer
│   ├── stores/
│   │   ├── useAuthStore.ts                  # User Auth State
│   │   ├── useGameStore.ts                  # Game State Machine
│   │   ├── useSettingsStore.ts              # Audio & Motion Settings
│   │   └── useSocialStore.ts                # Friends & Notifications
│   ├── test/
│   │   ├── auth.test.ts                     # Auth & Validation Tests
│   │   ├── gameEngine.test.ts               # Game Loop & Scoring Tests
│   │   ├── room.test.ts                     # Room & Migration Tests
│   │   ├── setup.ts                         # Testing Library Setup
│   │   └── wordBank.test.ts                 # Word & Hint Tests
│   ├── types/
│   │   └── game.ts                          # Comprehensive Typed Interfaces
│   ├── App.tsx                              # Router & Invite URL Handler
│   ├── index.css                            # Tailored Midnight Theme & 3D CSS
│   └── main.tsx                             # Application Entry Point
├── supabase/
│   ├── migrations/
│   │   └── 20261018000001_create_imposter_game_schema.sql  # Full Schema & RLS
│   └── seed.sql                             # SQL Word Bank Seed Script
├── .env.example                             # Environment Variables Template
└── package.json                             # Dependencies & Scripts
```

---

## 🛠️ Local Development & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm run test
```
*Executes all 20 tests verifying username validation, duplicate handling, word bank curation, imposter randomization, private role security, vote tallies, ties, last-chance redemption, and scoring idempotency.*

### 3. Start Local Dev Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

> **Zero-Config Multi-Tab Testing**: You can immediately test multiplayer game rooms by opening multiple tabs or browser windows. Use the **"Quick Test Guest Login (1-Click)"** button on the Login page to spin up separate player profiles (*Player 101, Player 202, Player 303*), host a room, copy the 6-letter room code, and join from another tab!

---

## 🗄️ Connecting to Supabase (Production Mode)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase Dashboard:
   - Run `supabase/migrations/20261018000001_create_imposter_game_schema.sql` to establish tables, RLS policies, and stored procedures.
   - Run `supabase/seed.sql` to populate the word bank.
3. Copy your project credentials:
   - `Project URL`
   - `anon public key`
4. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Build and deploy:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Threat Model

- **Role Confidentiality**: Roles and secret words are stored in `private_player_roles` with Row Level Security allowing only `auth.uid() = user_id`. Other players can *never* read another player's role over the network before the official reveal phase.
- **Vote Secrecy**: The `votes` table permits voters to insert their ballot, but selecting other players' targets is strictly blocked by RLS until the round phase reaches `VOTE_REVEAL`.
- **Authoritative Randomization**: Random selection of the Imposter and secret word is executed securely on the server/game engine, not by untrusted clients.
- **Idempotent Scoring**: Score updates are tracked per round ID to prevent duplicate point awards from retries or reconnects.
- **Host Migration**: If a host leaves, host permissions migrate safely to the next occupant in line, preventing orphaned rooms.
