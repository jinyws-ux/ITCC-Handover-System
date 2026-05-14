# ITCC Handover System Roadmap

## Product direction

The system is an operations handover aggregation platform. It should not replace Helix, Jira, Outlook, or AG systems. Its job is to create one internal TASK view that links all related sources and makes shift handover reliable.

## Phase 1: Project scaffold

Goal: make the repository runnable.

Deliverables:

- Flask backend scaffold.
- React + TypeScript + Vite frontend scaffold.
- Tailwind-based UI foundation.
- Mock dashboard data.
- Basic documentation.

## Phase 2: Backend domain model

Goal: build the database foundation.

Tables:

- User
- Group
- Shift
- Schedule
- Task
- TaskExternalLink
- TaskLog
- Handover
- HypercareCheck
- Attachment
- Factory
- System

Deliverables:

- SQLAlchemy models.
- SQLite database initialization.
- Seed data for admin, users, groups, shifts, factories, systems, and sample tasks.
- Service layer stubs for Helix, Jira, and Outlook.

## Phase 3: Authentication and roles

Roles:

- user
- lead
- admin

Deliverables:

- Login API.
- Logout API.
- Current user API.
- Frontend login page.
- Protected layout.
- Admin route protection.

## Phase 4: Handover dashboard

Dashboard sections:

- Waiting for next shift
- Monitoring
- Notice only
- Today Hypercare
- Need my acknowledgement or acceptance
- Recently updated

Important UX points:

- E → D1 handover must be visually obvious.
- High and Critical INC must be obvious.
- Monitoring items must not be buried.
- TASK cards must show external link indicators for Helix, Jira, Outlook, and AG.

## Phase 5: TASK creation and detail

Deliverables:

- Create TASK page.
- TASK detail aggregation page.
- Add process log.
- Add external links.
- Add handover record.
- Acknowledge handover.
- Accept handover.
- Close TASK.
- Add AG ticket link to WO or INC.

## Phase 6: Timeline

Deliverables:

- Search historical TASKs.
- Filters for type, priority, status, source, factory, system, shift, group, external links, monitoring, and date ranges.
- Pagination.
- Compact results list.

## Phase 7: Calendar and schedule

Deliverables:

- Monthly calendar.
- D1/D2/E daily schedule.
- E shift daily custom time.
- Daily Hypercare count.
- Daily important handover count.
- Admin edit schedule.

## Phase 8: Admin and Excel import

Deliverables:

- User management.
- Group management.
- Shift management.
- Factory management.
- System management.
- Excel schedule import preview.
- Excel import confirmation.

## Phase 9: Real integrations

Integrations should be added after the manual workflow is stable.

Planned services:

- Helix read-only fetch by ticket number.
- Jira read-only fetch by issue key.
- Outlook mail link metadata extraction.
- Optional shared mailbox import.

Do not implement write-back to Helix or Jira until the core handover workflow is proven stable.
