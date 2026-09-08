import { ErrorScreen } from "@/components/errors/errorScreen";

export const metadata = { title: "Sign in required | One Base" };

export default function UnauthorizedPreview() {
  return <ErrorScreen code={401} />;
}
