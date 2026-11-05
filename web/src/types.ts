export const STATUSES = ["Not Started", "In Progress", "Completed"] as const;
export type Status = (typeof STATUSES)[number];

/** Same shape as the Express API returns, so both data sources are interchangeable. */
export interface Course {
  id: number;
  name: string;
  description: string;
  target_date: string; // YYYY-MM-DD
  status: Status;
  created_at: string; // YYYY-MM-DD HH:MM:SS (UTC)
  updated_at?: string;
}

export type CourseInput = Pick<Course, "name" | "description" | "target_date" | "status">;

/** Short key used for CSS classes (badge-ns, dot-ip, ...). */
export const STATUS_KEY: Record<Status, "ns" | "ip" | "done"> = {
  "Not Started": "ns",
  "In Progress": "ip",
  Completed: "done",
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}
