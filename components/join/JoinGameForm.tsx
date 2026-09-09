"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { TextField } from "@/components/ui/TextField";
import { joinGame } from "@/lib/games";
import { savePlayerId } from "@/lib/playerSession";

export function JoinGameForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = roomCode.trim().toUpperCase();
    const name = playerName.trim();

    if (code.length !== 6) {
      setError("Enter the 6-character room code.");
      return;
    }

    if (name.length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { game, player } = await joinGame({
        roomCode: code,
        playerName: name,
      });

      savePlayerId(game.room_code, player.id);
      router.push(`/lobby/${game.room_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the game.");
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <TextField
        label="Room code"
        name="roomCode"
        value={roomCode}
        onChange={(event) =>
          setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
        }
        maxLength={6}
        placeholder="ABC123"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        required
      />

      <TextField
        label="Display name"
        name="playerName"
        autoComplete="nickname"
        maxLength={20}
        value={playerName}
        onChange={(event) => setPlayerName(event.target.value)}
        placeholder="Your name"
        required
      />

      <ErrorBanner message={error} />

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Joining..." : "Join Game"}
      </Button>
    </form>
  );
}
