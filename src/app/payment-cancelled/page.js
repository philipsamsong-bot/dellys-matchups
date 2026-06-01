export default function PaymentCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080304] px-6 text-white">
      <div className="max-w-xl rounded-3xl border border-red-500/30 bg-white/5 p-10 text-center">
        <h1 className="text-4xl font-black text-red-400">
          Payment Cancelled
        </h1>

        <p className="mt-4 text-white/70">
          You cancelled checkout. You can upgrade anytime.
        </p>

        <a
          href="/pricing"
          className="mt-8 inline-block rounded-2xl bg-red-700 px-6 py-4 font-bold hover:bg-red-800"
        >
          Back to Pricing
        </a>
      </div>
    </main>
  );
}
