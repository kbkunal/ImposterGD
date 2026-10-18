export type PlayerRole = 'NORMAL' | 'IMPOSTER';

export type GamePhase =
  | 'WAITING_ROOM'
  | 'DEALING_CARDS'
  | 'CARD_REVEAL'
  | 'CLUE_ROUND'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_REVEAL'
  | 'IMPOSTER_GUESS'
  | 'ROUND_RESULTS'
  | 'MATCH_RESULTS';

export type HintMode = 'RELATED_WORD' | 'CATEGORY_ONLY' | 'NO_HINT';
export type WordDifficulty = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  avatar_id: string; // e.g. 'detective', 'astronaut', 'ninja', 'robot', 'fox', 'alien', 'cat', 'wizard'
  avatar_background: string; // hex color or gradient name
  status_message?: string;
  total_matches: number;
  wins: number;
  losses: number;
  imposter_wins: number;
  total_points: number;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
}

export interface WordBankEntry {
  id: string;
  word: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  hints: string[];
  language: string;
  tags: string[];
}

export interface RoomSettings {
  min_players: number; // default 3
  max_players: number; // default 10
  imposter_count: number; // default 1
  category: string; // 'All' or specific category
  difficulty: WordDifficulty;
  hint_mode: HintMode;
  clue_rounds: number; // default 1
  clue_timer_seconds: number; // e.g. 30
  discussion_timer_seconds: number; // e.g. 60
  voting_timer_seconds: number; // e.g. 45
  allow_last_chance_guess: boolean; // default true
  allow_text_clues: boolean; // default true
  is_public: boolean;
}

export interface RoomPlayer {
  user_id: string;
  seat_index: number;
  ready: boolean;
  connected: boolean;
  is_host: boolean;
  profile: UserProfile;
  clue_submitted?: string;
  has_voted?: boolean;
  card_viewed?: boolean;
}

export interface Room {
  id: string;
  room_code: string;
  host_id: string;
  name: string;
  is_public: boolean;
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  settings: RoomSettings;
  created_at: string;
  expires_at?: string;
}

export interface PrivatePlayerRole {
  round_id: string;
  user_id: string;
  role: PlayerRole;
  secret_word?: string; // Only present if role === 'NORMAL' or revealed at end
  private_hint?: string; // Only present if role === 'IMPOSTER' (or null if NO_HINT)
  category: string;
  card_viewed: boolean;
}

export interface GameRound {
  id: string;
  match_id: string;
  round_number: number;
  phase: GamePhase;
  phase_started_at: number; // epoch ms
  phase_deadline: number; // epoch ms
  active_speaker_id?: string;
  speaker_order: string[]; // array of user_ids in order
  current_speaker_index: number;
  current_clue_round: number;
  total_clue_rounds: number;
  secret_word_id?: string;
  secret_word?: string; // Publicly populated ONLY after VOTE_REVEAL / ROUND_RESULTS
  category: string;
  revealed_hint?: string;
  winner?: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED';
  imposter_user_ids: string[]; // Revealed ONLY after voting concludes
  votes: Record<string, string>; // voter_id -> target_id (only published after VOTING phase)
  vote_submissions: string[]; // list of user_ids that submitted votes (public during VOTING)
  most_voted_id?: string | null;
  is_tie?: boolean;
  last_chance_guess?: string;
  last_chance_correct?: boolean;
  points_awarded: Record<string, number>; // user_id -> points earned this round
}

export interface Match {
  id: string;
  room_id: string;
  status: 'ACTIVE' | 'COMPLETED';
  current_round: number;
  total_rounds: number;
  scores: Record<string, number>; // user_id -> total match points
  started_at: string;
  ended_at?: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend: UserProfile;
  status: 'ACCEPTED' | 'PENDING_OUTGOING' | 'PENDING_INCOMING';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor: UserProfile;
  type: 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'GAME_INVITE' | 'MATCH_ALERT';
  payload?: {
    room_code?: string;
    room_name?: string;
    message?: string;
  };
  read: boolean;
  created_at: string;
}

export interface ClueEntry {
  user_id: string;
  username: string;
  avatar_id: string;
  avatar_background: string;
  clue: string;
  round_number: number;
  timestamp: number;
}
