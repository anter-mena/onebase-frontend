import { ErrorScreen } from "@/components/errors/errorScreen";

export const metadata = { title: "Access denied | One Base" };

export default function ForbiddenPreview() {
  return <ErrorScreen code={403} />;
}
