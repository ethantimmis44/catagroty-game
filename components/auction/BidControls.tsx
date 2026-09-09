"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { nextBidAmount } from "@/lib/auctionEngine";
import { formatBudget } from "@/lib/format";
import { validateBidAmount } from "@/lib/rules";

type BidControlsProps = {
  currentBid: number;
  remainingBudget: number;
  disabled: boolean;
  /** Opening bidders must bid, so they get no PASS button. */
  openingBid: boolean;
  onBid: (amount: number) => Promise<void>;
  onPass: () => Promise<void>;
};

export function BidControls({
  currentBid,
  remainingBudget,
  disabled,
  openingBid,
  onBid,
  onPass,
}: BidControlsProps) {
  const quickBid = nextBidAmount(currentBid);
  const canAffordNext = quickBid <= remainingBudget;
  const cannotRaise = remainingBudget <= currentBid;
  const [customBid, setCustomBid] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitBid(amount: number) {
    if (busy || disabled) {
      return;
    }
    const error = validateBidAmount({
      amount,
      currentBid,
      remainingBudget,
    });
    if (error) {
      setMessage(error);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await onBid(amount);
      setCustomBid("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not place that bid.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCustom(event: FormEvent) {
    event.preventDefault();
    const amount = Number(customBid);
    await submitBid(amount);
  }

  async function handlePass() {
    if (busy || disabled) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await onPass();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not pass.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <Button
        className="w-full"
        disabled={disabled || busy || !canAffordNext}
        onClick={() => void submitBid(quickBid)}
      >
        Bid {formatBudget(quickBid)}
      </Button>

      <form className="flex gap-2" onSubmit={handleCustom}>
        <div className="flex-1">
          <TextField
            label="Custom bid"
            name="customBid"
            type="number"
            min={quickBid}
            max={remainingBudget}
            step={1}
            value={customBid}
            onChange={(event) => setCustomBid(event.target.value)}
            placeholder={`£${quickBid}+`}
            disabled={disabled || busy}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="mt-7"
          disabled={disabled || busy}
        >
          Bid
        </Button>
      </form>

      {openingBid ? (
        <p className="text-sm text-muted">
          You open this item. The opening bid must be made, so there is no pass.
        </p>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          disabled={disabled || busy}
          onClick={() => void handlePass()}
        >
          PASS
        </Button>
      )}
      {cannotRaise ? (
        <p className="text-sm text-gold">You can&apos;t afford the next bid.</p>
      ) : null}
      {message ? <p className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}
