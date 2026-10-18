import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl text-leaf-500">404</p>
      <h1 className="mt-4 font-display text-3xl text-forest-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved. Try the shop or ask our wellness guide.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-forest-700 px-5 py-2.5 font-semibold text-white hover:bg-forest-600">
          Go to shop
        </Link>
        <Link href="/" className="rounded-full px-5 py-2.5 font-semibold text-forest-800 ring-1 ring-forest-700/30 hover:bg-leaf-100">
          Home
        </Link>
      </div>
    </div>
  );
}
