import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { FieldSalesApp } from "@/components/field-sales/FieldSalesApp";

export const metadata: Metadata = {
  title: "Field-sales app",
  description: "A mobile app for reps visiting shops: route, check-in, orders with schemes, payment collection and offline sync.",
};

export default function FieldSalesPage() {
  return (
    <>
      <SiteHeader back title="Field-sales app" />
      <main className="flex flex-1 flex-col">
        <FieldSalesApp />
      </main>
    </>
  );
}
