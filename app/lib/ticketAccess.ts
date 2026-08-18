import { bookingHasPaidCapture } from "./checkoutSession";

export const TICKET_ELIGIBLE_STATUSES = [
  "CONFIRMED",
  "CHECKED_IN",
  "BOARDED",
  "COMPLETED",
] as const;

export type TicketAccessBooking = {
  status: string;
  paymentStatus: string;
  payments?: Array<{ status: string }>;
};

export function isTicketEligible(booking: TicketAccessBooking): boolean {
  return (
    (TICKET_ELIGIBLE_STATUSES as readonly string[]).includes(booking.status) &&
    bookingHasPaidCapture(booking)
  );
}
