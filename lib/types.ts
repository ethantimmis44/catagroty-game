export type GameMode = "1v1" | "multiplayer";

export type GameStatus = "waiting" | "active" | "finished";

export type AuctionStatus = "live" | "complete" | "failed";

export type Game = {
  id: string;
  created_at: string;
  room_code: string;
  status: string;
  mode: string;
  max_players: number;
  budget: number;
  category_id: string | null;
  challenge: string | null;
  list_size: number | null;
  current_item_id: string | null;
  current_bidder_id: string | null;
  current_bid_player_id: string | null;
  starting_bidder_index: number;
  auction_round: number;
  auction_status: string | null;
  current_bid: number | null;
  bid_deadline: string | null;
  bid_turn_started_at: string | null;
  completed_at: string | null;
};

export type Bid = {
  id: string;
  created_at: string;
  game_id: string;
  player_id: string;
  item_id: string | null;
  amount: number;
  auction_round: number | null;
  is_pass: boolean;
};

export type Collection = {
  id: string;
  created_at: string;
  game_id: string;
  player_id: string;
  item_id: string;
  price: number | null;
  price_paid: number | null;
  auction_round: number | null;
};

export type GamePlayer = {
  id: string;
  game_id: string;
  player_name: string;
  budget_remaining: number;
  joined_at: string;
};

export type LobbyData = {
  game: Game;
  players: GamePlayer[];
};

export const GAME_STATUS = {
  waiting: "waiting",
  active: "active",
  finished: "finished",
} as const;

export function isGameFinished(game: {
  status: string;
  auction_status?: string | null;
}) {
  return (
    game.status === GAME_STATUS.finished ||
    game.status === "complete" ||
    game.auction_status === "complete"
  );
}
