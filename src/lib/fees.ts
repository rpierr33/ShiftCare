export const WORKER_FEE_PERCENT = 0.10; // 10% deducted from worker payout
export const NON_SUBSCRIBER_FEE_PERCENT = 0.15; // 15% surcharge for non-subscribers

// Fee model:
//
// ALL employers post shifts. Workers always have 10% deducted from payout.
//
// Subscribed employers (Starter/Professional): Pay gross amount only.
//   No per-transaction surcharge — subscription covers platform access.
//
// Non-subscribed employers (Free tier or private payers without subscription):
//   Pay gross amount + 15% surcharge on top.
//   This applies to ANY employer posting without an active paid subscription.
//
// Worker payout is always: grossAmount - 10% worker fee.

export function calculateShiftPayments(
  hourlyRate: number,
  hours: number,
  isSubscribed: boolean = true
) {
  const grossAmount = Math.round(hourlyRate * hours * 100) / 100;
  const workerFee = Math.round(grossAmount * WORKER_FEE_PERCENT * 100) / 100;
  const workerPayout = Math.round((grossAmount - workerFee) * 100) / 100;

  // Non-subscribers pay 15% surcharge on top of gross
  const employerFee = !isSubscribed
    ? Math.round(grossAmount * NON_SUBSCRIBER_FEE_PERCENT * 100) / 100
    : 0;
  const totalCharge = Math.round((grossAmount + employerFee) * 100) / 100;

  // Total platform revenue = worker fee + employer surcharge (if non-subscriber)
  const platformFee = Math.round((workerFee + employerFee) * 100) / 100;

  return { grossAmount, workerFee, employerFee, totalCharge, platformFee, workerPayout };
}
