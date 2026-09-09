"use client";

import { useEffect, useRef, useState } from "react";
import { secondsLeft } from "@/lib/auctionEngine";

type AuctionTimerProps = {
  deadline: string | null;
  onExpire: () => void;
};

export function AuctionTimer({ deadline, onExpire }: AuctionTimerProps) {
  const [remaining, setRemaining] = useState(() => secondsLeft(deadline));
  const expiredFor = useRef<string | null>(null);

  useEffect(() => {
    expiredFor.current = null;
    setRemaining(secondsLeft(deadline));

    const timer = window.setInterval(() => {
      const next = secondsLeft(deadline);
      setRemaining(next);
      if (next <= 0 && deadline && expiredFor.current !== deadline) {
        expiredFor.current = deadline;
        onExpire();
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [deadline, onExpire]);

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gold bg-background font-display text-5xl text-gold">
      {Math.max(remaining, 0)}
    </div>
  );
}
