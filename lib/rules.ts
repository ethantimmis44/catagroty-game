export const DEFAULT_BUDGET = 100;
export const MIN_BUDGET = 20;
export const MAX_BUDGET = 100;
/** Authoritative seconds each eligible bidder has to bid or pass. */
export const AUCTION_TURN_SECONDS = 15;
export const TURN_SECONDS = AUCTION_TURN_SECONDS;
export const MIN_BID = 1;

export const MULTIPLAYER_COUNTS = [3, 4, 5, 6] as const;

export function listSizeForPlayerCount(playerCount: number) {
  if (playerCount <= 2) {
    return 5;
  }

  if (playerCount <= 4) {
    return 4;
  }

  return 3;
}

export function requiredItemsForPlayerCount(playerCount: number) {
  return playerCount * listSizeForPlayerCount(playerCount);
}

/**
 * Smallest item pool a host may start a game with: every player must be able to
 * fill their whole list. Hosts may select more than this for variety.
 */
export function minimumPoolSize(playerCount: number) {
  return requiredItemsForPlayerCount(playerCount);
}

export function clampBudget(value: number) {
  const amount = Math.round(value);
  return Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, amount));
}

export function minimumPlayersFor(mode: string) {
  return mode === "1v1" ? 2 : 3;
}

export function playerCountForMode(mode: string, multiplayerCount: number) {
  return mode === "1v1" ? 2 : multiplayerCount;
}

export function validateBidAmount(input: {
  amount: number;
  currentBid: number;
  remainingBudget: number;
}) {
  if (!Number.isInteger(input.amount)) {
    return "Bid must be a whole number.";
  }

  if (input.amount <= input.currentBid) {
    return `Bid must be higher than £${input.currentBid}.`;
  }

  if (input.amount < MIN_BID) {
    return "Bid must be a whole positive number.";
  }

  if (input.amount > MAX_BUDGET) {
    return `Bids cannot exceed £${MAX_BUDGET}.`;
  }

  if (input.amount > input.remainingBudget) {
    return `You only have £${input.remainingBudget} remaining.`;
  }

  return null;
}
