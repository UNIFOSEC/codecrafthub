import { isStatus, type CourseInput } from "./types";

export const LIMITS = { name: 100, description: 1000 } as const;

export type FieldErrors = Partial<Record<keyof CourseInput, string>>;

/** A real calendar date in YYYY-MM-DD format (rejects 2026-02-30). */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Same rules as the API's validateCourseData(), so users get instant feedback
 * and demo mode behaves exactly like the real server.
 * With partial=true (updates), only the fields that are present are checked.
 */
export function validateCourse(input: Partial<CourseInput>, partial = false): FieldErrors {
  const errors: FieldErrors = {};

  if (!partial || "name" in input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) errors.name = "Give the course a name.";
    else if (name.length > LIMITS.name) errors.name = `Keep the name to ${LIMITS.name} characters or fewer.`;
  }

  if (!partial || "description" in input) {
    const description = typeof input.description === "string" ? input.description.trim() : "";
    if (!description) errors.description = "Add a short description.";
    else if (description.length > LIMITS.description)
      errors.description = `Keep the description to ${LIMITS.description} characters or fewer.`;
  }

  if (!partial || "target_date" in input) {
    if (!isValidDate(input.target_date)) errors.target_date = "Pick a valid target date.";
  }

  if (!partial || "status" in input) {
    if (!isStatus(input.status)) errors.status = "Choose a status.";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
