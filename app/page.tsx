import { redirect } from "next/navigation";

/**
 * "/" is only a way in. proxy.ts already sends it to sign in before this runs;
 * this is the fallback if that ever changes. Sign-in sends a signed-in person
 * on to their own start page.
 */
export default function Home() {
  redirect("/login");
}
