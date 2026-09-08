import { ErrorScreen } from "@/components/errors/errorScreen";

export const metadata = { title: "Too many requests | One Base" };

export default function RateLimitPreview() {
  return <ErrorScreen code={429} />;
}
