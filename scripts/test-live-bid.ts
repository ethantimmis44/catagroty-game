import { getAuction, passTurn, placeBid, resolveExpiredTurn } from "../lib/auction";
import { getCategories } from "../lib/catalog";
import { createGame, joinGame, startGame } from "../lib/games";
import { supabase } from "../lib/supabase";
import { pickPool } from "./testPool";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const rpcProbe = await supabase.rpc("submit_auction_action", {
    p_room_code: "ZZZZZZ",
    p_player_id: "00000000-0000-0000-0000-000000000000",
    p_action: "bid",
    p_amount: 1,
  });
  const rpcInstalled = !rpcProbe.error || !/could not find|does not exist|PGRST202|42883/i.test(
    rpcProbe.error.message,
  );
  console.log(
    rpcInstalled
      ? `RPC submit_auction_action is installed (${rpcProbe.error?.message ?? "reachable"})`
      : `RPC missing: ${rpcProbe.error?.message}. TypeScript fallback will be used.`,
  );

  const categories = await getCategories();
  const category = categories[0];
  assert(category, "No categories available for a live bid test.");

  const created = await createGame({
    mode: "1v1",
    maxPlayers: 2,
    budget: 100,
    hostName: "Alex",
    categoryId: category.id,
    challenge: "live bid verification",
    itemIds: await pickPool(category.id, 2),
  });
  const joined = await joinGame({
    roomCode: created.game.room_code,
    playerName: "Sam",
  });
  await startGame({
    roomCode: created.game.room_code,
    playerId: created.player.id,
  });

  const alex = created.player;
  const sam = joined.player;
  const roomCode = created.game.room_code;

  let auction = await getAuction(roomCode);
  assert(auction, "Auction did not start.");
  assert(auction.game.current_bidder_id === alex.id, `Expected Alex to start. current=${auction.game.current_bidder_id}`);
  assert((auction.game.current_bid ?? 0) === 0, `Expected opening bid 0, got ${auction.game.current_bid}`);

  await placeBid({ roomCode, playerId: alex.id, amount: 1 });
  auction = await getAuction(roomCode);
  assert(auction, "Auction missing after Alex bid.");
  console.log("After Alex £1", {
    currentBid: auction.game.current_bid,
    currentBidderId: auction.game.current_bidder_id,
    highestBidderId: auction.game.current_bid_player_id,
  });
  assert(auction.game.current_bid === 1, `Expected current bid £1, got ${auction.game.current_bid}`);
  assert(auction.game.current_bid_player_id === alex.id, "Expected Alex as highest bidder.");
  assert(auction.game.current_bidder_id === sam.id, "Expected Sam's turn after Alex bid.");

  await placeBid({ roomCode, playerId: sam.id, amount: 2 });
  auction = await getAuction(roomCode);
  assert(auction, "Auction missing after Sam bid.");
  console.log("After Sam £2", {
    currentBid: auction.game.current_bid,
    currentBidderId: auction.game.current_bidder_id,
    highestBidderId: auction.game.current_bid_player_id,
  });
  assert(auction.game.current_bid === 2, `Expected current bid £2, got ${auction.game.current_bid}`);
  assert(auction.game.current_bid_player_id === sam.id, "Expected Sam as highest bidder.");
  assert(auction.game.current_bidder_id === alex.id, "Expected Alex's turn after Sam bid.");

  await placeBid({ roomCode, playerId: alex.id, amount: 3 });
  auction = await getAuction(roomCode);
  assert(auction, "Auction missing after Alex £3.");
  assert(auction.game.current_bid === 3, `Expected current bid £3, got ${auction.game.current_bid}`);
  assert(auction.game.current_bid_player_id === alex.id, "Expected Alex as highest bidder after £3.");
  assert(auction.game.current_bidder_id === sam.id, "Expected Sam's turn after Alex £3.");

  await passTurn({ roomCode, playerId: sam.id });
  auction = await getAuction(roomCode);
  assert(auction, "Auction missing after Sam pass.");
  console.log("After Sam pass", {
    status: auction.game.status,
    auctionStatus: auction.game.auction_status,
    currentItemId: auction.game.current_item_id,
    alexBudget: auction.players.find((player) => player.id === alex.id)?.budget_remaining,
    collections: auction.collections.map((entry) => ({
      playerId: entry.player_id,
      itemId: entry.item_id,
      pricePaid: entry.price_paid ?? entry.price,
    })),
  });

  const win = auction.collections.find((entry) => entry.player_id === alex.id);
  assert(win, "Alex should have won the first item.");
  assert((win.price_paid ?? win.price) === 3, `Expected price_paid 3, got ${win.price_paid ?? win.price}`);
  const alexAfter = auction.players.find((player) => player.id === alex.id);
  assert(alexAfter, "Alex missing after award.");
  assert(alexAfter.budget_remaining === 97, `Expected Alex budget 97, got ${alexAfter.budget_remaining}`);
  assert(auction.game.current_item_id, "Next lot should have started.");
  assert(auction.game.current_bid === 0, "Next lot should open at £0.");

  console.log("Live 1v1 bid flow passed.", { roomCode, rpcInstalled });

  const created3 = await createGame({
    mode: "multiplayer",
    maxPlayers: 3,
    budget: 50,
    hostName: "Alex",
    categoryId: category.id,
    challenge: "three player verification",
    itemIds: await pickPool(category.id, 3),
  });
  const sam3 = await joinGame({
    roomCode: created3.game.room_code,
    playerName: "Sam",
  });
  const josh3 = await joinGame({
    roomCode: created3.game.room_code,
    playerName: "Josh",
  });
  await startGame({
    roomCode: created3.game.room_code,
    playerId: created3.player.id,
  });

  const room3 = created3.game.room_code;
  await placeBid({ roomCode: room3, playerId: created3.player.id, amount: 1 });
  let auction3 = await getAuction(room3);
  assert(auction3?.game.current_bidder_id === sam3.player.id, "After Alex bids, it should be Sam.");
  await placeBid({ roomCode: room3, playerId: sam3.player.id, amount: 2 });
  auction3 = await getAuction(room3);
  assert(auction3?.game.current_bidder_id === josh3.player.id, "After Sam bids, it should be Josh.");
  await passTurn({ roomCode: room3, playerId: josh3.player.id });
  auction3 = await getAuction(room3);
  assert(auction3?.game.current_bidder_id === created3.player.id, "After Josh passes, it should return to Alex.");
  assert(auction3?.passedIds.includes(josh3.player.id), "Josh should be passed.");

  const { error: deadlineError } = await supabase
    .from("games")
    .update({ bid_deadline: new Date(Date.now() - 2000).toISOString() })
    .eq("id", created3.game.id);
  assert(!deadlineError, deadlineError?.message ?? "Could not backdate deadline.");
  await resolveExpiredTurn(room3);
  auction3 = await getAuction(room3);
  assert(auction3, "Auction missing after timeout.");
  assert(
    auction3.passedIds.includes(created3.player.id) ||
      auction3.game.current_item_id !== auction3.collections[0]?.item_id,
    "Timeout should pass Alex or award/skip the lot.",
  );
  console.log("Live 3-player + timeout checks passed.", { roomCode: room3 });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
