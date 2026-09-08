import { RetryErrorPreview } from "@/components/errors/retryErrorPreview";

export const metadata = { title: "Something went wrong | One Base" };

export default function ServerErrorPreview() {
  return <RetryErrorPreview code={500} />;
}
