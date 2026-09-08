"use client";

import { ErrorScreen } from "@/components/errors/errorScreen";

export function RetryErrorPreview({ code }: { code: 500 | 503 }) {
  return <ErrorScreen code={code} onRetry={() => window.location.reload()} />;
}
