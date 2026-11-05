# Bolt prompt: CodeCraftHub dashboard

Paste the prompt below into Bolt.new or Bolt.diy as a single message. If your
backend runs somewhere other than `http://localhost:5000`, change the base URL
in the first line before you generate.

`dashboard.html` in this folder is a reference build made from this same
spec, so you can compare what Bolt generates against it.

---

```text
Build a single-file CRUD dashboard called "CodeCraftHub" as ONE self-contained index.html (HTML + CSS + vanilla JavaScript in the same file, no frameworks, no build step, no external libraries or CDNs) that talks to my existing REST API at:

API_BASE_URL = "http://localhost:5000/api/courses"

Put API_BASE_URL in a const at the top of the <script> so I can change it.

The page <title> must be exactly: <title>CodeCraftHub: Your Learning Management Platform</title>

## API contract (already built, CORS enabled; do not mock it)
Every response is JSON with a boolean "success".
- GET    {API_BASE_URL}        -> 200 {"success":true,"count":n,"courses":[Course,...]}
- GET    {API_BASE_URL}/{id}   -> 200 {"success":true,"course":Course} | 404
- POST   {API_BASE_URL}        body {name, description, target_date, status} -> 201 {"success":true,"message":"...","course":Course}
- PUT    {API_BASE_URL}/{id}   body: any subset of {name, description, target_date, status} -> 200 {"success":true,"message":"...","course":Course} | 404
- DELETE {API_BASE_URL}/{id}   -> 200 {"success":true,"message":"...","deleted_course":Course} | 404
- Errors: 400/404/500 with {"success":false,"error":"human-readable message"}
Course = {id:number, name:string, description:string, target_date:"YYYY-MM-DD", status:"Not Started"|"In Progress"|"Completed", created_at:"YYYY-MM-DD HH:MM:SS", updated_at?:string}
Send "Content-Type: application/json" on POST and PUT.

## Layout
1. Header: title "CodeCraftHub", subtitle "Personalized learning dashboard", and a small API status indicator (green dot "API connected" / red dot "API unreachable").
2. Four stat cards computed from the loaded list: Total, Not Started, In Progress, Completed.
3. Two columns on desktop, stacked on screens under 820px:
   - Left: a form card titled "Add a course" with fields name (text, required, max 100), description (textarea, required), target_date (date input, required), status (select with exactly the three status values). Submit button "Add course".
   - Right: "Courses" card with a search box (filters by name or description as you type), a status filter dropdown (All + the three statuses), a Refresh button, and the course list.
4. Each course row shows: name, description, a colored status badge (gray Not Started, amber In Progress, green Completed), formatted target date (show "(overdue)" in red if the date is past and status is not Completed), the id, an Edit button, and a red "Remove" button written as <button class="btn-sm btn-danger" onclick="handleDelete(id)">Remove</button>, where handleDelete(id) is a global function. Sort by target_date ascending.

## Behavior
- On load: GET all courses and render list + stats.
- Create: validate on the client (all fields required, inline red error text under each invalid field), POST, then reset the form and reload the list. After a successful add, swap the submit button's .btn-primary class for an amber .btn-success class and change its text to "✓ Course added" for 1.5 seconds, then switch it back to .btn-primary "Add course". Clicking Edit during that time restores it immediately.
- Edit: clicking Edit fills the same form with that course, changes the title to "Edit course #<id>", the button to "Save changes", shows a Cancel button, and highlights the row. Submitting sends PUT /{id}. Cancel restores the add mode.
- Remove: handleDelete(id) asks confirm() with the course name first, then sends DELETE /{id} and reloads. If the removed course was being edited, reset the form.
- After every successful write, re-fetch the list from the API (the API is the source of truth).
- Show a short toast for success ("Course added", "Course updated", "Course removed"). When the API returns an error, show its "error" message in a red toast.
- If fetch throws (server down), show a red banner: "Could not connect to <API_BASE_URL>. Start the backend with npm start, then click Refresh." Show an empty-state message in the list.
- Empty states: "No courses yet..." when the list is empty, "No courses match your search or filter." when filters hide everything. Show "Loading courses..." while loading.
- Disable the submit button while a request is in flight.
- Escape all course text before inserting it into HTML (prevent XSS). Never use eval.

## Style
Clean, modern admin look: light background, white cards with subtle border and shadow, 10px radius, system font stack, red text for Remove. Use these exact button styles:
.btn-primary { background: #8B5CF6; border-color: #8B5CF6; color: #ffffff; }  (hover: #7C3AED)
.btn-success { background: #F59E0B; border-color: #F59E0B; color: #1b2333; } Support dark mode via prefers-color-scheme. Accessible: real <label>s for every input, visible focus outlines, aria-live on the list and toast.

Output only the complete index.html.
```
