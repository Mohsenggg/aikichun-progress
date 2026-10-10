# Player Page — Implementation Spec

> **Status:** All decisions resolved (2026-10-09)
> **Source:** Original requirement + review feedback + codebase analysis
> **References:**
> - `documents/Trainee-Player-UI-UX-Proposal.md`
> - `documents/Roadmap & Task Management.md.md`
> - Review: `player-page-requirement-review.md`

---

## 1. Overview

The Player Page is the **trainee-facing read-only view** of the roadmap. The trainee navigates a hierarchy of Levels → Steps → Tasks, toggling check-based progress. The UI must be **simple, elegant, comfortable, and not crowded**.

### 1.1 Navigation Flow

```
/trainee (Levels Home)
  → /trainee/level/:id (Steps list inside a level)
      → expand Step inline (Tasks checklist dropdown)
          → Task Details bottom-sheet/modal
```

Max **2 taps** to reach a checkbox.

---

## 2. Locked Decisions

| # | Decision | Resolution |
|---|----------|------------|
| D-1 | Checkbox system | **Dynamic `CheckDefinition` per task.** The fixed 4-competency system (`knowledge`, `practice`, `pressure`, `application`) is NOT used in the player view. |
| D-2 | Progress computation | **Server-side.** Backend adds `progressPercentage` to both `TraineeLevelResponse` and `TraineeStageResponse`. |
| D-3 | Level locking | **Configurable by admin/trainer.** Two modes: (A) unlock all levels, (B) unlock only the level of current progress. |
| D-4 | Save mechanism | **Instant per-check save.** Toggle checkbox → optimistic UI update → background PUT. No save button. |
| D-5 | Step name fallback | **When step name is null, use main task title (or first task title if no main).** |
| D-6 | Weights visible to player? | **Never.** Player sees only computed percentages, never raw weight values. |
| D-7 | Level card content | **Level name, progress %, step count, optional link, description button. No task count.** |

---

## 3. UI Specification

### 3.1 Global Header

| Element | Details |
|---------|---------|
| Roadmap name | Display `roadmap.name`, 2-line clamp |
| Overall progress bar | Green `#22c55e`, 10px height, driven by `overallProgressPercentage` |
| Overall progress % | Numeric percentage always shown alongside bar |
| Player info | Name + avatar + logout (reuse existing header) |

### 3.2 Levels Home — `/trainee`

A **card-based list** of levels, each card showing:

| Element | Source Field | Notes |
|---------|-------------|-------|
| Level name | `level.name` | Primary heading |
| Level progress % | `level.progressPercentage` *(new)* | Shown inside a **progress ring SVG** |
| Step count | Computed: `level.stages.length` | e.g. "4 Steps" |
| Resource link | `level.link` | Small ↗ icon/button, only if link exists, opens `_blank` |
| Description button | `level.description` *(if added)* or level detail | Button opens popup/sheet with more info about the level |
| Lock state | Based on admin-configured access mode | Locked levels show lock icon, title visible but not clickable |

**Empty state:** If no levels exist → "No curriculum yet — ask your coach."

**Access control modes:**
- `OPEN`: All levels tappable
- `PROGRESSIVE`: Only the level matching current progress is unlocked; levels above show lock icon + title visible but tasks hidden

### 3.3 Level Detail — `/trainee/level/:id`

| Element | Details |
|---------|---------|
| Back button | Returns to levels home, preserves scroll |
| Level name | Header with level name |
| Level link | 44px ↗ button if `level.link` exists |
| Level progress | Numeric % + progress bar |

#### Step Cards (within level detail)

Each step is a **collapsible card**:

| Element | Source | Notes |
|---------|--------|-------|
| Step code badge | `stage.code` | Monospace, `dir="ltr"`, show `—` if null |
| Step name | `stage.name` → fallback to main task title → first task title | `dir="auto"` for RTL support |
| Priority tag | `stage.priorityStage.name` + `color` | Left border 4px in priority color. **Clickable** → shows popup with `name`, color swatch, `description` |
| Step % of level | `stage.weight / Σ(level.stages.weight) × 100` | e.g. "50% of Level" — computed, raw weight never shown |
| Step completion % | `stage.progressPercentage` *(new)* | Displayed inside a **progress ring/circle** |
| Resource link | `stage.link` | Small ↗ icon if link exists |
| Expand/collapse chevron | UI-only | Rotates on expand, `slideDown` animation |

**Empty state:** If level has no steps → "No steps yet" (dimmed, not clickable).

### 3.4 Tasks Checklist — Inside Expanded Step

**Hidden by default.** Revealed as a dropdown when the step card is clicked.

Task rows, sorted by: **isMain first (pinned top)**, then by `position`:

| Element | Source | Notes |
|---------|--------|-------|
| Main indicator | `stageTask.isMain` | ⭐ star icon on main task, dimmed star on others |
| Task name | `stageTask.task.title` | `dir="auto"` |
| Task % of step | `task.weight / Σ(step.tasks.weight) × 100` | Computed %, raw weight hidden from player |
| Check checkboxes | `task.checks[]` (dynamic `CheckDefinition`) | Each check: `[checkbox] checkName` |
| Task progress | `completedChecks / totalChecks × 100` | Thin progress bar + numeric % |
| Details button | Opens bottom-sheet/modal | Shows: description, link, full check list, progress |

**Filtering:** Hide tasks where `task.active = false`.

**Zero-check tasks:** Show "No checks — ask coach". Excluded from step % denominator.

**Empty state:** If step has no tasks → "No tasks assigned."

### 3.5 Task Details — Bottom Sheet (mobile) / Modal (desktop)

| Element | Source | Notes |
|---------|--------|-------|
| Task title | `task.title` | With ⭐ if isMain |
| Task progress | `completedChecks / totalChecks` | e.g. "2/4 checks — 50%" |
| Task % of step | Computed | "80% of Step" |
| Description | `task.description` | `dir="auto"`, full text (no clamp) |
| Resource link | `task.link` | Full-width "Open Resource ↗" button if link exists |
| Checks list | `task.checks[]` | Interactive checkboxes — same as inline but with check descriptions |

Desktop (≥768px): Centered modal, max-width 520px.
Mobile: Bottom-sheet with drag handle, max-height 85vh.

### 3.6 Priority Popup

Triggered by clicking the priority tag on a step card.

| Element | Source |
|---------|--------|
| Priority name | `priorityStage.name` |
| Color swatch | `priorityStage.color` |
| Description | `priorityStage.description` |

Style: Small popup/tooltip, not a full modal.

---

## 4. Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Simple & not crowded** | Only essential info visible. Details behind buttons/sheets. Generous whitespace. |
| **Elegant** | Smooth `slideDown` for task expand, ring animation on progress change, shimmer skeleton while loading |
| **Mobile-first** | 44px minimum touch targets, 360px base width |
| **RTL support** | `dir="auto"` on all names/descriptions, `dir="ltr"` on codes |
| **No raw weights** | Player only sees computed percentages |
| **Instant feedback** | Checkbox toggle < 50ms optimistic, background save |

---

## 5. Data Model — What the Player Needs

### 5.1 Entity Hierarchy

```
ROADMAP
  └── LEVEL
        └── ROADMAP_STAGE (= Step)
              ├── PRIORITY_STAGE (label)
              └── ROADMAP_STAGE_TASK
                    └── TASK
                          └── TaskCheckAssignment
                                └── CheckDefinition
                                      └── TraineeTaskCheckProgress (per trainee)
```

### 5.2 Progress System — Dynamic Checks Only

The player uses **dynamic `CheckDefinition`** per task, NOT the fixed 4-competency checkboxes.

**Progress formulas:**

```
task_%  = completed_checks / assigned_checks × 100
          (zero-check tasks EXCLUDED from step denominator)

step_%  = Σ(task.weight × task_fraction) / Σ(task.weight) × 100
          (only active tasks with ≥1 check)

level_% = Σ(step.weight × step_fraction) / Σ(step.weight) × 100

map_%   = Σ(level.weight × level_fraction) / Σ(level.weight) × 100
```

### 5.3 Key Data Rules

- `Task.active = false` → hidden from player, excluded from all calculations
- Tasks with 0 assigned checks → show "No checks — ask coach", excluded from step % denominator
- Step name fallback: `stage.name` → main task title → first task title
- Progress keyed by `trainee_id + task_id + check_definition_id` — step moves don't lose data

---

## 6. Backend Changes Required

### 6.1 DTO Changes

#### `TraineeLevelResponse` — Add Progress Fields

```java
// EXISTING fields: id, roadmapId, name, link, weight, position, stages
// ADD:
private BigDecimal progressPercentage;       // weighted aggregate of step progress
private int stepsCount;                       // total steps in this level
private String description;                   // if level description is added
```

#### `TraineeStageResponse` — Add Progress Fields

```java
// EXISTING fields: id, levelId, priorityStage, code, name, link, weight, position, tasks
// ADD:
private BigDecimal progressPercentage;        // weighted aggregate of task progress
private BigDecimal percentageOfLevel;         // this step's weight contribution to level
```

#### `TraineeStageTaskResponse` — Verify Check Data

```java
// EXISTING fields: id, stageId, task, position, isMain, progress
// progress.checks[] must contain dynamic CheckDefinition checks, NOT competency booleans
// VERIFY: progress.completedChecksCount and progress.totalChecksCount are populated
```

### 6.2 API Endpoints — Trainee

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/trainee/{traineeId}/roadmap` | Full hierarchy + progress (single call) | ✅ Exists — needs DTO enrichment |
| `GET` | `/api/v1/trainee/{traineeId}/roadmap/progress` | Overall roadmap progress summary | ✅ Exists |
| `PUT` | `/api/v1/trainee/{traineeId}/tasks/{taskId}/checks/{checkDefinitionId}` | Toggle a check `{completed: bool}` | ⚠️ Verify exists for dynamic checks |
| `GET` | `/api/v1/trainee/{traineeId}/tasks/{taskId}/progress` | Single task progress | ✅ Exists |

### 6.3 API Response Shape — `GET /trainee/{id}/roadmap`

```json
{
  "id": 1,
  "name": "Networking Fundamentals",
  "description": "...",
  "isActive": true,
  "progressSummary": {
    "traineeId": 42,
    "roadmapId": 1,
    "overallProgressPercentage": 38.50,
    "totalTasksCount": 24,
    "completedTasksCount": 8,
    "inProgressTasksCount": 4
  },
  "levels": [
    {
      "id": 1,
      "name": "Level 1 — Basics",
      "link": "https://...",
      "weight": 30.00,
      "position": 1,
      "progressPercentage": 45.00,
      "stepsCount": 4,
      "stages": [
        {
          "id": 10,
          "code": "SG1-001",
          "name": "Introduction",
          "link": "https://...",
          "weight": 20.00,
          "position": 1,
          "progressPercentage": 62.50,
          "percentageOfLevel": 33.33,
          "priorityStage": {
            "id": 1,
            "name": "Foundation",
            "color": "#22c55e",
            "description": "Core foundational skills"
          },
          "tasks": [
            {
              "id": 100,
              "stageId": 10,
              "position": 1,
              "isMain": true,
              "task": {
                "id": 5,
                "code": "T-001",
                "title": "Configure VLAN",
                "description": "Learn to configure VLANs...",
                "link": "https://...",
                "weight": 20.00,
                "active": true,
                "checks": [
                  { "id": 1, "name": "Knowledge", "description": "..." },
                  { "id": 2, "name": "Practice", "description": "..." },
                  { "id": 3, "name": "Pressure", "description": "..." },
                  { "id": 4, "name": "Application", "description": "..." }
                ]
              },
              "progress": {
                "taskId": 5,
                "completedChecksCount": 2,
                "totalChecksCount": 4,
                "progressPercentage": 50.00,
                "status": "IN_PROGRESS",
                "checks": [
                  { "checkDefinitionId": 1, "name": "Knowledge", "completed": true },
                  { "checkDefinitionId": 2, "name": "Practice", "completed": true },
                  { "checkDefinitionId": 3, "name": "Pressure", "completed": false },
                  { "checkDefinitionId": 4, "name": "Application", "completed": false }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 6.4 Backend Logic Changes

| Change | Details |
|--------|---------|
| **Compute `level.progressPercentage`** in `RoadmapService.getTraineeRoadmapHierarchy()` | Aggregate step progress using weighted formula |
| **Compute `stage.progressPercentage`** | Aggregate task progress using weighted formula, excluding zero-check tasks |
| **Compute `stage.percentageOfLevel`** | `stage.weight / Σ(sibling stages weight) × 100` |
| **Compute `level.stepsCount`** | `level.stages.size()` |
| **Filter inactive tasks** | Exclude `task.active = false` from the trainee response |
| **Zero-check task exclusion** | Tasks with 0 assigned checks excluded from step % denominator |
| **Access mode configuration** | New config field (roadmap-level or system-level): `accessMode = OPEN | PROGRESSIVE` |

---

## 7. Frontend Changes Required

### 7.1 New Components

| Component | Purpose |
|-----------|---------|
| `trainee-roadmap` (Levels Home) | Level cards grid/list |
| `level-detail` | Steps timeline within a level |
| `step-card` | Collapsible step with task dropdown |
| `task-row` | Task name + checks + progress |
| `task-detail-sheet` | Bottom-sheet/modal for task details |
| `progress-ring` | SVG ring component (reusable) |
| `progress-bar` | Thin bar component (reusable) |
| `priority-chip` | Clickable priority dot+name+popup |

### 7.2 New Service

`trainee-roadmap.service.ts`:

```typescript
// GET /api/v1/trainee/{traineeId}/roadmap
getTraineeRoadmap(traineeId: number): Observable<TraineeRoadmapResponse>

// PUT /api/v1/trainee/{traineeId}/tasks/{taskId}/checks/{checkDefId}
toggleCheck(traineeId: number, taskId: number, checkDefId: number, completed: boolean): Observable<CheckToggleResponse>
```

### 7.3 New TypeScript Interfaces

New file: `models/trainee.models.ts`

```typescript
export interface TraineeRoadmapResponse {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  levels: TraineeLevelResponse[];
  progressSummary: TraineeRoadmapProgressSummary;
}

export interface TraineeLevelResponse {
  id: number;
  name: string;
  link?: string;
  weight: number;
  position: number;
  progressPercentage: number;
  stepsCount: number;
  stages: TraineeStageResponse[];
}

export interface TraineeStageResponse {
  id: number;
  code?: string;
  name?: string;
  link?: string;
  weight: number;
  position: number;
  progressPercentage: number;
  percentageOfLevel: number;
  priorityStage: PriorityStageResponse | null;
  tasks: TraineeStageTaskResponse[];
}

export interface TraineeStageTaskResponse {
  id: number;
  stageId: number;
  position: number;
  isMain: boolean;
  task: TaskResponse;
  progress: TraineeTaskProgressResponse;
}

export interface TraineeTaskProgressResponse {
  taskId: number;
  completedChecksCount: number;
  totalChecksCount: number;
  progressPercentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  checks: TraineeCheckProgressResponse[];
}

export interface TraineeCheckProgressResponse {
  checkDefinitionId: number;
  name: string;
  description?: string;
  completed: boolean;
}

export interface TraineeRoadmapProgressSummary {
  traineeId: number;
  roadmapId: number;
  overallProgressPercentage: number;
  totalTasksCount: number;
  completedTasksCount: number;
  inProgressTasksCount: number;
}

export interface PriorityStageResponse {
  id: number;
  name: string;
  color?: string;
  description?: string;
}

export interface TaskResponse {
  id: number;
  code?: string;
  title: string;
  description?: string;
  link?: string;
  weight: number;
  active: boolean;
  checks: CheckDefinitionResponse[];
}

export interface CheckDefinitionResponse {
  id: number;
  name: string;
  description?: string;
}
```

### 7.4 Routes

```typescript
// Additive — does not touch existing /roadmap (coach builder)
{ path: 'trainee', component: TraineeRoadmapComponent },
{ path: 'trainee/level/:levelId', component: LevelDetailComponent }
```

### 7.5 Frontend Computed Values

These are derived client-side from the API response (no separate API call):

```typescript
// Step display name (fallback chain)
getStepDisplayName(stage: TraineeStageResponse): string {
  if (stage.name?.trim()) return stage.name;
  const mainTask = stage.tasks.find(t => t.isMain);
  if (mainTask) return mainTask.task.title;
  if (stage.tasks.length > 0) return stage.tasks[0].task.title;
  return 'Unnamed Step';
}

// Task % of step (weight contribution)
getTaskPercentOfStep(task: TraineeStageTaskResponse, allTasks: TraineeStageTaskResponse[]): number {
  const totalWeight = allTasks.reduce((sum, t) => sum + t.task.weight, 0);
  return totalWeight > 0 ? (task.task.weight / totalWeight) * 100 : 0;
}
```

---

## 8. Save & Optimistic Update Flow

```
1. Trainee toggles checkbox
2. UI instantly flips checkbox (< 50ms)
3. Recalculate task % → step % → level % → roadmap % client-side
4. Background PUT: /trainee/{id}/tasks/{taskId}/checks/{checkDefId} { completed: true/false }
5. Server responds with updated percentages
6. If success: silent (already up-to-date)
7. If failure: rollback checkbox + show toast "Save failed — retry"
```

No spinner, no blocking, no save button.

---

## 9. Access Control

### Configuration

A system-level or roadmap-level setting (decided by admin/trainer):

| Mode | Behavior |
|------|----------|
| `OPEN` | All levels are tappable and accessible |
| `PROGRESSIVE` | Only the level of current progress (and below) is unlocked. Levels above show: lock icon, title visible, tasks hidden, tooltip "Complete current level first" |

### Implementation Notes

- The access mode should be stored as a configuration value (e.g., `roadmap.accessMode`)
- The backend should include `accessMode` in the roadmap response
- Locked levels return structure data (name, position) but tasks/checks are omitted or marked locked
- Frontend renders lock icon + disables click for locked levels

---

## 10. Empty States

| Scenario | Message |
|----------|---------|
| No roadmap exists | "No curriculum yet — ask your coach." |
| Level has no steps | Dimmed card, lock icon, "No steps yet" |
| Step has no tasks | "No tasks assigned" |
| Task has no checks | "No checks — ask coach" (task excluded from step %) |
| All tasks inactive in a step | "No active tasks" |

---

## 11. Visual & Interaction Details

### Progress Bars Scale

| Level | Height | Color |
|-------|--------|-------|
| Roadmap (overall) | 10px | Green `#22c55e` |
| Level | 8px | Muted green |
| Step | 6px | Medium |
| Task | 4px | Thin |

All bars paired with numeric % (never bar-only).

### Animations

| Trigger | Animation |
|---------|-----------|
| Task dropdown expand/collapse | `slideDown` / `slideUp` 300ms ease |
| Progress ring change | Animate arc width, 400ms ease |
| Page load | Shimmer skeleton placeholder |
| Chevron on expand | Rotate 180° |

### Touch Targets

- Minimum 44×44px for all interactive elements
- Focus ring: 2px `#22c55e`
- `prefers-reduced-motion`: disable animations

### Typography (mobile baseline)

| Element | Size/Weight |
|---------|-------------|
| Roadmap name | 20px / 700 |
| Level name | 17px / 700 |
| Step name | 15px / 600 |
| Task title | 14px / 500 |
| Check label | 14px / 500 |
| Muted % text | 12px / 400 mono |
