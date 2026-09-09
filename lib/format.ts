export function formatBudget(amount: number) {
  return `£${amount}`;
}

export function formatGameMode(mode: string) {
  return mode === "1v1" ? "1v1" : "Multiplayer";
}
