# Security Specification - NEWGATEROBOT SCHOOL SYSTEM

## 1. Data Invariants
- A student must belong to a class.
- Points can only be modified by Teachers or Admins.
- Parents can ONLY view students linked to their `studentIds` array.
- Role-based access control (RBAC) is strictly enforced via the `users` collection.

## 2. The Dirty Dozen Payloads

1. **Identity Theft**: Parent attempts to read behavior records of a student NOT in their linked `studentIds`.
2. **Escalation**: Teacher attempts to update their own user document to change `role` to 'admin'.
3. **Data Poisoning**: Student ID injection with 2KB junk characters.
4. **Wealth Inflation**: Teacher attempts to grant 99,999 points in a single behavior record.
5. **Orphaned Writes**: Creating an attendance record for a non-existent student ID.
6. **Shadow Update**: Adding a `hidden_admin: true` field to a user profile.
7. **Temporal Fraud**: Spoofing `timestamp` on attendance to yesterday.
8. **PII Leak**: List query on `users` collection by a Parent to see all emails.
9. **The Deletion Hack**: Regular teacher attempting to delete a Class document.
10. **State Shortcut**: Moving a student's level from 1 to 50 in one update.
11. **Guest Access**: Authenticated but unassigned user trying to read `announcements`.
12. **Infinite Notes**: Sending a 10MB string as a behavior note.

## 3. Test Scenarios
- `test_unauthorized_read`: Verify Parent cannot read `/students/{otherId}`.
- `test_role_protection`: Verify `users/{uid}` updates cannot change `role`.
- `test_admin_privileges`: Verify Admin can manage everything.
- `test_teacher_scope`: Verify Teacher can only write to `/attendance` for their class.
