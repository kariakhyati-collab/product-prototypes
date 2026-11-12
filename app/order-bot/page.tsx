import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { OrderBotDemo } from "@/components/order-bot/OrderBotDemo";

export const metadata: Metadata = {
  title: "Chat ordering bot",
  description: "Kirana retailers order from a Pune FMCG distributor over chat; orders land live in the distributor's ops console.",
};

export default function OrderBotPage() {
  return (
    <>
      <SiteHeader back title="Chat ordering bot" />
      <main className="flex flex-1 flex-col">
        <OrderBotDemo />
      </main>
    </>
  );
}
