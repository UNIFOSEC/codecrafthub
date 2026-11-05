import { addDays, timestamp, todayISO } from "../dates";
import type { Course, Status } from "../types";

type SeedRow = [name: string, description: string, dueInDays: number, status: Status, addedDaysAgo: number];

// Dates are relative to today, so the demo never looks stale.
const ROWS: SeedRow[] = [
  ["Git & GitHub Workflows", "Branching strategies, pull requests, rebasing, and resolving merge conflicts with confidence.", -12, "Completed", 70],
  ["SQL for Developers", "Joins, indexes, and query plans: write queries that stay fast as data grows.", -30, "Completed", 90],
  ["TypeScript Fundamentals", "Types, generics, and narrowing: make refactors safe in real-world codebases.", 9, "In Progress", 40],
  ["REST API Design with Express", "Resource modelling, validation, status codes, and consistent error responses.", 21, "In Progress", 35],
  ["Testing with Playwright", "End-to-end tests for web apps: locators, fixtures, and running them in CI.", -3, "Not Started", 28],
  ["Web Application Security", "The OWASP Top 10 in practice: injection, broken access control, XSS, and how to prevent them.", 45, "Not Started", 20],
  ["Docker & Containers", "Images, multi-stage builds, and docker compose for local development.", 60, "Not Started", 14],
  ["System Design Basics", "Caching, queues, and scaling patterns, with trade-offs explained through real examples.", 90, "In Progress", 7],
];

export function seedCourses(): Course[] {
  const today = todayISO();
  const now = Date.now();
  return ROWS.map(([name, description, dueInDays, status, addedDaysAgo], i) => ({
    id: i + 1,
    name,
    description,
    target_date: addDays(today, dueInDays),
    status,
    created_at: timestamp(new Date(now - addedDaysAgo * 86_400_000)),
  }));
}
