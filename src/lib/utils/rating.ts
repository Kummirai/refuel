// src/lib/utils/rating.ts

/**
 * Calculates a driver reliability rating based on their history.
 * 
 * @param profile Driver profile object containing verification status
 * @param requests Array of service requests for the driver
 * @returns A rating between 1.0 and 5.0
 */
export function calculateDriverRating(
  profile: any,
  requests: any[] = []
): number {
  let rating = 5.0; // Base rating starts at perfect 5.0

  if (!profile) return 0;

  // 1. Verification Status Impact (Serious deductions for non-compliance)
  if (profile.verificationStatus === "rejected") {
    rating -= 1.5; // Significant drop for rejected documents
  } else if (profile.verificationStatus !== "approved") {
    rating -= 0.5; // Minor deduction for incomplete verification
  }

  // 2. Repayment History Impact (Deductions for bad financial behavior)
  let repaymentPenalty = 0;
  
  requests.forEach(req => {
    const repayments = req.repayments || [];
    
    // Check if any approved repayment was late
    repayments.forEach((rep: any) => {
      if (rep.status === "approved") {
        const submittedAt = new Date(rep.submittedAt);
        const dueDate = req.dueDate ? new Date(req.dueDate) : null;

        if (dueDate && submittedAt > dueDate) {
          repaymentPenalty += 0.3; // Penalty for late payment
        }
      } else if (rep.status === "rejected") {
        repaymentPenalty += 0.5; // Heavy penalty for fake/rejected proof
      }
    });

    // Penalty for outstanding balances that are overdue
    const today = new Date();
    const dueDate = req.dueDate ? new Date(req.dueDate) : null;
    if (req.remainingBalance > 0 && dueDate && today > dueDate) {
      repaymentPenalty += 0.5;
    }
  });

  // Apply penalties
  rating -= repaymentPenalty;

  // Final Clamp - ensures rating doesn't go below 1.0 or stay above 5.0
  const finalRating = Math.max(1.0, Math.min(5.0, rating));
  
  // Return rounded to 1 decimal place
  return Math.round(finalRating * 10) / 10;
}
