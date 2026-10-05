# Coach Review — Open Questions & Decisions (V1 Locked)

> Date: 2026-10-05
> Status: **Decided by Coach/Captain — Ready for implementation**

## Decision summary

| # | Question | Decision | Notes |
|---|----------|----------|-------|
| 1 | Zero-check Task: exclude from Step % or 0%? | **exclude** | Zero-check tasks ignored in denominator |
| 2 | Save: instant per-check vs draft + Save bar? Rate limit? | **instant per-check, natural feel — NO blocking throttle** | Optimistic UI, background coalescing only |
| 3 | Show % of parent to trainee or bars only? | **A — Show % + bar** | Agreed |
| 4 | MAIN: pin top + gold or badge only? | **Pin top, NO distinct color + MAIN as Step title fallback** | Two functions, see section 4 |
| 5 | Free access V1 or sequential unlock? | **Configurable by Captain (3 options)** | Default `open`, see section 5 |
| 6 | Checks any order or listed order? | **any order** | No order enforcement |
| 7 | Arabic auto-dir per string or fixed RTL desc + LTR codes? | **A — `dir="auto"` per string** | Agreed |

Hierarchy: `Grade > Section > Level > Step (Stage) > Task`

---

### 1. Zero-check Task — `exclude`

**Decision: exclude.**

If a Task has 0 checks (Learning / Developed / Skilled all unticked), it does NOT count in Step % denominator.

Example: Step has 4 Tasks, 1 has zero-check:
- `Step % = completed / 3`, not `/4`.

Rationale: prevents empty/draft tasks dragging % down. Matches `roadmap.data.ts` where placeholder steps like `SG1-023-J: ""` exist.

Implementation: filter `tasks.filter(t => totalChecks > 0)` before % calc in `getGradeProgress()` / step % helper.

### 2. Save — instant per-check (natural, no artificial slowness)

**Decision: instant. No Draft + Save bar.**

Each checkbox click = immediate optimistic UI + background `PATCH` to Supabase. Toast + rollback only on fail.

**Coach constraint (important):**
> `I don't recommend 2 sec per user client-side because it makes the roadmap feel slow and unnatural.`

So: **NO `1 request / 2 sec` UI lock, NO button disable, NO spinner blocking.**
Recommended rate-limit that still feels instant:

1. **Perceived latency = 0ms** — checkbox flips in <50ms locally, always.
2. **Invisible coalescing only** — trailing debounce 500-700ms per Step to merge bursts (2 fast ticks = 1 PATCH). Background only, never blocks. Keep merging if user keeps clicking.
3. **Keep quantity rule** — validateUpdate() in core/roadmap/roadmap.service.ts: max 2 forward boxes per PATCH, uncheck = free, getStepDistance() counts forward only.
4. **Abuse guard server-side only** — e.g. max 20-30 saves / day / player (Supabase RLS / Edge Function). Message only on abuse: Daily limit reached, try tomorrow.
5. **Fix existing bug** — roadmap.service.ts comment says 3 Updates / 5 Days but code checks >=50. Align to 3 forward updates / 5-day cycle OR daily cap. Confirm with Captain. Do NOT enforce >=50.

Will NOT do: throttle that drops clicks, disabled checkbox while saving, save bar.

### 3. Show % of parent — Option A agreed

Decision: A — Show % + bar. Parent = direct container above current view.

Example: Level 3 - Ground [42%], Step SG1-024 [38%] + bar, then Tasks.

- A (chosen): numeric % next to bar at Step + Level + Grade. Data already via getGradeProgress() in core/roadmap/roadmap.service.ts:195.
- B (rejected): bars only — too vague for grading (38%, 40% in roadmap.data.ts matter).

### 4. MAIN — pin top, no gold, Step title fallback

Coach note: MAIN has two functions, pin on top without distinct color, and use as step title if step has no title.

Function 1 — order on top, same style:
- Display-sort isMain first in trainee + builder. Same card style, NO gold. Keep star + MAIN badge (builder html:326,340).
- position in DB unchanged; sort display-only. Cross-step move resets isMain=false (builder ts:561). Max 1 MAIN per Step.

Function 2 — Step title fallback:
- If stage.name / stepName blank (e.g. SG1-023-J = ""), display title = MAIN task title.
- Logic: displayStepName = stage.name?.trim() ? stage.name : mainTask?.title ?? 'Unnamed Step'. Display-only, no DB overwrite.
- If no MAIN and no name: keep Unnamed Step (builder html:234-235).

### 5. Access — configurable by Captain (3 options)

Add roadmap.accessMode (coach-only, default open):

1. open — All open free access. Any Grade/Level/Step openable.
2. level-locked — Limited to player level. Player Level 2 sees L1-L2, L3+ locked with lock icon.
3. lookahead — Limited steps ahead. N = 1-5, default N=2. If maxProgress = SG1-024, visible up to SG1-026, rest locked with tooltip.

Builder: dropdown in header + N stepper (only for lookahead). Trainee: locked cards show lock, title visible, tasks hidden. No forced sequential in V1.

### 6. Check order — any order

Trainee can tick Skilled before Learning, Task 3 before Task 1. No enforcement. getStepDistance() counts forward only; uncheck free.

### 7. Arabic dir — Option A agreed

Decision: A — dir=auto per string. Arabic desc renders RTL, code SG1-023-G / 38% renders LTR, mixed stays correct without bdi everywhere.

Implementation: dir=auto on name/desc, dir=ltr on code badges. Rejected fixed RTL desc + LTR codes (breaks on English desc, needs 2 classes).

### Checklist

- Step %: exclude zero-check from denominator.
- Save: instant optimistic + 500-700ms background coalesce, no UI lock; keep max-2 rule; fix >=50 bug; server daily cap 20-30.
- Headers: % + bar for Step/Level/Grade.
- MAIN: sort isMain first, no gold, title fallback.
- Access: accessMode + N + builder dropdown + trainee lock.
- Order: any order. Dir: dir=auto.