import { RetryErrorPreview } from "@/components/errors/retryErrorPreview";

export const metadata = { title: "Temporarily unavailable | One Base" };

export default function UnavailablePreview() {
  return <RetryErrorPreview code={503} />;
}
