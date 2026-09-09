import assert from "node:assert/strict";
import { getAuction, passTurn, placeBid, resolveExpiredTurn } from "../lib/auction";
import { getCategories, loadCatalogItemsForCategory } from "../lib/catalog";
import { poolItemIds } from "../lib/gameItems";
import { createGame, joinGame, startGame } from "../lib/games";
import { minimumPoolSize } from "../lib/rules";
import { supabase } from "../lib/supabase";
import { pickPool } from "./testPool";

async function expectRejection(
  run: () => Promise<unknown>,
  match: RegExp,
  label: string,
) {
  let message = "";
  try {
    await run();
  } catch (err) {
    message = err instanceof Error ? err.message : String(err);
  }
  assert.ok(message, `${label}: expected a rejection but the call succeeded.`);
  assert.match(message, match, label);
  return message;
}

async function main() {
  const categories = await getCategories();
  const category = categories.find((entry) => entry.slug === "animals") ?? categories[0];
  assert.ok(category, "No categories available.");

  // ---------------------------------------------------------------
  // 1. Pool validation at creation time
  // ---------------------------------------------------------------
  const tooFew = await pickPool(category.id, 2).then((ids) => ids.slice(0, 4));
  await expectRejection(
    () =>
      createGame({
        mode: "1v1",
        maxPlayers: 2,
        budget: 50,
        hostName: "Alex",
        categoryId: category.id,
        challenge: "pool too small",
        itemIds: tooFew,
      }),
    /Select \d+ more item/i,
    "A pool below the minimum must be rejected",
  );

  const otherCategory = categories.find((entry) => entry.id !== category.id);
  assert.ok(otherCategory, "Need a second category for the cross-category test.");
  const foreignItems = await loadCatalogItemsForCategory(otherCategory.id);
  assert.ok(foreignItems.length > 0, "Second category has no items.");
  const mixedPool = [
    ...(await pickPool(category.id, 2)).slice(0, minimumPoolSize(2) - 1),
    foreignItems[0].id,
  ];
  await expectRejection(
    () =>
      createGame({
        mode: "1v1",
        maxPlayers: 2,
        budget: 50,
        hostName: "Alex",
        categoryId: category.id,
        challenge: "mixed category pool",
        itemIds: mixedPool,
      }),
    /must belong to/i,
    "A pool containing another category's item must be rejected",
  );

  console.log("Pool validation: minimum size and category membership enforced.");

  // ---------------------------------------------------------------
  // 2. Opening bid rule in a 1v1 game
  // ---------------------------------------------------------------
  const pool = await pickPool(category.id, 2, 4);
  const created = await createGame({
    mode: "1v1",
    maxPlayers: 2,
    budget: 60,
    hostName: "Alex",
    categoryId: category.id,
    challenge: "opening bid verification",
    itemIds: pool,
  });
  const joined = await joinGame({
    roomCode: created.game.room_code,
    playerName: "Sam",
  });
  await startGame({
    roomCode: created.game.room_code,
    playerId: created.player.id,
  });

  const roomCode = created.game.room_code;
  const alex = created.player;
  const sam = joined.player;

  const storedPool = await poolItemIds(created.game.id);
  assert.equal(
    storedPool.length,
    pool.length,
    "The chosen pool should be stored against the game.",
  );

  let auction = await getAuction(roomCode);
  assert.ok(auction, "Auction did not start.");
  assert.equal(auction.phase, "opening", "A fresh lot must be in the opening phase.");
  assert.equal(auction.game.current_bidder_id, alex.id, "Alex should open.");
  assert.equal(auction.game.current_bid ?? 0, 0);

  const poolSet = new Set(storedPool);
  assert.ok(
    auction.game.current_item_id && poolSet.has(auction.game.current_item_id),
    "The first lot must come from the stored pool.",
  );

  await expectRejection(
    () => passTurn({ roomCode, playerId: alex.id }),
    /opening bid cannot be passed/i,
    "The opening bidder must not be able to pass",
  );

  await expectRejection(
    () => placeBid({ roomCode, playerId: alex.id, amount: 0 }),
    /higher than|whole number|£0/i,
    "The opening bid must be at least £1",
  );

  await placeBid({ roomCode, playerId: alex.id, amount: 1 });
  auction = await getAuction(roomCode);
  assert.ok(auction);
  assert.equal(auction.phase, "active", "After the opening bid the lot is active.");
  assert.equal(auction.game.current_bid, 1);
  assert.equal(auction.game.current_bid_player_id, alex.id);
  assert.equal(auction.game.current_bidder_id, sam.id, "Sam bids or passes next.");

  console.log("Opening bid: pass blocked, £1 minimum accepted, turn advanced.");

  // Sam may now pass, which sells the lot to Alex.
  await passTurn({ roomCode, playerId: sam.id });
  auction = await getAuction(roomCode);
  assert.ok(auction);
  const won = auction.collections.find((entry) => entry.player_id === alex.id);
  assert.ok(won, "Alex should have won the opened lot.");
  assert.equal(won.price_paid ?? won.price, 1);
  assert.equal(auction.phase, "opening", "The next lot starts in the opening phase.");
  assert.ok(
    auction.game.current_item_id && poolSet.has(auction.game.current_item_id),
    "Every lot must come from the stored pool.",
  );

  console.log("Second bidder can pass, lot sold, next lot opened from the pool.");

  // ---------------------------------------------------------------
  // 3. Timing out the opening bid places the £1 bid rather than passing
  // ---------------------------------------------------------------
  const openingBidder = auction.game.current_bidder_id;
  assert.ok(openingBidder, "There should be an opening bidder.");
  const lotId = auction.game.current_item_id;

  const { error: backdateError } = await supabase
    .from("games")
    .update({ bid_deadline: new Date(Date.now() - 2000).toISOString() })
    .eq("id", created.game.id);
  assert.ok(!backdateError, backdateError?.message ?? "Could not backdate deadline.");

  await resolveExpiredTurn(roomCode);
  auction = await getAuction(roomCode);
  assert.ok(auction);

  const stillSameLot = auction.game.current_item_id === lotId;
  if (stillSameLot) {
    assert.equal(
      auction.game.current_bid,
      1,
      "A timed-out opening turn should place the £1 opening bid.",
    );
    assert.equal(auction.game.current_bid_player_id, openingBidder);
    assert.ok(
      !auction.passedIds.includes(openingBidder),
      "The opening bidder must not be recorded as passed.",
    );
  } else {
    const awarded = auction.collections.find((entry) => entry.item_id === lotId);
    assert.ok(
      awarded,
      "A timed-out opening bid should open the lot, not skip it unsold.",
    );
    assert.equal(awarded.player_id, openingBidder);
    assert.equal(awarded.price_paid ?? awarded.price, 1);
  }

  console.log("Timed-out opening turn placed the £1 opening bid.");

  // ---------------------------------------------------------------
  // 4. Three players: outbid players get another turn, passers stay out
  // ---------------------------------------------------------------
  const trio = await createGame({
    mode: "multiplayer",
    maxPlayers: 3,
    budget: 40,
    hostName: "Alex",
    categoryId: category.id,
    challenge: "three player opening bid",
    itemIds: await pickPool(category.id, 3, 6),
  });
  const samTrio = await joinGame({
    roomCode: trio.game.room_code,
    playerName: "Sam",
  });
  const joshTrio = await joinGame({
    roomCode: trio.game.room_code,
    playerName: "Josh",
  });
  await startGame({ roomCode: trio.game.room_code, playerId: trio.player.id });

  const room3 = trio.game.room_code;
  let auction3 = await getAuction(room3);
  assert.ok(auction3);
  assert.equal(auction3.phase, "opening");

  await expectRejection(
    () => passTurn({ roomCode: room3, playerId: trio.player.id }),
    /opening bid cannot be passed/i,
    "The first of three players must not be able to pass",
  );

  await placeBid({ roomCode: room3, playerId: trio.player.id, amount: 1 });
  auction3 = await getAuction(room3);
  assert.equal(auction3?.game.current_bidder_id, samTrio.player.id);

  await placeBid({ roomCode: room3, playerId: samTrio.player.id, amount: 2 });
  auction3 = await getAuction(room3);
  assert.equal(auction3?.game.current_bidder_id, joshTrio.player.id);

  await placeBid({ roomCode: room3, playerId: joshTrio.player.id, amount: 3 });
  auction3 = await getAuction(room3);
  assert.equal(
    auction3?.game.current_bidder_id,
    trio.player.id,
    "An outbid player gets another turn.",
  );

  // Alex is no longer the opening bidder, so passing is allowed now.
  await passTurn({ roomCode: room3, playerId: trio.player.id });
  auction3 = await getAuction(room3);
  assert.ok(auction3);
  assert.ok(
    auction3.passedIds.includes(trio.player.id) ||
      auction3.collections.some((entry) => entry.player_id === joshTrio.player.id),
    "Alex should be recorded as passed, or the lot resolved.",
  );

  await expectRejection(
    () => passTurn({ roomCode: room3, playerId: trio.player.id }),
    /already passed|not your turn|opening bid/i,
    "A player who passed stays out of that item's auction",
  );

  console.log("Three-player rotation: outbid players return, passers stay out.");

  // Every lot in this game must have come from the stored pool.
  const trioPool = new Set(await poolItemIds(trio.game.id));
  const { data: bidRows } = await supabase
    .from("bids")
    .select("item_id")
    .eq("game_id", trio.game.id);
  for (const row of (bidRows ?? []) as { item_id: string | null }[]) {
    if (row.item_id) {
      assert.ok(
        trioPool.has(row.item_id),
        `Item ${row.item_id} was auctioned but is not in the game's pool.`,
      );
    }
  }

  console.log("Every auctioned item came from the host's pool.");
  console.log("\nOpening bid and item pool tests passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
