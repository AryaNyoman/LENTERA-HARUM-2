# Redesign Dashboard Admin

## Purpose

Redesign the `/admin` account-management page so an administrator can scan account totals, sync status, account states, and actions quickly on desktop and mobile. Existing server actions, data queries, routes, and account-management behavior remain unchanged.

## Design Direction

Use a compact operational dashboard. Keep the SIMPUS-POSYANDU teal identity and prioritize readable information over decorative treatment. The layout should feel appropriate for recurring administrative work.

## Layout

1. Keep the existing authenticated header and navigation treatment.
2. Add a page heading and short supporting description.
3. Place three account summary tiles directly below the heading: Kader, Orang tua, and Admin.
4. Surface SIMPUS sync status and its primary action before account creation and account lists.
5. Keep the create-kader form as a distinct operational section.
6. Render Kader, Orang tua, and Admin lists as consistent account rows with identity, state, relevant metadata, and available actions.

## Visual Tokens

Use existing global tokens where possible:

| Purpose | Token | Value |
| --- | --- | --- |
| Primary identity and actions | `--teal` | `#2e9e8f` |
| Strong headings and header | `--teal-tua` | `#22766b` |
| Soft selected or success surface | `--teal-muda` | `#e3f3f0` |
| Page background | `--bg` | `#f2f8f6` |
| Content surface | `--kartu` | `#ffffff` |
| Main and supporting text | `--teks`, `--teks-sekunder` | existing values |
| Borders | `--garis` | `#dce8e5` |
| Warning and inactive state | `--merah`, red tint | existing values |

Use coral only as a secondary accent when it adds meaning. Do not introduce gradients, decorative illustrations, or new brand colors.

## Typography And Components

- Retain the existing system font stack.
- Use a clear hierarchy: page title, section title, account name, metadata, then helper text.
- Summary tile: label, prominent count, brief explanation.
- Sync panel: status message, last-sync timestamp, and the existing `Tarik sekarang` action.
- Account row: name, username, inactive or temporary-password state, relevant detail, reset-password action when available, and active-state toggle.
- Status labels must use text and color together so status is not communicated by color alone.

## Responsive Behavior

- Desktop: content remains centered and compact; the three summary tiles share a row; account actions align to the right.
- Tablet: summary tiles may keep a row when space allows; account metadata can wrap without truncating the action controls.
- Mobile: summary tiles stack; sync action and account actions move below their related information when necessary; form controls use the available width; rows preserve readable wrapping rather than forcing horizontal scrolling.

## Implementation Scope

Modify the `/admin` presentation layer and any small presentational components needed for it. Preserve the current Prisma queries and these server actions: `tarikSimpus`, `setAktif`, account reset, and kader creation. No database, route, authorization, or API changes are planned.

## Validation

- Add or update focused tests only when the project test setup can exercise the changed UI behavior.
- Run lint, tests, and production build.
- Inspect `/admin` at desktop and mobile viewport sizes after implementation.
- Confirm existing sync, create-kader, reset-password, and active-state actions remain available.

## Figma Deliverable

Create an editable Figma file containing an `/admin` desktop frame and a mobile frame. The design must use the tokens and responsive rules described above, and it must be the visual reference for the implementation.
