import { redirect } from "next/navigation";
import { AuctionView } from "@/components/auction/AuctionView";
import { PageShell } from "@/components/ui/PageShell";
import { ensureLiveAuction, getAuction } from "@/lib/auction";
import { isGameFinished } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await ensureLiveAuction(code);
  const auction = await getAuction(code);

  if (!auction) {
    redirect("/");
  }

  if (auction.game.status === "waiting") {
    redirect(`/lobby/${auction.game.room_code}`);
  }

  if (isGameFinished(auction.game)) {
    redirect(`/complete/${auction.game.room_code}`);
  }

  return (
    <PageShell>
      <AuctionView auction={auction} />
    </PageShell>
  );
}
