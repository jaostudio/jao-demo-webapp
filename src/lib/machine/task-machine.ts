/**
 * Local TaskMachine — not imported from @jaostudio/core.
 *
 * Validates that app-owned state machines coexist cleanly with shared
 * domain machines from the platform.
 */

export type TaskState = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'

export type TaskEvent = 'start' | 'progress' | 'review' | 'complete' | 'reopen' | 'reset'

export type TaskActor = 'member' | 'admin' | 'owner' | 'system' | 'viewer'

export interface TaskContext {
  actor: TaskActor
  isAssignee: boolean
}

const transitions: Record<TaskState, Partial<Record<TaskEvent, TaskState>>> = {
  backlog:     { start: 'todo' },
  todo:        { start: 'in_progress' },
  in_progress: { review: 'in_review', reset: 'todo' },
  in_review:   { complete: 'done', reset: 'in_progress' },
  done:        { reopen: 'in_review', reset: 'todo' },
}

const guards: Array<{ event: TaskEvent; check: (ctx: TaskContext) => boolean }> = [
  { event: 'start',    check: (ctx) => ctx.actor !== 'viewer' },
  { event: 'progress', check: (ctx) => ctx.actor !== 'viewer' },
  { event: 'review',   check: (ctx) => ctx.isAssignee || ctx.actor === 'owner' || ctx.actor === 'admin' },
  { event: 'complete', check: (ctx) => ctx.isAssignee || ctx.actor === 'owner' || ctx.actor === 'admin' },
  { event: 'reopen',   check: (ctx) => ctx.actor === 'owner' || ctx.actor === 'admin' || ctx.actor === 'system' },
  { event: 'reset',    check: (ctx) => ctx.actor === 'owner' || ctx.actor === 'admin' || ctx.actor === 'system' },
]

export function transitionTask(
  state: TaskState,
  event: TaskEvent,
  context: TaskContext
): TaskState {
  const guard = guards.find((g) => g.event === event)
  if (guard && !guard.check(context)) return state

  const next = transitions[state]?.[event]
  return next ?? state
}

export function canTransitionTask(state: TaskState, event: TaskEvent, context: TaskContext): boolean {
  return transitionTask(state, event, context) !== state
}

export function getValidTransitions(state: TaskState): TaskEvent[] {
  return Object.keys(transitions[state] ?? {}) as TaskEvent[]
}
