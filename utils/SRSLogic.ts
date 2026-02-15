export const SRS_STAGES = [
    0,        // New word: 0 minutes
    1,        // Stage 1: 1 minute
    10,       // Stage 2: 10 minutes
    60 * 24,  // Stage 3: 1 day (1440 minutes)
    60 * 24 * 3, // Stage 4: 3 days
    60 * 24 * 7, // Stage 5: 1 week
    60 * 24 * 14, // Stage 6: 2 weeks
    60 * 24 * 30, // Stage 7: 1 month
];

export const calculateNextReview = (currentStage: number, isCorrect: boolean): { nextReview: Date, nextStage: number } => {
    let nextStage = currentStage;

    if (isCorrect) {
        // Advance to next stage, capping at the last stage
        nextStage = Math.min(currentStage + 1, SRS_STAGES.length - 1);
    } else {
        // Reset to stage 1 (not 0, to avoid immediate re-show in some logic, but usually 0 or 1 is fine)
        // Let's reset to Stage 0 or 1. Let's say Stage 1 for a "failed" card means see it in 1 minute.
        nextStage = 1;
    }

    const minutesToAdd = SRS_STAGES[nextStage];
    const nextReview = new Date();
    nextReview.setMinutes(nextReview.getMinutes() + minutesToAdd);

    return { nextReview, nextStage };
};
