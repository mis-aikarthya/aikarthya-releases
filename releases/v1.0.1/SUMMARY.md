# Aikarthya Field Ops v1.0.1 — Summary

## What's New
- (No new features in this patch release)

## Fixes
- Android camera permission restored and unnecessary storage permissions removed
- Draft schools no longer appear in a PF's "My Schools" list until the profile is actually submitted
- Observation form now correctly mirrors `started_at` to the cloud database
- Observation sync failures now surface properly instead of being silently swallowed

## Database Changes
- 24 migrations deployed since v1.0.0 (key: app_versions table, cascade lifecycle triggers, PF school insert policies, Forms v3 schema completion)

## Tests
- 257 passing, 0 failing
- `flutter analyze`: 0 errors, 0 warnings
