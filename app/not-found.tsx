import { ErrorScreen } from "@/components/errors/errorScreen";

export default function NotFound() {
  return <ErrorScreen code={404} />;
}
