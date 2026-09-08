import { notFound } from "next/navigation";

export default function NotFoundPreview() {
  // Exercise the actual not-found boundary from the page directory.
  notFound();
}
