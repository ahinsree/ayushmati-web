# Customer accounts

Customers can sign in, see their orders and appointments, and save addresses.

- Auth.js with passwordless email (OTP or magic link via Resend) and Google sign-in, sessions stored in PostgreSQL through the Prisma adapter.
- `/account` page: profile (name, phone), saved addresses (add, edit, delete, set default), order history and upcoming and past consultations.
- Header shows "Sign in" or the account menu.
- Checkout and booking can continue as a guest, but are linked to the account when signed in.
- Account pages are only visible to the signed-in user (server-side check), and practitioners and admins get a role.
