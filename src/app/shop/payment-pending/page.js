import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function ShopPaymentPendingPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <section className="mx-auto max-w-4xl rounded-[3rem] bg-black/25 p-10 text-center shadow-2xl md:p-16">
          <p className="font-black uppercase tracking-[0.35em] text-red-100">
            Payment Pending
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold">
            Order Received
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Thank you. Your order has been received and is pending payment
            confirmation.
          </p>

          <div className="mt-10 rounded-[2rem] bg-white/10 p-8 text-left">
            <h2 className="font-display text-4xl font-bold">Next Step</h2>

            <p className="mt-5 leading-8 text-white/75">
              Please send your payment proof or transaction screenshot on
              WhatsApp so our team can verify and process your order.
            </p>

            <a
              href="https://wa.me/237676257187"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Send Payment Proof
            </a>
          </div>

          <a
            href="/shop/books"
            className="mt-10 inline-flex rounded-full border border-white/20 px-8 py-4 font-black text-white"
          >
            Continue Shopping
          </a>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
