import assert from "node:assert/strict";
import { getAuction, passTurn, placeBid } from "../lib/auction";
import { getCategories, loadItemsForCategory } from "../lib/catalog";
import { createGame, joinGame, startGame } from "../lib/games";
import { supabase } from "../lib/supabase";
import type { GamePlayer } from "../lib/types";
import { pickPool } from "./testPool";

async function seedCollections(input: {
  gameId: string;
  currentItemId: string | null;
  categoryId: string;
  players: { player: GamePlayer; count: number }[];
}) {
  const items = await loadItemsForCategory(input.categoryId);
  const used = new Set(input.currentItemId ? [input.currentItemId] : []);
  const rows: {
    game_id: string;
    player_id: string;
    item_id: string;
    price: number;
    price_paid: number;
    auction_round: number;
  }[] = [];

  for (const entry of input.players) {
    const unused = items.filter((item) => !used.has(item.id));
    if (unused.length < entry.count) {
      throw new Error("Not enough catalogue items to seed collections.");
    }
    for (let index = 0; index < entry.count; index += 1) {
      const item = unused[index];
      used.add(item.id);
      rows.push({
        game_id: input.gameId,
        player_id: entry.player.id,
        item_id: item.id,
        price: 1,
        price_paid: 1,
        auction_round: 0,
      });
    }
  }

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("collections").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

async function inspectStatusConstraint(gameId: string) {
  const { error: completeError } = await supabase
    .from("games")
    .update({ status: "complete" })
    .eq("id", gameId)
    .eq("status", "waiting");

  const { error: finishedError } = await supabase
    .from("games")
    .update({ status: "finished" })
    .eq("id", gameId);

  await supabase.from("games").update({ status: "waiting" }).eq("id", gameId);

  console.log("Constraint probe: status=complete", completeError?.message ?? "accepted");
  console.log("Constraint probe: status=finished", finishedError?.message ?? "accepted");
}

async function main() {
  const categories = await getCategories();
  const category = categories[0];
  assert.ok(category, "No categories available.");

  const probe = await createGame({
    mode: "1v1",
    maxPlayers: 2,
    budget: 50,
    hostName: "Probe",
    categoryId: category.id,
    challenge: "status constraint probe",
    itemIds: await pickPool(category.id, 2),
  });
  await inspectStatusConstraint(probe.game.id);

  const created = await createGame({
    mode: "1v1",
    maxPlayers: 2,
    budget: 80,
    hostName: "Alex",
    categoryId: category.id,
    challenge: "final item verification",
    itemIds: await pickPool(category.id, 2, 14),
  });
  const joined = await joinGame({
    roomCode: created.game.room_code,
    playerName: "Sam",
  });
  await startGame({
    roomCode: created.game.room_code,
    playerId: created.player.id,
  });

  let auction = await getAuction(created.game.room_code);
  assert.ok(auction, "Auction did not start.");
  assert.equal(auction.listSize, 5);

  const firstLotId = auction.game.current_item_id;
  await seedCollections({
    gameId: created.game.id,
    currentItemId: firstLotId,
    categoryId: category.id,
    players: [
      { player: created.player, count: 4 },
      { player: joined.player, count: 4 },
    ],
  });

  await placeBid({
    roomCode: created.game.room_code,
    playerId: created.player.id,
    amount: 1,
  });
  await passTurn({
    roomCode: created.game.room_code,
    playerId: joined.player.id,
  });

  auction = await getAuction(created.game.room_code);
  assert.ok(auction, "Auction missing after first final-item case.");
  const alexItems = auction.collections.filter((entry) => entry.player_id === created.player.id);
  const samItems = auction.collections.filter((entry) => entry.player_id === joined.player.id);
  const win = alexItems.find((entry) => entry.item_id === firstLotId);
  assert.ok(win, "Alex should have won the current lot.");
  assert.equal(win.price_paid ?? win.price, 1);
  console.log("One player still short", {
    status: auction.game.status,
    alex: alexItems.length,
    sam: samItems.length,
    nextItem: auction.game.current_item_id,
  });
  assert.equal(alexItems.length, 5);
  assert.equal(samItems.length, 4);
  assert.equal(auction.game.status, "active");
  assert.ok(auction.game.current_item_id, "A new lot should have started.");
  assert.notEqual(auction.game.status, "complete");

  const createdFinish = await createGame({
    mode: "1v1",
    maxPlayers: 2,
    budget: 80,
    hostName: "Alex",
    categoryId: category.id,
    challenge: "everyone full verification",
    itemIds: await pickPool(category.id, 2, 14),
  });
  const joinedFinish = await joinGame({
    roomCode: createdFinish.game.room_code,
    playerName: "Sam",
  });
  await startGame({
    roomCode: createdFinish.game.room_code,
    playerId: createdFinish.player.id,
  });
  let finishing = await getAuction(createdFinish.game.room_code);
  assert.ok(finishing);

  await seedCollections({
    gameId: createdFinish.game.id,
    currentItemId: finishing.game.current_item_id,
    categoryId: category.id,
    players: [
      { player: createdFinish.player, count: 4 },
      { player: joinedFinish.player, count: 5 },
    ],
  });

  const lotId = finishing.game.current_item_id;
  await placeBid({
    roomCode: createdFinish.game.room_code,
    playerId: createdFinish.player.id,
    amount: 7,
  });

  finishing = await getAuction(createdFinish.game.room_code);
  assert.ok(finishing);
  const alexWon = finishing.collections.filter(
    (entry) => entry.player_id === createdFinish.player.id,
  );
  const samWon = finishing.collections.filter(
    (entry) => entry.player_id === joinedFinish.player.id,
  );
  const paid = alexWon.find((entry) => entry.item_id === lotId);
  console.log("Everyone full", {
    status: finishing.game.status,
    auctionStatus: finishing.game.auction_status,
    alex: alexWon.length,
    sam: samWon.length,
    pricePaid: paid?.price_paid ?? paid?.price,
    alexBudget: finishing.players.find((player) => player.id === createdFinish.player.id)
      ?.budget_remaining,
  });

  assert.equal(alexWon.length, 5);
  assert.equal(samWon.length, 5);
  assert.equal(paid?.price_paid ?? paid?.price, 7);
  assert.equal(
    finishing.players.find((player) => player.id === createdFinish.player.id)?.budget_remaining,
    73,
  );
  assert.equal(finishing.game.status, "finished");
  assert.notEqual(finishing.game.status, "complete");
  const duplicate = finishing.collections.filter((entry) => entry.item_id === lotId);
  assert.equal(duplicate.length, 1);

  console.log("Final-item status tests passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
