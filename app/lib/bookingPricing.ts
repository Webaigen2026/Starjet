// Shipped as the review-flow per-traveler price in commit 9b62aac
// (frontend TRAVEL_PROTECTION_PRICE). There is no catalog/config source.
export const TRAVEL_PROTECTION_PRICE_PER_TRAVELER = 24.99;

function toMoneyNumber(value: unknown): number {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * 100) / 100;
}

export function calculateTravelProtectionAmount(
  travelProtection: boolean,
  passengersCount: number
): number {
  if (!travelProtection) {
    return 0;
  }

  const count = Math.max(0, Number(passengersCount) || 0);

  return toMoneyNumber(TRAVEL_PROTECTION_PRICE_PER_TRAVELER * count);
}

export function calculateBookingTotal(input: {
  baseFarePerPassenger: number;
  passengersCount: number;
  taxes?: number;
  serviceFee?: number;
  travelProtectionAmount?: number;
  discountAmount?: number;
}): number {
  const passengersCount = Math.max(0, Number(input.passengersCount) || 0);
  const baseFarePerPassenger = toMoneyNumber(input.baseFarePerPassenger);
  const taxes = toMoneyNumber(input.taxes);
  const serviceFee = toMoneyNumber(input.serviceFee);
  const travelProtectionAmount = toMoneyNumber(input.travelProtectionAmount);
  const discountAmount = toMoneyNumber(input.discountAmount);

  return Math.max(
    toMoneyNumber(
      baseFarePerPassenger * passengersCount +
        taxes +
        serviceFee +
        travelProtectionAmount -
        discountAmount
    ),
    0
  );
}
