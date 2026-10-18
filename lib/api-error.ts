import { NextResponse } from "next/server";
import { getFriendlyError, type ErrorContext } from "@/lib/errors";

export function apiError(
  error: unknown,
  status = 500,
  context: ErrorContext = "general",
) {
  console.error("[v0] API error", { context, error });
  const friendly = getFriendlyError({ status });
  return NextResponse.json(
    {
      error: {
        code: status === 500 ? "INTERNAL_ERROR" : `HTTP_${status}`,
        message: friendly.message,
      },
    },
    { status },
  );
}
