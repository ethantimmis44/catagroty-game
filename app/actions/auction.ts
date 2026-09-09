"use server";

import {
  getAuction,
  passTurn,
  placeBid,
  resolveExpiredTurn,
  toPlayerAuctionError,
} from "@/lib/auction";

type ActionResult = {
  ok: boolean;
  error?: string;
};

function fail(err: unknown, fallback: string): ActionResult {
  return {
    ok: false,
    error: toPlayerAuctionError(err) || fallback,
  };
}

export async function placeBidAction(
  roomCode: string,
  playerId: string,
  amount: number,
): Promise<ActionResult> {
  try {
    await placeBid({ roomCode, playerId, amount });
    return { ok: true };
  } catch (err) {
    return fail(err, "Could not place that bid.");
  }
}

export async function passTurnAction(
  roomCode: string,
  playerId: string,
): Promise<ActionResult> {
  try {
    await passTurn({ roomCode, playerId });
    return { ok: true };
  } catch (err) {
    return fail(err, "Could not pass.");
  }
}

export async function resolveExpiredTurnAction(
  roomCode: string,
): Promise<ActionResult> {
  try {
    await resolveExpiredTurn(roomCode);
    return { ok: true };
  } catch (err) {
    return fail(err, "Could not resolve the expired turn.");
  }
}

export async function getAuctionAction(roomCode: string) {
  return getAuction(roomCode);
}
