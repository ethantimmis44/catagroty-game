"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startGameAction } from "@/app/actions/games";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { formatBudget, formatGameMode } from "@/lib/format";
import { getLobby, isHostPlayer, minimumPlayersFor } from "@/lib/games";
import { auctionPath, getPlayerId, savePlayerId } from "@/lib/playerSession";
import { supabase } from "@/lib/supabase";
import { isGameFinished, type Game, type GamePlayer } from "@/lib/types";

type LobbyViewProps = {
  initialGame: Game;
  initialPlayers: GamePlayer[];
};

export function LobbyView({ initialGame, initialPlayers }: LobbyViewProps) {
  const router = useRouter();
  const [game, setGame] = useState(initialGame);
  const [players, setPlayers] = useState(initialPlayers);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const host = isHostPlayer(players, playerId);
  const waiting = game.status === "waiting";
  const spotsLeft = Math.max(game.max_players - players.length, 0);
  const minPlayers = minimumPlayersFor(game.mode);
  const canStart = host && waiting && players.length >= minPlayers;

  function goToAuction() {
    const id = playerId ?? getPlayerId(game.room_code);
    if (id) {
      savePlayerId(game.room_code, id);
    }
    router.replace(auctionPath(game.room_code, id));
  }

  useEffect(() => {
    setPlayerId(getPlayerId(initialGame.room_code));
  }, [initialGame.room_code]);

  useEffect(() => {
    if (game.status === "active") {
      goToAuction();
    }
    if (isGameFinished(game)) {
      router.replace(`/complete/${game.room_code}`);
    }
    // playerId is included so a late session restore still stamps the query param.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.room_code, game.status, playerId, router]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const lobby = await getLobby(game.room_code);
        if (!lobby || cancelled) {
          return;
        }
        setGame(lobby.game);
        setPlayers(lobby.players);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not refresh the lobby.",
          );
        }
      }
    }

    const channel = supabase
      .channel(`lobby:${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${game.id}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          const nextStatus = (payload.new as Game | null)?.status;
          if (nextStatus === "active") {
            goToAuction();
            return;
          }
          if (nextStatus === "finished" || nextStatus === "complete") {
            router.replace(`/complete/${game.room_code}`);
            return;
          }
          void refresh();
        },
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void refresh();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [game.id, game.room_code]);

  async function handleStart() {
    if (!playerId) {
      setError("Could not identify the host. Please rejoin this room.");
      return;
    }

    setStarting(true);
    setError(null);

    try {
      await startGameAction(game.room_code, playerId);
      goToAuction();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start the game.",
      );
      setStarting(false);
    }
  }

  return (
    <div className="w-full max-w-lg text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
        {waiting ? "Waiting for players" : "Game started"}
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
        Lobby
      </h1>

      <div className="mt-8 rounded-2xl border border-line bg-surface/80 p-5 text-left sm:p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Room code
            </dt>
            <dd className="mt-1 font-mono text-3xl tracking-[0.2em] text-gold">
              {game.room_code}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Mode
            </dt>
            <dd className="mt-1 text-base text-foreground">
              {formatGameMode(game.mode)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Budget
            </dt>
            <dd className="mt-1 text-base text-foreground">
              {formatBudget(game.budget)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Players
            </dt>
            <dd className="mt-1 text-base text-foreground">
              {players.length} / {game.max_players}
              {waiting && spotsLeft > 0
                ? ` · ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
                : ""}
            </dd>
          </div>
        </dl>

        <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
          {players.map((player, index) => (
            <li
              key={player.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-foreground">
                {player.player_name}
                {index === 0 ? (
                  <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-gold">
                    Host
                  </span>
                ) : null}
                {player.id === playerId ? (
                  <span className="ml-2 text-xs text-muted">(you)</span>
                ) : null}
              </span>
              <span className="text-sm text-muted">
                {formatBudget(player.budget_remaining)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {waiting ? (
            host ? (
              <Button
                className="w-full"
                onClick={handleStart}
                disabled={starting || !canStart}
              >
                {starting ? "Starting..." : "Start Game"}
              </Button>
            ) : (
              <p className="rounded-xl border border-line px-4 py-3 text-center text-sm text-muted">
                Waiting for host...
              </p>
            )
          ) : (
            <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-sm text-gold">
              Starting the auction...
            </p>
          )}
          {waiting && host && players.length < minPlayers ? (
            <p className="mt-3 text-center text-sm text-muted">
              At least {minPlayers} players are needed to start.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <ErrorBanner message={error} />
      </div>
    </div>
  );
}
