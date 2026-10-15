import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | One Base",
  description: "How One Base handles the messages and data of the people it talks with.",
}

/**
 * Public on purpose (proxy.ts OPEN): Meta asks for a privacy policy address before
 * a WhatsApp app can be published, and anybody should be able to read it.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: 5 October 2026</p>

      <h2 className="mt-8 font-semibold">Who we are</h2>
      <p className="mt-2">
        One Base is the private customer tool of YZH Holding LTD. Our team uses it to answer the clients of our brands by
        email and WhatsApp, and to manage their subscriptions.
      </p>

      <h2 className="mt-6 font-semibold">What we keep</h2>
      <p className="mt-2">
        When you write to one of our WhatsApp numbers or email addresses, we keep your phone number or email address, the
        name shown on your profile, and the messages and files you send us, so our team can read and answer them.
      </p>

      <h2 className="mt-6 font-semibold">How we use it</h2>
      <p className="mt-2">
        Only to answer you and to manage your subscription. We do not sell your data, we do not use it for advertising,
        and we do not share it with anyone except the services that carry the messages (Meta for WhatsApp, Google for
        email).
      </p>

      <h2 className="mt-6 font-semibold">How long</h2>
      <p className="mt-2">
        We keep conversations while you are a client and for as long as the law asks us to. You can ask us at any time to
        see or delete what we keep about you.
      </p>

      <h2 className="mt-6 font-semibold">Contact</h2>
      <p className="mt-2">
        To ask a question or delete your data, write to{" "}
        <a href="mailto:support@easyiptv.ca" className="underline underline-offset-4">
          support@easyiptv.ca
        </a>
        .
      </p>
    </main>
  )
}
