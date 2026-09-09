import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const MIGRATIONS: Record<string, string> = {
  game_items: "supabase/migrations/20260825120000_stage10_game_items.sql",
};

async function main() {
  const { supabase } = await import("../lib/supabase");

  for (const [table, migration] of Object.entries(MIGRATIONS)) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      console.log(`${table}: MISSING — run ${migration}`);
      console.log(`  ${error.message}`);
    } else {
      console.log(`${table}: present`);
    }
  }

  // The opening-bid rule and pool filter live in the stage 8 RPC. This probe
  // only reports whether the function is installed, it does not change a game.
  const probe = await supabase.rpc("submit_auction_action", {
    p_room_code: "ZZZZZZ",
    p_player_id: "00000000-0000-0000-0000-000000000000",
    p_action: "bid",
    p_amount: 1,
  });
  const missing =
    probe.error &&
    /could not find|does not exist|PGRST202|42883/i.test(probe.error.message);
  console.log(
    missing
      ? "submit_auction_action: MISSING — run supabase/migrations/20260824220000_stage8_submit_auction_action.sql"
      : "submit_auction_action: present",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
