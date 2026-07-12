import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TerminBookingClient } from "@/components/termin/TerminBookingClient";

export const metadata: Metadata = {
  title: "Meine Anfrage",
  robots: { index: false, follow: false },
};

function TerminPageInner({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token?.trim();
  if (!token) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4" data-testid="termin-incomplete">
        <h1 className="text-2xl font-bold text-foreground mb-3">Link unvollständig</h1>
        <p className="text-muted">Bitte öffnen Sie den Link aus Ihrer E-Mail erneut.</p>
      </div>
    );
  }
  return <TerminBookingClient token={token} />;
}

export default async function TerminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50">
        <Suspense
          fallback={
            <div className="py-20 text-center text-muted">Wird geladen…</div>
          }
        >
          <TerminPageInner searchParams={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
