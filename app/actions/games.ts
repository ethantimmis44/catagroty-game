"use server";

import { startGame } from "@/lib/games";

export async function startGameAction(roomCode: string, playerId: string) {
  await startGame({ roomCode, playerId });
}
