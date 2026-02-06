# Specification

## Summary
**Goal:** Let cashiers save transactions with a selected past transaction date/time, and ensure reports use that transaction date for grouping.

**Planned changes:**
- Update the backend transaction-create API and transaction model to accept a user-provided transaction timestamp/date, while rejecting future dates and keeping existing authorization rules.
- Update daily and monthly reporting logic to group/include transactions based on the stored transaction date (including backdated ones) without breaking existing historical report behavior.
- Add a transaction date selector to the Kasir page (default: today) and send the selected date when submitting a transaction; prevent or surface errors for future dates.
- Update React Query hooks/types (including `useTambahTransaksi`) so the create-transaction mutation includes the transaction date and maintains existing cache invalidation/refetch behavior.

**User-visible outcome:** On the Kasir page, the cashier can pick a previous date for a sale, save the transaction successfully, and see it appear in the correct day/month in existing reports.
