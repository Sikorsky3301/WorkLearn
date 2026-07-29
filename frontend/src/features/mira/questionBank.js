// Test content for MIRA's mock interview flow. This is a fixed Machine
// Learning question set used for previewing the UI end-to-end — there is no
// backend/LLM wired up yet, so scoring in MiraContext is a deterministic,
// text-metric-based heuristic rather than real AI grading.

export const ML_QUESTIONS = [
  {
    id: 1,
    type: 'Technical',
    difficulty: 'Beginner',
    question: 'What is the difference between supervised and unsupervised learning? Give an example of each.',
    keywords: ['labeled', 'labels', 'unlabeled', 'classification', 'regression', 'clustering', 'target'],
    idealPointers: 'Define supervised learning as training on labeled data (e.g. regression/classification) and unsupervised learning as finding structure in unlabeled data (e.g. clustering, dimensionality reduction). Ground each with a concrete example.',
  },
  {
    id: 2,
    type: 'Technical',
    difficulty: 'Beginner',
    question: 'Explain overfitting and underfitting. How would you detect and address each?',
    keywords: ['overfitting', 'underfitting', 'variance', 'bias', 'regularization', 'validation', 'training error', 'test error'],
    idealPointers: 'Overfitting: low training error, high validation error — fix with more data, regularization, dropout, or a simpler model. Underfitting: high error on both — fix with a more expressive model or better features. Mention learning curves or train/validation gap as the detection method.',
  },
  {
    id: 3,
    type: 'Technical',
    difficulty: 'Intermediate',
    question: 'Walk through the bias-variance tradeoff and why it matters when choosing a model.',
    keywords: ['bias', 'variance', 'tradeoff', 'complexity', 'generalization', 'error'],
    idealPointers: 'High bias = underfit/oversimplified; high variance = overfit/too sensitive to training data. Total error decomposes into bias² + variance + irreducible noise. Model choice and regularization strength should target the sweet spot that minimizes validation error.',
  },
  {
    id: 4,
    type: 'Technical',
    difficulty: 'Intermediate',
    question: 'How does gradient descent work, and what is the effect of the learning rate on convergence?',
    keywords: ['gradient', 'learning rate', 'convergence', 'loss', 'minimum', 'step size', 'local minima'],
    idealPointers: 'Gradient descent iteratively updates parameters opposite the loss gradient. Too high a learning rate can overshoot or diverge; too low is slow and can get stuck. Mention variants like SGD, momentum, or Adam and learning-rate scheduling.',
  },
  {
    id: 5,
    type: 'Technical',
    difficulty: 'Intermediate',
    question: 'When would you use precision vs recall as your primary metric? Give a real scenario for each.',
    keywords: ['precision', 'recall', 'false positive', 'false negative', 'imbalanced', 'threshold', 'f1'],
    idealPointers: 'Precision matters when false positives are costly (e.g. spam filtering); recall matters when false negatives are costly (e.g. cancer/fraud detection). Mention the F1 score and threshold tuning as ways to balance the two.',
  },
  {
    id: 6,
    type: 'Technical',
    difficulty: 'Advanced',
    question: 'How would you handle a severely imbalanced dataset (e.g. 1% positive class) when training a classifier?',
    keywords: ['imbalanced', 'resampling', 'smote', 'oversampling', 'undersampling', 'class weight', 'f1', 'auc', 'precision', 'recall'],
    idealPointers: 'Cover resampling (SMOTE, undersampling/oversampling), class-weighted loss, choosing PR-AUC/F1 over accuracy, and threshold calibration. Bonus for discussing evaluation pitfalls like accuracy being misleading here.',
  },
  {
    id: 7,
    type: 'Technical',
    difficulty: 'Advanced',
    question: 'Explain how a random forest reduces variance compared to a single decision tree.',
    keywords: ['bagging', 'ensemble', 'variance', 'decision tree', 'bootstrap', 'random subset', 'averaging'],
    idealPointers: 'Random forests bag many trees on bootstrapped samples with random feature subsets, then average (or vote on) predictions — decorrelating individual trees so their combined variance is lower than any single deep tree.',
  },
  {
    id: 8,
    type: 'Mixed',
    difficulty: 'Intermediate',
    question: 'Describe your end-to-end process for taking an ML model from a notebook prototype to production.',
    keywords: ['pipeline', 'deployment', 'monitoring', 'versioning', 'feature store', 'retraining', 'data drift', 'testing', 'api'],
    idealPointers: 'Cover data/feature pipeline reproducibility, model versioning, packaging (API/container), monitoring for data/concept drift, and a retraining or rollback strategy — not just the model-training step.',
  },
  {
    id: 9,
    type: 'Behavioral',
    difficulty: 'Beginner',
    question: 'Tell me about a machine learning project you worked on. What was your role and what was the outcome?',
    keywords: ['project', 'role', 'outcome', 'result', 'impact', 'metric', 'team'],
    idealPointers: 'Use a STAR-style structure: the problem/context, your specific contribution, the technical approach, and a measurable outcome or impact — not just a description of the dataset or model.',
  },
  {
    id: 10,
    type: 'HR',
    difficulty: 'Beginner',
    question: 'How do you stay current with new developments in machine learning, and how do you decide what to learn next?',
    keywords: ['papers', 'courses', 'community', 'practice', 'projects', 'research', 'learning'],
    idealPointers: 'Give concrete, specific habits (papers, courses, competitions, open-source contributions) and how you prioritize what to learn based on job relevance or curiosity, rather than a vague "I read blogs" answer.',
  },
]

export const INTERVIEW_TYPES = ['Technical', 'HR', 'Behavioral', 'Mixed']
export const ROLES = ['Software Developer', 'Data Analyst', 'AI/ML Engineer', 'Web Developer', 'Custom role']
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
export const DURATIONS = [
  { label: '10 minutes', minutes: 10, questionCount: 4 },
  { label: '20 minutes', minutes: 20, questionCount: 7 },
  { label: '30 minutes', minutes: 30, questionCount: 10 },
]

// Picks `count` questions for the session: prioritizes matching difficulty,
// matching type (or Mixed = any type), then backfills from the rest of the
// bank so a session always has exactly `count` questions regardless of how
// narrow the filters are.
export function selectQuestions({ interviewType, difficulty, count }) {
  const matchesType = q => interviewType === 'Mixed' || q.type === interviewType || q.type === 'Mixed'
  const primary = ML_QUESTIONS.filter(q => matchesType(q) && q.difficulty === difficulty)
  const secondary = ML_QUESTIONS.filter(q => matchesType(q) && q.difficulty !== difficulty)
  const rest = ML_QUESTIONS.filter(q => !matchesType(q))

  const ordered = [...primary, ...secondary, ...rest]
  const seen = new Set()
  const deduped = ordered.filter(q => (seen.has(q.id) ? false : (seen.add(q.id), true)))

  return deduped.slice(0, Math.min(count, deduped.length))
}
