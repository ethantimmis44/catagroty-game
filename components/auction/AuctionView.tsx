import { AuctionScreen } from "@/components/auction/AuctionScreen";
import type { AuctionState } from "@/lib/auction";

type AuctionViewProps = {
  auction: AuctionState;
};

export function AuctionView({ auction }: AuctionViewProps) {
  return <AuctionScreen initialState={auction} />;
}
