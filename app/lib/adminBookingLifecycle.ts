export const CHECK_IN_ALLOWED_FROM_STATUS = "CONFIRMED" as const;

export type AdminLifecycleAction =
  | "cancel"
  | "checkin"
  | "board"
  | "complete";

export function isCheckInAllowedFromStatus(status: string): boolean {
  return status === CHECK_IN_ALLOWED_FROM_STATUS;
}

export function getAdminBookingLifecycleActions(
  status: string
): AdminLifecycleAction[] {
  switch (status) {
    case "DRAFT":
      return ["cancel"];
    case "CONFIRMED":
      return ["checkin", "cancel"];
    case "CHECKED_IN":
      return ["board", "cancel"];
    case "BOARDED":
      return ["complete"];
    default:
      return [];
  }
}

export function adminLifecycleActionPath(
  bookingId: string,
  action: AdminLifecycleAction
): string {
  switch (action) {
    case "cancel":
      return `/api/bookings/${bookingId}/cancel`;
    case "checkin":
      return `/api/bookings/${bookingId}/checkin`;
    case "board":
      return `/api/bookings/${bookingId}/board`;
    case "complete":
      return `/api/bookings/${bookingId}/complete`;
  }
}
