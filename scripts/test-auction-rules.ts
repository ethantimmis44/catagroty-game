import assert from "node:assert/strict";
import {
  allListsFull,
  auctionPhase,
  decideLot,
  isOpeningPhase,
  nextBidAmount,
  nextBidder,
  nextStartingIndex,
  playerHasFullList,
} from "../lib/auctionEngine";
import {
  AUCTION_TURN_SECONDS,
  listSizeForPlayerCount,
  MAX_BUDGET,
  MIN_BUDGET,
  minimumPoolSize,
  requiredItemsForPlayerCount,
  validateBidAmount,
} from "../lib/rules";
import type { GamePlayer } from "../lib/types";

function player(
  id: string,
  name: string,
  joinedAt: string,
  budget = 50,
): GamePlayer {
  return {
    id,
    game_id: "g1",
    player_name: name,
    budget_remaining: budget,
    joined_at: joinedAt,
  };
}

const alex = player("a", "Alex", "2026-01-01T00:00:00.000Z");
const sam = player("b", "Sam", "2026-01-01T00:00:01.000Z");
const josh = player("c", "Josh", "2026-01-01T00:00:02.000Z");
const players = [alex, sam, josh];
const listSize = 4;

function turn(input: {
  current: string | null;
  highest: string | null;
  bid: number;
  passed: string[];
}) {
  return decideLot({
    players,
    collections: [],
    listSize,
    passedIds: new Set(input.passed),
    currentBidderId: input.current,
    highestBidderId: input.highest,
    currentBid: input.bid,
    startingIndex: 0,
  });
}

assert.equal(AUCTION_TURN_SECONDS, 15);
assert.equal(listSizeForPlayerCount(2), 5);
assert.equal(listSizeForPlayerCount(3), 4);
assert.equal(listSizeForPlayerCount(4), 4);
assert.equal(listSizeForPlayerCount(5), 3);
assert.equal(listSizeForPlayerCount(6), 3);
assert.equal(requiredItemsForPlayerCount(2), 10);
assert.equal(MIN_BUDGET, 20);
assert.equal(MAX_BUDGET, 100);
assert.equal(nextBidAmount(0), 1);
assert.equal(nextBidAmount(12), 13);

assert.match(
  validateBidAmount({ amount: 12, currentBid: 12, remainingBudget: 50 }) ?? "",
  /higher than £12/,
);
assert.match(
  validateBidAmount({ amount: 25, currentBid: 12, remainingBudget: 9 }) ?? "",
  /only have £9 remaining/,
);
assert.equal(
  validateBidAmount({ amount: 13, currentBid: 12, remainingBudget: 50 }),
  null,
);

// Opening turn: Alex starts, can bid £1.
let state = turn({ current: null, highest: null, bid: 0, passed: [] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "a");
assert.deepEqual(state.activeBidderIds, ["a", "b", "c"]);

// Alex bids £1 → Sam.
state = turn({ current: "a", highest: "a", bid: 1, passed: [] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "b");

// Sam bids £2 → Josh.
state = turn({ current: "b", highest: "b", bid: 2, passed: [] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "c");

// Josh bids £3 → Alex gets another turn (outbid, not eliminated).
state = turn({ current: "c", highest: "c", bid: 3, passed: [] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "a");

// Alex bids £4 → Sam.
state = turn({ current: "a", highest: "a", bid: 4, passed: [] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "b");

// Sam passes → Josh, Alex still active.
state = turn({ current: "b", highest: "a", bid: 4, passed: ["b"] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "c");
assert.deepEqual(state.activeBidderIds, ["a", "c"]);

// Josh bids £5 → Alex.
state = turn({ current: "c", highest: "c", bid: 5, passed: ["b"] });
assert.equal(state.outcome, "continue");
assert.equal(state.nextBidderId, "a");

// Alex passes → only Josh remains with the high bid → Josh wins at £5.
state = turn({ current: "a", highest: "c", bid: 5, passed: ["b", "a"] });
assert.equal(state.outcome, "sell");
assert.equal(state.winnerId, "c");
assert.equal(state.activeBidderIds.length, 1);

// Cannot afford current+1: remaining £4, current £4.
const broke = player("d", "Drew", "2026-01-01T00:00:03.000Z", 4);
const poorDecision = decideLot({
  players: [alex, broke],
  collections: [],
  listSize,
  passedIds: new Set(),
  currentBidderId: "a",
  highestBidderId: "a",
  currentBid: 4,
  startingIndex: 0,
});
assert.equal(poorDecision.outcome, "sell");
assert.equal(poorDecision.winnerId, "a");

assert.equal(
  playerHasFullList(
    "a",
    [{ player_id: "a" }, { player_id: "a" }, { player_id: "a" }, { player_id: "a" }],
    4,
  ),
  true,
);
assert.equal(
  allListsFull(players, [{ player_id: "a" }, { player_id: "a" }, { player_id: "a" }, { player_id: "a" }], 4),
  false,
);
assert.equal(
  nextStartingIndex(
    players,
    0,
    [{ player_id: "a" }, { player_id: "a" }, { player_id: "a" }, { player_id: "a" }],
    4,
  ),
  1,
);

assert.equal(
  nextBidder({
    players,
    startingIndex: 0,
    currentBidderId: "a",
    highestBidderId: "a",
    passedIds: new Set(),
    collections: [],
    listSize,
    currentBid: 1,
  })?.id,
  "b",
);

assert.equal(
  allListsFull(players, [{ player_id: "a" }, { player_id: "b" }], 1),
  false,
);
assert.equal(
  allListsFull(
    players,
    [
      { player_id: "a" },
      { player_id: "b" },
      { player_id: "c" },
    ],
    1,
  ),
  true,
);
assert.equal(
  allListsFull(
    [alex, sam],
    [
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "b" },
      { player_id: "b" },
      { player_id: "b" },
      { player_id: "b" },
    ],
    5,
  ),
  false,
);
assert.equal(
  allListsFull(
    [alex, sam],
    [
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "a" },
      { player_id: "b" },
      { player_id: "b" },
      { player_id: "b" },
      { player_id: "b" },
      { player_id: "b" },
    ],
    5,
  ),
  true,
);

// Opening phase: a lot stays "opening" until somebody holds the high bid.
assert.equal(auctionPhase({ current_bid_player_id: null, current_bid: 0 }), "opening");
assert.equal(auctionPhase({ current_bid_player_id: null, current_bid: null }), "opening");
assert.equal(isOpeningPhase({ current_bid_player_id: "a", current_bid: 1 }), false);
assert.equal(auctionPhase({ current_bid_player_id: "a", current_bid: 1 }), "active");
// A high bidder with no amount is not a real opening bid.
assert.equal(auctionPhase({ current_bid_player_id: "a", current_bid: 0 }), "opening");

// The minimum opening bid is £1, and £0 is never a legal bid.
assert.equal(nextBidAmount(0), 1);
assert.equal(nextBidAmount(null), 1);
assert.ok(validateBidAmount({ amount: 0, currentBid: 0, remainingBudget: 50 }));
assert.equal(
  validateBidAmount({ amount: 1, currentBid: 0, remainingBudget: 50 }),
  null,
);

// Minimum pool size scales with the player count.
assert.equal(minimumPoolSize(2), 10);
assert.equal(minimumPoolSize(3), 12);
assert.equal(minimumPoolSize(4), 16);
assert.equal(minimumPoolSize(5), 15);
assert.equal(minimumPoolSize(6), 18);

console.log("Auction rules tests passed.");
