export type ErrorContext =
  | "login"
  | "signup"
  | "rating"
  | "saving"
  | "downloading"
  | "importing"
  | "profile"
  | "general";
export type FriendlyError = { title: string; message: string; action: string };

export function getFriendlyError(
  error: unknown,
  context: ErrorContext = "general",
): FriendlyError {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status?: unknown }).status)
      : undefined;
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error ?? "").toLowerCase();
  if (
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    message.includes("offline") ||
    message.includes("network")
  )
    return {
      title: "You're offline",
      message: "No internet connection. Check your network and try again.",
      action: "Retry",
    };
  if (
    message.includes("abort") ||
    message.includes("timeout") ||
    status === 408 ||
    status === 504
  )
    return {
      title: "Poor network connection",
      message: "Poor network connection. This is taking longer than usual.",
      action: "Retry",
    };
  if (status === 401)
    return {
      title: "Log in required",
      message: "Please log in to continue.",
      action: "Log in",
    };
  if (status === 403)
    return {
      title: "Permission needed",
      message: "You don't have permission to do that.",
      action: "Go back",
    };
  if (status === 404)
    return {
      title: "Not found",
      message: "We couldn't find that book or page.",
      action: "Go home",
    };
  if (
    status === 409 ||
    message.includes("duplicate") ||
    message.includes("taken")
  )
    return {
      title: "Already in use",
      message:
        context === "signup"
          ? "That username is taken."
          : "That item already exists.",
      action: "Try again",
    };
  if (status === 429)
    return {
      title: "Please slow down",
      message: "You're going too fast. Please wait a moment.",
      action: "Try again",
    };
  if (
    message.includes("storage") ||
    message.includes("quota") ||
    message.includes("space")
  )
    return {
      title: "Storage is full",
      message: "Your device is out of space. Remove a download and try again.",
      action: "Manage downloads",
    };
  if (context === "importing")
    return {
      title: "Couldn't add book",
      message: "We couldn't add this book right now. Please try again later.",
      action: "Try again",
    };
  return {
    title: "Something went wrong",
    message: "Something went wrong on our side. Please try again.",
    action: "Try again",
  };
}
