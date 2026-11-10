// Reasons people can pick when reporting. The `value` strings must match
// REPORT_REASONS in server/routes/business.js.

export const BUSINESS_REASONS = [
  { value: "closed", label: "It has closed down", hint: "The business no longer operates here." },
  { value: "wrong_location", label: "The pin is in the wrong place", hint: "It is somewhere else, or the street is wrong." },
  { value: "wrong_info", label: "The details are wrong", hint: "Name, category, photo or description does not match." },
  { value: "duplicate", label: "It is listed twice", hint: "The same business is already on the map." },
  { value: "inappropriate", label: "Inappropriate or fake", hint: "Offensive content, spam or a made-up business." },
  { value: "other", label: "Something else", hint: "Tell us what is wrong." },
];

export const REVIEW_REASONS = [
  { value: "abusive", label: "Abusive or offensive", hint: "Insults, threats or hateful language." },
  { value: "spam", label: "Spam or advertising", hint: "Promotes something unrelated." },
  { value: "fake", label: "Looks fake", hint: "Written by the owner, or by someone who never visited." },
  { value: "wrong_business", label: "About a different business", hint: "It belongs on another listing." },
  { value: "other", label: "Something else", hint: "Tell us what is wrong." },
];

export const REASON_LABELS = Object.fromEntries(
  [...BUSINESS_REASONS, ...REVIEW_REASONS].map((r) => [r.value, r.label]),
);
