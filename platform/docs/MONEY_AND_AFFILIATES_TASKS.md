# Money Reports + Affiliates: task plan

> Written 2026-10-24 after an audit of `main` (4adba2c). It adds to `docs/CLOUD_TASKS.md`, using the same rules: section 0 (read first, rules, setup, gates, screenshots) applies to every task here.
> Goal: the owner can open the admin dashboard and see **how much money the business made, where it came from, and what is owed to affiliates**, without SQL.

---

## 0. What exists today (audit)

**Admin overview** (`apps/api/src/admin-stats/admin-stats.repository.ts`, `GET /v1/admin/stats`):
- revenue = sum of `orders.amount_minor` where `status = 'paid'`, for today, the last 7 days and the last 30 days (EGP only);
- orders by status, pending manual payments, unmatched payment events, active invitations, new sign-ups (7d), RSVPs (7d).

That is **gross sales in three fixed windows**. There is no net figure, no date range, no chart, no breakdown and no export.

**Affiliates: database tables only.**

| Piece | State |
|---|---|
| `affiliates`, `affiliate_clicks`, `affiliate_payouts`, `orders.affiliate_id` / `attribution` (`0001_core.sql`) | ✅ exist, admin-only RLS |
| Capturing `?ref=<code>` links or a code typed at checkout | ❌ none in web or API |
| Affiliate customer discount at checkout | ❌ `affiliateEgp: 0` hard-coded (`apps/api/src/checkout/checkout.service.ts:162`, `apps/web/src/commerce/pricing.ts:39`) |
| Commission calculated when an order is paid | ❌ `fulfill_paid_order` does not touch affiliates |
| Admin affiliate pages | ❌ only planned as T22 item 3 |
| `affiliate_payouts.amount_egp` | ⚠️ still EGP `numeric`, not minor units like the rest of the money columns |

**Overlap with `CLOUD_TASKS.md`:** T27 below **replaces T22 item 3 (Affiliates)**. The session that runs T22 must skip that item and leave `app/[locale]/admin/affiliates/**` and `apps/api/src/admin-affiliates/**` to T27.

---

## 1. Order and reserved migration numbers

```
T27 Affiliates end to end   (after T13 if possible, so balance purchases are attributed too)
T28 Money reports           (after T27 for the affiliate columns; after T13 for the balance block)
```
T28 can start before T27 and T13 land: build the parts that don't depend on them, and leave each missing block behind a clear "not available yet" state, never fake numbers.

| Number | Task |
|---|---|
| 0032 | T27 |
| 0033 | T28 |

---

## 2. Tasks

### T27 · Affiliates end to end · branch `task/T27-affiliates` · migration 0032
**Owns:** `apps/api/src/affiliates/**`, `apps/api/src/admin-affiliates/**`, `0032_affiliates.sql`, `supabase/tests/T27.sql`, `app/[locale]/admin/affiliates/**`, `apps/web/src/affiliates/**`, messages `affiliates`. Touches `checkout.service.ts`, `pricing.ts` and the web middleware: explain each in the PR.

**Build:**
1. **Attribution:**
   - `/{locale}/...?ref=<code>`: the web sets a first-party cookie `inv_ref` (code + timestamp, 30 days, `SameSite=Lax`, HttpOnly), and counts the click server side (`affiliate_clicks`, one per visitor per day; no personal data stored);
   - a "promo / referral code" field at checkout;
   - rule: **a typed code beats a link; the latest link wins; a link older than 30 days is ignored**; only `active` affiliates count;
   - the order stores `affiliate_id` + `attribution` (`link` / `code`) at checkout time;
   - **self-referral:** if the buyer's email/phone matches the affiliate's, the order is still attributed but flagged `self_referral` and earns **no commission**.
2. **Customer discount:** the affiliate's `customer_discount_pct` feeds `affiliateEgp` in `applyDiscountCap` (same function in the web quote and the API; the **30% total cap** still applies).
3. **Commission ledger** (SQL, service_role only):
   - `affiliate_commissions`: `order_id` unique, `affiliate_id`, `base_minor` (what the customer actually paid, after all discounts), `pct`, `commission_minor`, `status` (`pending` → `payable` → `paid`, or `void`), `payable_at = paid_at + 7 days`, `payout_id`;
   - written **inside `fulfill_paid_order`** (one transaction, idempotent: paying the same order twice writes one row);
   - `refund_order` sets an unpaid commission to `void`; a refund after the commission was paid writes a negative adjustment row that the next payout subtracts;
   - the daily lifecycle job moves `pending` → `payable` after `payable_at`;
   - migrate `affiliate_payouts.amount_egp` → `amount_minor` (+ `currency`), keeping the old column's data;
   - `mark_payout_paid(admin, affiliate_id, commission_ids[], method, reference)` links the commissions to one payout row and writes the audit log.
4. **API:** admin CRUD for affiliates; `GET /v1/admin/affiliates/:id/stats?from&to` (clicks, orders, sales, commission pending / payable / paid / void); payout create + list; CSV export of commissions and payouts.
5. **Admin web:**
   - list: name, code, active, clicks, orders, sales, **owed now**, paid to date (date range filter);
   - create/edit: code, commission %, customer discount %, payout method and details, active;
   - share box: link + QR + copy button for each locale;
   - detail: orders brought (self-referrals marked), commissions by status, "Mark as paid" for the selected payable commissions, payout history, CSV.

**Tests:** non-admin gets 403 on every admin route; a code beats a link; a 31-day-old link is ignored; an inactive affiliate is ignored; self-referral earns 0; commission is written once on double fulfilment; a refund before 7 days voids it; it becomes payable only after 7 days; marking paid twice is a no-op; the discount cap holds with points + coupon + affiliate together.

### T28 · Money reports · branch `task/T28-money-reports` · migration 0033
**Owns:** `apps/api/src/admin-reports/**`, `0033_money_reports.sql` (views / functions only, plus the optional `business_costs` table), `supabase/tests/T28.sql`, `app/[locale]/admin/reports/**`, messages `adminReports`. Adds one link in the admin navigation and one "Net revenue (30d)" card on the overview.

**Definitions (show them on the page as small help text):**
- **Gross sales** = list price of paid orders (before discounts).
- **Discounts** = coupons + points + affiliate customer discount.
- **Sales** = what customers actually paid = gross − discounts.
- **Refunds** = refunded order amounts, counted on the refund date.
- **Affiliate commission** = non-void commissions on those orders (T27).
- **Net revenue** = sales − refunds − affiliate commission.
- **Profit (optional)** = net revenue − business costs the owner entered (VPS, SMTP, ads...).

**Build:**
1. **Date range** picker (today, 7d, 30d, this month, last month, custom) with a compare-to-previous-period percentage on each card. Times are in `Africa/Cairo`.
2. **Cards:** gross sales, discounts, sales, refunds, affiliate commission, net revenue, paid orders, average order value, conversion (paid ÷ checkouts started), repeat customers (more than one paid order).
3. **Chart:** sales and net revenue per day (per month when the range is over 90 days).
4. **Breakdowns** (tables, sortable): by template, by tier, by order kind (new / extension / edits / add-on), by source (affiliate / coupon / direct), top 10 affiliates by sales.
5. **Customer balance block** (needs T13; until then show "available after balance launch"):
   - top-ups received (cash in), credit spent on purchases, refunds back to credit, **unspent credit owed to customers** (a liability, not income), awaiting-balance orders and their total.
   - Purchases paid from balance count as sales on the purchase date; top-ups never count as sales.
6. **Owed to affiliates:** total payable now, pending (inside the 7-day window), paid in the range.
7. **Business costs (optional):** a small admin form for monthly costs (name, amount, month); profit card appears only when at least one cost exists.
8. **CSV export** of orders, refunds, top-ups and payouts for the selected range (for the accountant), and audit log entries for exports.
9. All numbers come from the API in minor units; the web formats them with `formatMoney`. One SQL function per block, read-only, admin only.

**Tests:** numbers match a fixed seeded set of orders (paid, refunded, discounted, affiliate, balance) exactly; refunds land on the refund date; top-ups are not counted as sales; Cairo day boundaries are right around midnight; non-admin 403; the CSV totals equal the cards; screenshots at 390/768/1280 in `ar` and `en`.

---

## 3. Owner decisions needed

| # | Decision | Default if not answered |
|---|---|---|
| 1 | Commission base: what the customer paid after discounts, or the list price? | after discounts |
| 2 | Does a renewal/extension by the same customer earn the affiliate commission again? | no, first order only |
| 3 | Minimum payout amount | EGP 200 |
| 4 | Payout methods to support (InstaPay, wallet, bank) | InstaPay + wallet |
| 5 | Can an affiliate see their own stats page (a login for affiliates)? | no, admin shares the numbers; later task |
