# Security Specification

## Data Invariants
- Products: must have positive price and stock.
- Orders: must have a total amount > 0.
- Settings: only 'store' document is allowed.

## The Dirty Dozen Payloads
1. Product with negative price.
2. Product with empty name.
3. Order with 0 total amount.
4. Setting update by non-admin.
5. Product deletion by non-admin.
6. Order modification by non-admin (except initial creation).
7. Injecting 1MB string into product name.
8. Injecting large array into categories.
9. Accessing orders collection without admin rights.
10. Creating a product with a spoofed admin UID.
11. Updating immutable field 'createdAt' in product.
12. Creating a setting doc with ID other than 'store'.

## Red Team Strategy
Verify that only admins can perform write operations on products and settings. Ensure any user can place an order but only admins can see them.
