# PF SLA Compliance Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Download SLA Report" button to the Management Console PF profile page that generates a one-page PDF of that PF's SLA compliance, computed purely from database data (no AI).

**Architecture:** A pure top-level function `computePfSlaReport(...)` holds ALL SLA threshold logic and is unit-tested in isolation. A thin `pfSlaReportProvider` family does the Supabase I/O and delegates to it. `SlaReportPdfBuilder.build()` turns the resulting `PfSlaReport` model into PDF bytes with Syncfusion. A new `sharePdfBytes()` helper reuses the existing cross-platform download path. The button wires these together.

**Tech Stack:** Flutter, Riverpod (`FutureProvider.family`), Supabase (`supabase_flutter`), `syncfusion_flutter_pdf`, `intl` for date formatting.

## Global Constraints

- **PDF engine:** `syncfusion_flutter_pdf` only (reuses the existing Syncfusion license). Do NOT add `pdf`/`printing`.
- **SLA universe:** submitted observations only (`observations.status = 'submitted'`). Drafts never count.
- **t0 (SLA clock start):** `(obs_date + COALESCE(end_time,'18:00'))` interpreted as **IST (+05:30)**, converted to a UTC instant for comparison.
- **Thresholds:** generation compliant if `completed_at ≤ t0 + 24h`; share compliant if earliest `shared_at ≤ t0 + 72h`. Headline = share within 72h.
- **Cycle scope:** respect the PF profile's selected cycle; null cycle = all cycles.
- **Layout:** Pending PF Review table is rendered ABOVE SLA Breaches. Breach + pending tables include Teacher and Cycle columns. Breach list is shown in FULL (no truncation). No "No AI" / "drafts excluded" labels.
- **Percentages with a 0 denominator render as `—`, never `0%` or a divide error.**
- **Determinism for tests:** the "as of" timestamp is an injected parameter of `computePfSlaReport`, never `DateTime.now()` inside the pure function.
- **All commands run from** `aikarthya-field-ops-app/` (the Flutter package root).

---

### Task 1: Data model + dependency

**Files:**
- Modify: `aikarthya-field-ops-app/pubspec.yaml` (dependencies block, after line 51)
- Create: `aikarthya-field-ops-app/lib/features/mgmt/models/pf_sla_report.dart`
- Test: `aikarthya-field-ops-app/test/features/mgmt/pf_sla_report_model_test.dart`

**Interfaces:**
- Produces: `PfSlaReport`, `SlaSchoolRow`, `SlaBreachRow`, `SlaPendingRow` (immutable data classes, all fields `final`, `const` constructors). Field names below are relied on by Tasks 2, 3, and 4 verbatim.

- [ ] **Step 1: Add the Syncfusion PDF dependency**

In `pubspec.yaml`, directly after the line `  syncfusion_flutter_pdfviewer: ^29.1.33` (line 51), add:

```yaml
  syncfusion_flutter_pdf: ^29.1.33
```

- [ ] **Step 2: Fetch packages**

Run: `cd aikarthya-field-ops-app && flutter pub get`
Expected: completes with `Got dependencies!` (or `Changed N dependencies!`), no version-solve error.

- [ ] **Step 3: Write the failing model test**

Create `test/features/mgmt/pf_sla_report_model_test.dart`:

```dart
import 'package:aikarthya_field_ops/features/mgmt/models/pf_sla_report.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('PfSlaReport holds its fields', () {
    final report = PfSlaReport(
      pfName: 'Janhvi Mishra',
      cycleId: null,
      generatedAt: DateTime.utc(2026, 6, 30),
      windowStart: DateTime.utc(2026, 6, 17),
      windowEnd: DateTime.utc(2026, 6, 25),
      submittedObs: 21,
      reportsGenerated: 21,
      genSlaPct: 9.5,
      shareSlaPct: 0,
      pendingCount: 3,
      schools: const [
        SlaSchoolRow(
          school: 'Grace Model School',
          obs: 6,
          from: null,
          to: null,
          genOnTime: 0,
          shareOnTime: 0,
          pending: 0,
        ),
      ],
      breaches: const [],
      pending: const [],
    );

    expect(report.submittedObs, 21);
    expect(report.schools.single.school, 'Grace Model School');
    expect(report.genSlaPct, 9.5);
  });
}
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/pf_sla_report_model_test.dart`
Expected: FAIL — `Error: Couldn't resolve the package 'aikarthya_field_ops' ... pf_sla_report.dart` / "PfSlaReport isn't defined".

- [ ] **Step 5: Create the model file**

Create `lib/features/mgmt/models/pf_sla_report.dart`:

```dart
/// One PF's SLA compliance report, fully computed (no AI). Produced by
/// `computePfSlaReport` and consumed by `SlaReportPdfBuilder`.
class PfSlaReport {
  const PfSlaReport({
    required this.pfName,
    required this.cycleId,
    required this.generatedAt,
    required this.windowStart,
    required this.windowEnd,
    required this.submittedObs,
    required this.reportsGenerated,
    required this.genSlaPct,
    required this.shareSlaPct,
    required this.pendingCount,
    required this.schools,
    required this.breaches,
    required this.pending,
  });

  final String pfName;
  final int? cycleId;
  final DateTime generatedAt;

  /// Earliest / latest observation date in scope (null when no observations).
  final DateTime? windowStart;
  final DateTime? windowEnd;

  final int submittedObs;
  final int reportsGenerated;

  /// Generation SLA % = generated within 24h / submittedObs * 100.
  /// `null` when submittedObs == 0 (render as "—").
  final double? genSlaPct;

  /// Share SLA % = shared within 72h / submittedObs * 100.
  /// `null` when submittedObs == 0 (render as "—").
  final double? shareSlaPct;

  final int pendingCount;
  final List<SlaSchoolRow> schools;
  final List<SlaBreachRow> breaches;
  final List<SlaPendingRow> pending;
}

/// One per-school summary row.
class SlaSchoolRow {
  const SlaSchoolRow({
    required this.school,
    required this.obs,
    required this.from,
    required this.to,
    required this.genOnTime,
    required this.shareOnTime,
    required this.pending,
  });

  final String school;
  final int obs;
  final DateTime? from;
  final DateTime? to;
  final int genOnTime;
  final int shareOnTime;
  final int pending;
}

/// One breached observation (report shared after the 72h SLA).
class SlaBreachRow {
  const SlaBreachRow({
    required this.school,
    required this.teacher,
    required this.cycle,
    required this.obsDate,
    required this.generated,
    required this.shared,
    required this.breachPhase,
    required this.obsToShareDays,
  });

  final String school;
  final String teacher;
  final int? cycle;
  final DateTime obsDate;
  final DateTime? generated;
  final DateTime shared;

  /// Human label, e.g. "Share >72h".
  final String breachPhase;
  final double obsToShareDays;
}

/// One generated-but-not-shared observation awaiting the PF's approval/share.
class SlaPendingRow {
  const SlaPendingRow({
    required this.school,
    required this.teacher,
    required this.cycle,
    required this.obsDate,
    required this.generated,
    required this.status,
    required this.daysOverdue,
  });

  final String school;
  final String teacher;
  final int? cycle;
  final DateTime obsDate;
  final DateTime? generated;
  final String status;

  /// Whole days from t0 to the report's generation timestamp (asOf).
  final int daysOverdue;
}
```

Note: `genSlaPct`/`shareSlaPct` are nullable (`double?`) — the test in Step 3 passes non-null values, which is still valid. Update the test's expectation `expect(report.genSlaPct, 9.5)` stays correct.

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/pf_sla_report_model_test.dart`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add aikarthya-field-ops-app/pubspec.yaml aikarthya-field-ops-app/pubspec.lock aikarthya-field-ops-app/lib/features/mgmt/models/pf_sla_report.dart aikarthya-field-ops-app/test/features/mgmt/pf_sla_report_model_test.dart
git commit -m "feat(mgmt): add PfSlaReport model + syncfusion_flutter_pdf dep"
```

---

### Task 2: Pure SLA compute function

This is the core. It holds every threshold and produces the model. It takes already-fetched, obs-id-keyed inputs so it stays pure and fully unit-testable.

**Files:**
- Create: `aikarthya-field-ops-app/lib/features/mgmt/providers/pf_sla_report_provider.dart` (compute function + helpers only in this task; the provider itself is Task 3)
- Test: `aikarthya-field-ops-app/test/features/mgmt/sla_report_logic_test.dart`

**Interfaces:**
- Consumes: `PfSlaReport` and row classes from Task 1.
- Produces:
  - `DateTime slaClockStartUtc(DateTime obsDate, String? endTime)` — returns t0 as a UTC instant.
  - `typedef SlaObsInput = ({String id, String schoolId, String? teacherId, int? cycle, DateTime? obsDate, String? endTime});`
  - `typedef SlaJobInput = ({String obsId, String? status, DateTime? completedAt});`
  - `PfSlaReport computePfSlaReport({required String pfName, required int? cycleId, required List<SlaObsInput> observations, required List<SlaJobInput> jobs, required Map<String, DateTime> earliestShareByObsId, required Set<String> approvedObsIds, required Map<String, String> schoolNames, required Map<String, String> teacherNames, required DateTime asOf})`

- [ ] **Step 1: Write the failing logic tests**

Create `test/features/mgmt/sla_report_logic_test.dart`:

```dart
import 'package:aikarthya_field_ops/features/mgmt/providers/pf_sla_report_provider.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('slaClockStartUtc', () {
    test('uses end_time as IST wall clock converted to UTC', () {
      // 18 Jun 18:00 IST == 18 Jun 12:30 UTC.
      final t0 = slaClockStartUtc(DateTime.utc(2026, 6, 18), '18:00');
      expect(t0, DateTime.utc(2026, 6, 18, 12, 30));
    });

    test('defaults to 18:00 IST when end_time is null', () {
      final t0 = slaClockStartUtc(DateTime.utc(2026, 6, 18), null);
      expect(t0, DateTime.utc(2026, 6, 18, 12, 30));
    });

    test('accepts HH:mm:ss', () {
      final t0 = slaClockStartUtc(DateTime.utc(2026, 6, 18), '09:30:00');
      // 09:30 IST == 04:00 UTC.
      expect(t0, DateTime.utc(2026, 6, 18, 4, 0));
    });
  });

  group('computePfSlaReport', () {
    SlaObsInput obs(String id, {int? cycle = 1, String? endTime = '18:00'}) => (
          id: id,
          schoolId: 'sch1',
          teacherId: 't1',
          cycle: cycle,
          obsDate: DateTime.utc(2026, 6, 18),
          endTime: endTime,
        );

    test('drafts are not passed in; empty input yields zeros and null pcts', () {
      final r = computePfSlaReport(
        pfName: 'PF',
        cycleId: null,
        observations: const [],
        jobs: const [],
        earliestShareByObsId: const {},
        approvedObsIds: const {},
        schoolNames: const {},
        teacherNames: const {},
        asOf: DateTime.utc(2026, 6, 30),
      );
      expect(r.submittedObs, 0);
      expect(r.reportsGenerated, 0);
      expect(r.genSlaPct, isNull);
      expect(r.shareSlaPct, isNull);
      expect(r.schools, isEmpty);
    });

    test('shared within 72h counts as on-time, no breach', () {
      // t0 = 18 Jun 12:30 UTC. +72h = 21 Jun 12:30 UTC.
      final r = computePfSlaReport(
        pfName: 'PF',
        cycleId: null,
        observations: [obs('o1')],
        jobs: [(obsId: 'o1', status: 'released', completedAt: DateTime.utc(2026, 6, 19))],
        earliestShareByObsId: {'o1': DateTime.utc(2026, 6, 20)},
        approvedObsIds: const {'o1'},
        schoolNames: const {'sch1': 'Grace'},
        teacherNames: const {'t1': 'Asfia'},
        asOf: DateTime.utc(2026, 6, 30),
      );
      expect(r.submittedObs, 1);
      expect(r.shareSlaPct, 100);
      expect(r.breaches, isEmpty);
      expect(r.pending, isEmpty);
    });

    test('shared after 72h is a breach with obs->share days', () {
      final r = computePfSlaReport(
        pfName: 'PF',
        cycleId: null,
        observations: [obs('o1')],
        jobs: [(obsId: 'o1', status: 'released', completedAt: DateTime.utc(2026, 6, 25))],
        earliestShareByObsId: {'o1': DateTime.utc(2026, 6, 27, 12, 30)},
        approvedObsIds: const {'o1'},
        schoolNames: const {'sch1': 'Grace'},
        teacherNames: const {'t1': 'Asfia'},
        asOf: DateTime.utc(2026, 6, 30),
      );
      expect(r.shareSlaPct, 0);
      expect(r.breaches.single.breachPhase, 'Share >72h');
      // 18 Jun 12:30 -> 27 Jun 12:30 == 9.0 days.
      expect(r.breaches.single.obsToShareDays, closeTo(9.0, 0.05));
      expect(r.breaches.single.teacher, 'Asfia');
      expect(r.breaches.single.cycle, 1);
    });

    test('generated but not shared is pending, not a breach', () {
      final r = computePfSlaReport(
        pfName: 'PF',
        cycleId: null,
        observations: [obs('o1')],
        jobs: [(obsId: 'o1', status: 'pf_review', completedAt: DateTime.utc(2026, 6, 25))],
        earliestShareByObsId: const {},
        approvedObsIds: const {},
        schoolNames: const {'sch1': 'Adarsh'},
        teacherNames: const {'t1': 'Dheeraj'},
        asOf: DateTime.utc(2026, 6, 30, 12, 30),
      );
      expect(r.pendingCount, 1);
      expect(r.breaches, isEmpty);
      expect(r.pending.single.status, 'pf_review');
      // t0 18 Jun 12:30 -> asOf 30 Jun 12:30 == 12 days.
      expect(r.pending.single.daysOverdue, 12);
    });

    test('generation SLA: completed within 24h counts on-time', () {
      // t0 = 18 Jun 12:30 UTC. +24h = 19 Jun 12:30 UTC.
      final r = computePfSlaReport(
        pfName: 'PF',
        cycleId: null,
        observations: [obs('o1'), obs('o2')],
        jobs: [
          (obsId: 'o1', status: 'released', completedAt: DateTime.utc(2026, 6, 19)),
          (obsId: 'o2', status: 'released', completedAt: DateTime.utc(2026, 6, 25)),
        ],
        earliestShareByObsId: const {},
        approvedObsIds: const {},
        schoolNames: const {'sch1': 'Grace'},
        teacherNames: const {'t1': 'Asfia'},
        asOf: DateTime.utc(2026, 6, 30),
      );
      expect(r.reportsGenerated, 2);
      expect(r.genSlaPct, 50); // o1 on-time, o2 late.
      expect(r.schools.single.genOnTime, 1);
      expect(r.schools.single.obs, 2);
    });

    test('breaches sorted by obs->share days descending', () {
      final r = computePfSlaReport(
        pfName: 'PF',
        cycleId: null,
        observations: [obs('o1'), obs('o2')],
        jobs: [
          (obsId: 'o1', status: 'released', completedAt: DateTime.utc(2026, 6, 22)),
          (obsId: 'o2', status: 'released', completedAt: DateTime.utc(2026, 6, 22)),
        ],
        earliestShareByObsId: {
          'o1': DateTime.utc(2026, 6, 25),
          'o2': DateTime.utc(2026, 6, 27),
        },
        approvedObsIds: const {'o1', 'o2'},
        schoolNames: const {'sch1': 'Grace'},
        teacherNames: const {'t1': 'Asfia'},
        asOf: DateTime.utc(2026, 6, 30),
      );
      expect(r.breaches.first.obsToShareDays, greaterThan(r.breaches.last.obsToShareDays));
    });
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/sla_report_logic_test.dart`
Expected: FAIL — "computePfSlaReport isn't defined" / "slaClockStartUtc isn't defined".

- [ ] **Step 3: Implement the compute function**

Create `lib/features/mgmt/providers/pf_sla_report_provider.dart` with ONLY the helpers + compute function for now (the `pfSlaReportProvider` is added in Task 3):

```dart
import 'package:aikarthya_field_ops/features/mgmt/models/pf_sla_report.dart';

/// SLA clock start: (obs_date + end_time) as IST wall time, returned as a UTC
/// instant. end_time defaults to 18:00. Accepts "HH:mm" or "HH:mm:ss".
DateTime slaClockStartUtc(DateTime obsDate, String? endTime) {
  final raw = (endTime == null || endTime.trim().isEmpty) ? '18:00' : endTime;
  final parts = raw.split(':');
  final h = int.parse(parts[0]);
  final m = parts.length > 1 ? int.parse(parts[1]) : 0;
  final istWall = DateTime.utc(obsDate.year, obsDate.month, obsDate.day, h, m);
  return istWall.subtract(const Duration(hours: 5, minutes: 30));
}

typedef SlaObsInput = ({
  String id,
  String schoolId,
  String? teacherId,
  int? cycle,
  DateTime? obsDate,
  String? endTime,
});

typedef SlaJobInput = ({
  String obsId,
  String? status,
  DateTime? completedAt,
});

const Duration _genSla = Duration(hours: 24);
const Duration _shareSla = Duration(hours: 72);

/// Pure SLA computation. Inputs are already obs-id-keyed and draft-free.
/// [asOf] is the report generation time (injected for determinism).
PfSlaReport computePfSlaReport({
  required String pfName,
  required int? cycleId,
  required List<SlaObsInput> observations,
  required List<SlaJobInput> jobs,
  required Map<String, DateTime> earliestShareByObsId,
  required Set<String> approvedObsIds,
  required Map<String, String> schoolNames,
  required Map<String, String> teacherNames,
  required DateTime asOf,
}) {
  final completedByObsId = <String, DateTime>{};
  final statusByObsId = <String, String?>{};
  for (final j in jobs) {
    statusByObsId[j.obsId] = j.status;
    if (j.completedAt != null) completedByObsId[j.obsId] = j.completedAt!;
  }

  final breaches = <SlaBreachRow>[];
  final pending = <SlaPendingRow>[];

  // Per-school accumulators.
  final schoolObs = <String, int>{};
  final schoolGenOnTime = <String, int>{};
  final schoolShareOnTime = <String, int>{};
  final schoolPending = <String, int>{};
  final schoolFrom = <String, DateTime>{};
  final schoolTo = <String, DateTime>{};

  var reportsGenerated = 0;
  var genOnTimeTotal = 0;
  var shareOnTimeTotal = 0;
  DateTime? windowStart;
  DateTime? windowEnd;

  for (final o in observations) {
    final obsDate = o.obsDate;
    final schoolName = schoolNames[o.schoolId] ?? '—';
    final teacherName =
        o.teacherId == null ? '—' : (teacherNames[o.teacherId!] ?? '—');

    schoolObs[schoolName] = (schoolObs[schoolName] ?? 0) + 1;

    if (obsDate != null) {
      windowStart = windowStart == null || obsDate.isBefore(windowStart)
          ? obsDate
          : windowStart;
      windowEnd =
          windowEnd == null || obsDate.isAfter(windowEnd) ? obsDate : windowEnd;
      final sf = schoolFrom[schoolName];
      final st = schoolTo[schoolName];
      schoolFrom[schoolName] =
          sf == null || obsDate.isBefore(sf) ? obsDate : sf;
      schoolTo[schoolName] = st == null || obsDate.isAfter(st) ? obsDate : st;
    }

    final t0 = obsDate == null ? null : slaClockStartUtc(obsDate, o.endTime);
    final completedAt = completedByObsId[o.id];
    final share = earliestShareByObsId[o.id];

    if (completedAt != null) reportsGenerated++;

    // Generation SLA.
    if (completedAt != null && t0 != null) {
      final onTime = !completedAt.isAfter(t0.add(_genSla));
      if (onTime) {
        genOnTimeTotal++;
        schoolGenOnTime[schoolName] = (schoolGenOnTime[schoolName] ?? 0) + 1;
      }
    }

    // Resolve state: shared -> breach-or-ontime; else generated -> pending.
    if (share != null && t0 != null) {
      final shareOnTime = !share.isAfter(t0.add(_shareSla));
      if (shareOnTime) {
        shareOnTimeTotal++;
        schoolShareOnTime[schoolName] =
            (schoolShareOnTime[schoolName] ?? 0) + 1;
      } else {
        breaches.add(
          SlaBreachRow(
            school: schoolName,
            teacher: teacherName,
            cycle: o.cycle,
            obsDate: obsDate!,
            generated: completedAt,
            shared: share,
            breachPhase: 'Share >72h',
            obsToShareDays: share.difference(t0).inMinutes / 1440.0,
          ),
        );
      }
    } else if (completedAt != null) {
      // Generated, not shared -> pending PF review.
      schoolPending[schoolName] = (schoolPending[schoolName] ?? 0) + 1;
      final overdue =
          t0 == null ? 0 : (asOf.difference(t0).inMinutes / 1440.0).round();
      pending.add(
        SlaPendingRow(
          school: schoolName,
          teacher: teacherName,
          cycle: o.cycle,
          obsDate: obsDate ?? asOf,
          generated: completedAt,
          status: statusByObsId[o.id] ?? 'pf_review',
          daysOverdue: overdue,
        ),
      );
    }
  }

  breaches.sort((a, b) => b.obsToShareDays.compareTo(a.obsToShareDays));
  pending.sort((a, b) => b.daysOverdue.compareTo(a.daysOverdue));

  final schools = schoolObs.keys.map((name) {
    return SlaSchoolRow(
      school: name,
      obs: schoolObs[name]!,
      from: schoolFrom[name],
      to: schoolTo[name],
      genOnTime: schoolGenOnTime[name] ?? 0,
      shareOnTime: schoolShareOnTime[name] ?? 0,
      pending: schoolPending[name] ?? 0,
    );
  }).toList()
    ..sort((a, b) {
      final byCount = b.obs.compareTo(a.obs);
      return byCount != 0 ? byCount : a.school.compareTo(b.school);
    });

  final submitted = observations.length;
  double? pct(int numerator) =>
      submitted == 0 ? null : double.parse((numerator / submitted * 100).toStringAsFixed(1));

  return PfSlaReport(
    pfName: pfName,
    cycleId: cycleId,
    generatedAt: asOf,
    windowStart: windowStart,
    windowEnd: windowEnd,
    submittedObs: submitted,
    reportsGenerated: reportsGenerated,
    genSlaPct: pct(genOnTimeTotal),
    shareSlaPct: pct(shareOnTimeTotal),
    pendingCount: pending.length,
    schools: schools,
    breaches: breaches,
    pending: pending,
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/sla_report_logic_test.dart`
Expected: PASS (all tests in both groups).

- [ ] **Step 5: Commit**

```bash
git add aikarthya-field-ops-app/lib/features/mgmt/providers/pf_sla_report_provider.dart aikarthya-field-ops-app/test/features/mgmt/sla_report_logic_test.dart
git commit -m "feat(mgmt): pure computePfSlaReport SLA logic + tests"
```

---

### Task 3: Data provider (Supabase I/O)

Thin fetch layer: pulls the 6 tables scoped to one PF, reduces them to obs-id-keyed maps, and delegates to `computePfSlaReport`. No SLA logic here.

**Files:**
- Modify: `aikarthya-field-ops-app/lib/features/mgmt/providers/pf_sla_report_provider.dart` (append imports + provider)

**Interfaces:**
- Consumes: `computePfSlaReport`, `SlaObsInput`, `SlaJobInput` from Task 2.
- Produces: `final pfSlaReportProvider = FutureProvider.family<PfSlaReport, (String, int?)>(...)` — arg is `(pfId, cycleId)`.

- [ ] **Step 1: Add imports at the top of the file**

The file currently has a single import. Replace the whole import block so the three imports are in alphabetical order (the analyzer's `directives_ordering` lint requires it):

```dart
import 'package:aikarthya_field_ops/features/mgmt/models/pf_sla_report.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
```

And directly below the import block add:

```dart
supabase.SupabaseClient get _db => supabase.Supabase.instance.client;

DateTime? _parseTs(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();
```

- [ ] **Step 2: Append the provider at the end of the file**

```dart
/// Fetches one PF's SLA data (submitted observations + report pipeline) and
/// computes the report. Arg = (pfId, cycleId); cycleId null = all cycles.
final pfSlaReportProvider =
    FutureProvider.family<PfSlaReport, (String, int?)>((ref, arg) async {
  final (pfId, cycleId) = arg;

  // 1. Submitted observations for this PF (optionally one cycle).
  var obsQuery = _db
      .from('observations')
      .select(
        'id, school_id, teacher_id, cycle_number, obs_date, end_time',
      )
      .eq('pf_id', pfId)
      .eq('status', 'submitted');
  if (cycleId != null) obsQuery = obsQuery.eq('cycle_number', cycleId);
  final obsRows = (await obsQuery).cast<Map<String, dynamic>>();

  final observations = <SlaObsInput>[
    for (final r in obsRows)
      (
        id: r['id'] as String,
        schoolId: r['school_id'] as String,
        teacherId: r['teacher_id'] as String?,
        cycle: r['cycle_number'] as int?,
        obsDate: r['obs_date'] == null
            ? null
            : DateTime.parse(r['obs_date'] as String),
        endTime: r['end_time'] as String?,
      ),
  ];

  // PF name.
  final pfRow = await _db
      .from('profiles')
      .select('full_name')
      .eq('id', pfId)
      .maybeSingle();
  final pfName = (pfRow?['full_name'] as String?) ?? 'Programme Fellow';

  if (observations.isEmpty) {
    return computePfSlaReport(
      pfName: pfName,
      cycleId: cycleId,
      observations: const [],
      jobs: const [],
      earliestShareByObsId: const {},
      approvedObsIds: const {},
      schoolNames: const {},
      teacherNames: const {},
      asOf: DateTime.now().toUtc(),
    );
  }

  final obsIds = observations.map((o) => o.id).toList();
  final schoolIds = observations.map((o) => o.schoolId).toSet().toList();
  final teacherIds = observations
      .map((o) => o.teacherId)
      .whereType<String>()
      .toSet()
      .toList();

  // 2. Report jobs for these observations.
  final jobRows = (await _db
          .from('report_jobs')
          .select('id, observation_id, status, completed_at')
          .inFilter('observation_id', obsIds))
      .cast<Map<String, dynamic>>();

  final jobs = <SlaJobInput>[
    for (final r in jobRows)
      (
        obsId: r['observation_id'] as String,
        status: r['status'] as String?,
        completedAt: _parseTs(r['completed_at']),
      ),
  ];
  final jobIdToObsId = <String, String>{
    for (final r in jobRows)
      r['id'] as String: r['observation_id'] as String,
  };
  final jobIds = jobIdToObsId.keys.toList();

  // 3. Shares -> earliest share per observation.
  final earliestShareByObsId = <String, DateTime>{};
  if (jobIds.isNotEmpty) {
    final shareRows = (await _db
            .from('report_shares')
            .select('report_job_id, shared_at')
            .inFilter('report_job_id', jobIds))
        .cast<Map<String, dynamic>>();
    for (final r in shareRows) {
      final obsId = jobIdToObsId[r['report_job_id'] as String];
      final sharedAt = _parseTs(r['shared_at']);
      if (obsId == null || sharedAt == null) continue;
      final existing = earliestShareByObsId[obsId];
      if (existing == null || sharedAt.isBefore(existing)) {
        earliestShareByObsId[obsId] = sharedAt;
      }
    }
  }

  // 4. Approvals (review_kind = 'approve').
  final approvedObsIds = <String>{};
  if (jobIds.isNotEmpty) {
    final reviewRows = (await _db
            .from('report_reviews')
            .select('report_job_id, review_kind')
            .inFilter('report_job_id', jobIds))
        .cast<Map<String, dynamic>>();
    for (final r in reviewRows) {
      if (r['review_kind'] == 'approve') {
        final obsId = jobIdToObsId[r['report_job_id'] as String];
        if (obsId != null) approvedObsIds.add(obsId);
      }
    }
  }

  // 5. School + teacher names.
  final schoolRows = (await _db
          .from('schools')
          .select('id, name')
          .inFilter('id', schoolIds))
      .cast<Map<String, dynamic>>();
  final schoolNames = <String, String>{
    for (final r in schoolRows) r['id'] as String: r['name'] as String,
  };

  final teacherNames = <String, String>{};
  if (teacherIds.isNotEmpty) {
    final teacherRows = (await _db
            .from('teachers')
            .select('id, full_name')
            .inFilter('id', teacherIds))
        .cast<Map<String, dynamic>>();
    for (final r in teacherRows) {
      teacherNames[r['id'] as String] = r['full_name'] as String;
    }
  }

  return computePfSlaReport(
    pfName: pfName,
    cycleId: cycleId,
    observations: observations,
    jobs: jobs,
    earliestShareByObsId: earliestShareByObsId,
    approvedObsIds: approvedObsIds,
    schoolNames: schoolNames,
    teacherNames: teacherNames,
    asOf: DateTime.now().toUtc(),
  );
});
```

- [ ] **Step 3: Verify it compiles (analyzer)**

Run: `cd aikarthya-field-ops-app && flutter analyze lib/features/mgmt/providers/pf_sla_report_provider.dart`
Expected: "No issues found!" (the existing logic tests from Task 2 must still pass: `flutter test test/features/mgmt/sla_report_logic_test.dart` → PASS).

- [ ] **Step 4: Commit**

```bash
git add aikarthya-field-ops-app/lib/features/mgmt/providers/pf_sla_report_provider.dart
git commit -m "feat(mgmt): pfSlaReportProvider Supabase fetch + delegate"
```

---

### Task 4: PDF builder

Renders a `PfSlaReport` to PDF bytes with Syncfusion `PdfGrid`s: header, KPI line, per-school table, Pending table (above), Breaches table (full, with Teacher + Cycle).

**Files:**
- Create: `aikarthya-field-ops-app/lib/features/mgmt/utils/sla_report_pdf_builder.dart`
- Test: `aikarthya-field-ops-app/test/features/mgmt/sla_report_pdf_builder_test.dart`

**Interfaces:**
- Consumes: `PfSlaReport` + rows (Task 1).
- Produces: `class SlaReportPdfBuilder { static Uint8List build(PfSlaReport report); static String fileName(PfSlaReport report); }`

- [ ] **Step 1: Write the failing builder test**

Create `test/features/mgmt/sla_report_pdf_builder_test.dart`:

```dart
import 'package:aikarthya_field_ops/features/mgmt/models/pf_sla_report.dart';
import 'package:aikarthya_field_ops/features/mgmt/utils/sla_report_pdf_builder.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  PfSlaReport sample() => PfSlaReport(
        pfName: 'Janhvi Mishra',
        cycleId: null,
        generatedAt: DateTime.utc(2026, 6, 30),
        windowStart: DateTime.utc(2026, 6, 17),
        windowEnd: DateTime.utc(2026, 6, 25),
        submittedObs: 2,
        reportsGenerated: 2,
        genSlaPct: 50,
        shareSlaPct: 0,
        pendingCount: 1,
        schools: const [
          SlaSchoolRow(
            school: 'Grace Model School',
            obs: 2,
            from: null,
            to: null,
            genOnTime: 1,
            shareOnTime: 0,
            pending: 1,
          ),
        ],
        breaches: [
          SlaBreachRow(
            school: 'Grace Model School',
            teacher: 'Asfia Sultana',
            cycle: 1,
            obsDate: DateTime.utc(2026, 6, 20),
            generated: DateTime.utc(2026, 6, 23),
            shared: DateTime.utc(2026, 6, 27),
            breachPhase: 'Share >72h',
            obsToShareDays: 7.0,
          ),
        ],
        pending: [
          SlaPendingRow(
            school: 'Adarsh Vidyalaya',
            teacher: 'Dheeraj',
            cycle: 1,
            obsDate: DateTime.utc(2026, 6, 17),
            generated: DateTime.utc(2026, 6, 25),
            status: 'pf_review',
            daysOverdue: 13,
          ),
        ],
      );

  test('build returns non-empty PDF bytes', () {
    final bytes = SlaReportPdfBuilder.build(sample());
    expect(bytes.length, greaterThan(500));
    // PDF magic header "%PDF".
    expect(bytes.sublist(0, 4), [0x25, 0x50, 0x44, 0x46]);
  });

  test('fileName slugs the PF name and includes cycle scope + date', () {
    expect(
      SlaReportPdfBuilder.fileName(sample()),
      'SLA-Janhvi-Mishra-all-20260630.pdf',
    );
  });

  test('empty report still builds', () {
    final empty = PfSlaReport(
      pfName: 'Nobody',
      cycleId: 2,
      generatedAt: DateTime.utc(2026, 6, 30),
      windowStart: null,
      windowEnd: null,
      submittedObs: 0,
      reportsGenerated: 0,
      genSlaPct: null,
      shareSlaPct: null,
      pendingCount: 0,
      schools: const [],
      breaches: const [],
      pending: const [],
    );
    final bytes = SlaReportPdfBuilder.build(empty);
    expect(bytes.length, greaterThan(500));
    expect(SlaReportPdfBuilder.fileName(empty), 'SLA-Nobody-c2-20260630.pdf');
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/sla_report_pdf_builder_test.dart`
Expected: FAIL — "SlaReportPdfBuilder isn't defined".

- [ ] **Step 3: Implement the builder**

Create `lib/features/mgmt/utils/sla_report_pdf_builder.dart`:

```dart
import 'dart:typed_data';

import 'package:aikarthya_field_ops/features/mgmt/models/pf_sla_report.dart';
import 'package:intl/intl.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';

/// Renders a [PfSlaReport] to a deterministic, AI-free one-page PDF.
class SlaReportPdfBuilder {
  static final DateFormat _d = DateFormat('dd MMM');
  static final DateFormat _dy = DateFormat('dd MMM yyyy');

  static String _pct(double? v) => v == null ? '—' : '${v.toStringAsFixed(1)}%';

  static String _range(DateTime? a, DateTime? b) {
    if (a == null && b == null) return '—';
    if (a != null && b != null) {
      return a == b ? _d.format(a) : '${_d.format(a)} – ${_d.format(b)}';
    }
    return _d.format((a ?? b)!);
  }

  static String fileName(PfSlaReport r) {
    final slug = r.pfName.trim().replaceAll(RegExp(r'\s+'), '-');
    final scope = r.cycleId == null ? 'all' : 'c${r.cycleId}';
    final date = DateFormat('yyyyMMdd').format(r.generatedAt);
    return 'SLA-$slug-$scope-$date.pdf';
  }

  static Uint8List build(PfSlaReport r) {
    final doc = PdfDocument();
    doc.pageSettings.size = PdfPageSize.a4;
    doc.pageSettings.margins.all = 28;
    final page = doc.pages.add();
    final g = page.graphics;
    final pageWidth = page.getClientSize().width;

    final titleFont = PdfStandardFont(PdfFontFamily.helvetica, 18,
        style: PdfFontStyle.bold);
    final subFont = PdfStandardFont(PdfFontFamily.helvetica, 10);
    final h2Font = PdfStandardFont(PdfFontFamily.helvetica, 11,
        style: PdfFontStyle.bold);

    g.drawString('PF SLA Compliance Report', titleFont,
        bounds: const Rect.fromLTWH(0, 0, 400, 24));
    final scope = r.cycleId == null ? 'All cycles' : 'Cycle ${r.cycleId}';
    g.drawString(
      '${r.pfName}  ·  Programme Fellow',
      PdfStandardFont(PdfFontFamily.helvetica, 11, style: PdfFontStyle.bold),
      bounds: const Rect.fromLTWH(0, 26, 400, 16),
    );
    g.drawString(
      'Generated ${_dy.format(r.generatedAt)}  ·  $scope\n'
      'Window: ${_range(r.windowStart, r.windowEnd)}  ·  SLA clock starts at observation date',
      subFont,
      bounds: Rect.fromLTWH(pageWidth - 240, 2, 240, 40),
      format: PdfStringFormat(alignment: PdfTextAlignment.right),
    );

    // KPI line.
    final kpi =
        'Submitted: ${r.submittedObs}    Generated: ${r.reportsGenerated}    '
        'Gen SLA ≤24h: ${_pct(r.genSlaPct)}    Shared ≤72h: ${_pct(r.shareSlaPct)}    '
        'Pending PF review: ${r.pendingCount}';
    g.drawString(kpi,
        PdfStandardFont(PdfFontFamily.helvetica, 10, style: PdfFontStyle.bold),
        bounds: const Rect.fromLTWH(0, 52, 540, 18));

    // Phase legend (tables-first text form of the sample's three cards).
    g.drawString(
      'Phase 1 Generation (mgmt): report ≤ obs +24h    ·    '
      'Phase 2 Approval & Share (PF): shared ≤ obs +72h    ·    '
      'Headline: obs → shared ≤ 72h',
      PdfStandardFont(PdfFontFamily.helvetica, 8),
      bounds: const Rect.fromLTWH(0, 70, 540, 14),
    );

    var y = 92.0;

    y = _heading(g, h2Font, 'Per-School SLA', y);
    final schoolGrid = _grid(
      ['School', 'Obs', 'Time frame', 'Gen ≤24h', 'Shared ≤72h', 'Pending'],
      [
        for (final s in r.schools)
          [
            s.school,
            '${s.obs}',
            _range(s.from, s.to),
            '${s.genOnTime}/${s.obs}',
            '${s.shareOnTime}/${s.obs}',
            '${s.pending}',
          ],
        if (r.schools.isEmpty)
          ['No submitted observations in this selection', '', '', '', '', ''],
      ],
    );
    y = schoolGrid.draw(page: page, bounds: Rect.fromLTWH(0, y, pageWidth, 0))!
            .bounds
            .bottom +
        14;

    y = _heading(g, h2Font, 'Pending PF Review — generated, not shared', y);
    final pendingGrid = _grid(
      ['School', 'Teacher', 'Cycle', 'Obs date', 'Generated', 'Status', 'Days overdue'],
      [
        for (final p in r.pending)
          [
            p.school,
            p.teacher,
            '${p.cycle ?? '—'}',
            _d.format(p.obsDate),
            p.generated == null ? '—' : _d.format(p.generated!),
            p.status,
            '${p.daysOverdue}',
          ],
        if (r.pending.isEmpty) ['None', '', '', '', '', '', ''],
      ],
    );
    y = pendingGrid
            .draw(page: page, bounds: Rect.fromLTWH(0, y, pageWidth, 0))!
            .bounds
            .bottom +
        14;

    y = _heading(g, h2Font, 'SLA Breaches — obs date → shared (all ${r.breaches.length})', y);
    final breachGrid = _grid(
      ['School', 'Teacher', 'Cycle', 'Obs date', 'Generated', 'Shared', 'Breach', 'Obs→share (d)'],
      [
        for (final b in r.breaches)
          [
            b.school,
            b.teacher,
            '${b.cycle ?? '—'}',
            _d.format(b.obsDate),
            b.generated == null ? '—' : _d.format(b.generated!),
            _d.format(b.shared),
            b.breachPhase,
            b.obsToShareDays.toStringAsFixed(1),
          ],
        if (r.breaches.isEmpty) ['None', '', '', '', '', '', '', ''],
      ],
    );
    breachGrid.draw(page: page, bounds: Rect.fromLTWH(0, y, pageWidth, 0));

    final bytes = Uint8List.fromList(doc.saveSync());
    doc.dispose();
    return bytes;
  }

  static double _heading(
      PdfGraphics g, PdfFont font, String text, double y) {
    g.drawString(text, font, bounds: Rect.fromLTWH(0, y, 540, 16));
    return y + 18;
  }

  static PdfGrid _grid(List<String> headers, List<List<String>> rows) {
    final grid = PdfGrid();
    grid.columns.add(count: headers.length);
    final header = grid.headers.add(1)[0];
    for (var i = 0; i < headers.length; i++) {
      header.cells[i].value = headers[i];
    }
    header.style = PdfGridRowStyle(
      backgroundBrush: PdfSolidBrush(PdfColor(31, 78, 121)),
      textBrush: PdfBrushes.white,
      font: PdfStandardFont(PdfFontFamily.helvetica, 8,
          style: PdfFontStyle.bold),
    );
    for (final r in rows) {
      final row = grid.rows.add();
      for (var i = 0; i < r.length; i++) {
        row.cells[i].value = r[i];
      }
    }
    grid.style = PdfGridStyle(
      font: PdfStandardFont(PdfFontFamily.helvetica, 8),
      cellPadding: PdfPaddings(left: 3, right: 3, top: 2, bottom: 2),
    );
    return grid;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/sla_report_pdf_builder_test.dart`
Expected: PASS (3 tests). If the Syncfusion API name for synchronous save differs, use `doc.saveSync()` (available in syncfusion_flutter_pdf 29.x). Do not switch to async unless the analyzer reports `saveSync` undefined — in which case use `await doc.save()` and make `build` return `Future<Uint8List>` (and update Task 6's call site to `await`).

- [ ] **Step 5: Commit**

```bash
git add aikarthya-field-ops-app/lib/features/mgmt/utils/sla_report_pdf_builder.dart aikarthya-field-ops-app/test/features/mgmt/sla_report_pdf_builder_test.dart
git commit -m "feat(mgmt): SlaReportPdfBuilder one-page PDF renderer"
```

---

### Task 5: Cross-platform byte-download helper

Add a function that downloads/shares already-in-memory PDF bytes (the existing `shareReportPdf` only handles server-fetched bytes by job id).

**Files:**
- Modify: `aikarthya-field-ops-app/lib/features/reporting/utils/report_pdf_share_helper.dart`

**Interfaces:**
- Produces: `Future<void> sharePdfBytes({required Uint8List bytes, required String fileName, String? message})`.

- [ ] **Step 1: Add the import for Uint8List**

At the top of `report_pdf_share_helper.dart`, the file already imports `package:flutter/foundation.dart` (which exports `Uint8List`) and `package:flutter/services.dart`. No new import needed. Confirm by reading the existing import block (lines 1–10).

- [ ] **Step 2: Append the new function at the end of the file**

```dart
/// Download (web) or share (native) already-in-memory PDF [bytes].
/// Used by features that generate the PDF client-side (e.g. the SLA report),
/// as opposed to [shareReportPdf] which fetches a server-rendered report.
Future<void> sharePdfBytes({
  required Uint8List bytes,
  required String fileName,
  String? message,
}) async {
  if (message != null) {
    await Clipboard.setData(ClipboardData(text: message));
  }
  if (kIsWeb) {
    downloadPdfOnWeb(bytes, fileName);
  } else {
    final tempDir = await getTemporaryDirectory();
    final tempFile = File(p.join(tempDir.path, fileName));
    await tempFile.writeAsBytes(bytes, flush: true);
    await Share.shareXFiles([XFile(tempFile.path)], text: message ?? '');
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd aikarthya-field-ops-app && flutter analyze lib/features/reporting/utils/report_pdf_share_helper.dart`
Expected: "No issues found!"

- [ ] **Step 4: Commit**

```bash
git add aikarthya-field-ops-app/lib/features/reporting/utils/report_pdf_share_helper.dart
git commit -m "feat(reporting): sharePdfBytes helper for client-generated PDFs"
```

---

### Task 6: Wire the "Download SLA Report" button into the PF profile

Add a button beside the existing Work Days Rewind button in the page's top row. On press it reads the provider, builds the PDF, and downloads it, with loading + SnackBar feedback.

**Files:**
- Modify: `aikarthya-field-ops-app/lib/features/mgmt/pages/pf_profile_page.dart`

**Interfaces:**
- Consumes: `pfSlaReportProvider` (Task 3), `SlaReportPdfBuilder` (Task 4), `sharePdfBytes` (Task 5).

- [ ] **Step 1: Add imports**

Add these three imports to `pf_profile_page.dart`, inserting each in its correct alphabetical position within the existing `package:aikarthya_field_ops/...` import group (the `directives_ordering` lint requires alphabetical order):

```dart
import 'package:aikarthya_field_ops/features/mgmt/providers/pf_sla_report_provider.dart';
import 'package:aikarthya_field_ops/features/mgmt/utils/sla_report_pdf_builder.dart';
import 'package:aikarthya_field_ops/features/reporting/utils/report_pdf_share_helper.dart';
```

For reference, `mgmt/providers/pf_sla_report_provider` sorts after the existing `mgmt/providers/mgmt_home_providers`; `mgmt/utils/...` after `mgmt/providers/...`; `reporting/utils/...` after all `mgmt/...`. All three come before the `package:flutter/...` imports.

- [ ] **Step 2: Add the button to the top row**

In `_PfProfilePageState.build`, the top `Row` currently is:

```dart
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: () => context.go(MgmtRoutes.dashboard),
                      icon: const Icon(Icons.arrow_back, size: 18),
                      label: const Text('Back to Dashboard'),
                      style: TextButton.styleFrom(
                        alignment: Alignment.centerLeft,
                        padding: EdgeInsets.zero,
                      ),
                    ),
                    const Spacer(),
                    _WorkDaysRewindButton(pfId: widget.pfId),
                  ],
                ),
```

Replace the `_WorkDaysRewindButton(pfId: widget.pfId),` line inside that Row with:

```dart
                    _DownloadSlaReportButton(pfId: widget.pfId, cycleId: cycleId),
                    const SizedBox(width: 12),
                    _WorkDaysRewindButton(pfId: widget.pfId),
```

- [ ] **Step 3: Add the button widget**

At the end of `pf_profile_page.dart` (after `_BandEmpty`), add:

```dart
/// Generates and downloads this PF's one-page SLA compliance PDF for the
/// currently-selected cycle scope. Pure data → PDF, no AI.
class _DownloadSlaReportButton extends ConsumerStatefulWidget {
  const _DownloadSlaReportButton({required this.pfId, required this.cycleId});

  final String pfId;
  final int? cycleId;

  @override
  ConsumerState<_DownloadSlaReportButton> createState() =>
      _DownloadSlaReportButtonState();
}

class _DownloadSlaReportButtonState
    extends ConsumerState<_DownloadSlaReportButton> {
  bool _busy = false;

  Future<void> _download() async {
    setState(() => _busy = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final report = await ref
          .read(pfSlaReportProvider((widget.pfId, widget.cycleId)).future);
      final bytes = SlaReportPdfBuilder.build(report);
      await sharePdfBytes(
        bytes: bytes,
        fileName: SlaReportPdfBuilder.fileName(report),
      );
      messenger.showSnackBar(
        const SnackBar(content: Text('SLA report downloaded.')),
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('Could not generate SLA report: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: _busy ? null : _download,
      icon: _busy
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.download, size: 18),
      label: const Text('Download SLA Report'),
    );
  }
}
```

If Task 4 Step 4 forced `build` to be async, change `final bytes = SlaReportPdfBuilder.build(report);` to `final bytes = await SlaReportPdfBuilder.build(report);`.

- [ ] **Step 4: Analyze the page**

Run: `cd aikarthya-field-ops-app && flutter analyze lib/features/mgmt/pages/pf_profile_page.dart`
Expected: "No issues found!"

- [ ] **Step 5: Run the full mgmt test folder to confirm no regressions**

Run: `cd aikarthya-field-ops-app && flutter test test/features/mgmt/`
Expected: PASS (all tests including the three new files).

- [ ] **Step 6: Commit**

```bash
git add aikarthya-field-ops-app/lib/features/mgmt/pages/pf_profile_page.dart
git commit -m "feat(mgmt): Download SLA Report button on PF profile"
```

---

### Task 7: Manual verification against production

No code; a checklist the implementer runs once before declaring done.

- [ ] **Step 1: Launch the console** (`cd aikarthya-field-ops-app && flutter run -d chrome`), sign in as a manager, open **Team → Janhvi Mishra**.

- [ ] **Step 2: With "All cycles" selected, click Download SLA Report.** Confirm a PDF downloads named `SLA-Janhvi-Mishra-all-YYYYMMDD.pdf`.

- [ ] **Step 3: Open the PDF and confirm against the approved sample** (`.report_assets/SLA-Report-SAMPLE-v4-Janhvi-Mishra.pdf`): 21 submitted, Gen ≤24h ≈ 9.5%, Shared ≤72h 0%, 3 pending; Pending table appears ABOVE Breaches; breach table lists all rows with Teacher + Cycle columns; no "No AI" / "drafts" text anywhere.

- [ ] **Step 4: Select a single cycle** and confirm the numbers scope down (and the filename switches to `-cN-`).

- [ ] **Step 5: Spot-check one number with SQL** against production (`observations` submitted count for the PF) to confirm the in-app figure matches.

---

## Notes for the implementer

- **Do not** call `DateTime.now()` inside `computePfSlaReport`; the provider injects `asOf`. This keeps the logic deterministic and testable.
- **Approvals** (`approvedObsIds`) are fetched and passed through but not yet used by the headline math (share presence already implies the report left review). It is wired now so a future "approved but not shared" sub-state needs no new query. Leaving it unused is intentional, not an omission.
- All Supabase reads are **read-only**; no migration, no schema change, no RLS change.
- **Styling vs the sample:** the builder reproduces the sample's *sections and data* (header, phase legend, KPIs, per-school, pending-above-breaches, full breach list with Teacher + Cycle). It renders the phase legend and KPIs as compact text lines rather than the sample's coloured boxed cards — a deliberate tables-first simplification. If the user later wants the boxed visual styling, that is a follow-up on the builder only (no logic/provider change).
