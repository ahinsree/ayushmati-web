# Book and pay for an online consultation

The "Confirm & pay" step on `/consult` (reached from the booking widget on the page or in the AI chat) books the slot.

- Requires sign-in (or a quick email OTP). The patient can add a short note about their concern.
- The server re-checks that the slot is still open, creates an `Appointment` (PENDING_PAYMENT) and a Razorpay order for the practitioner's fee. The unique constraint on (practitioner, startsAt) prevents double booking, and an unpaid hold expires after 15 minutes.
- When payment is verified (client signature check plus webhook), the appointment becomes CONFIRMED and a Google Calendar event with a Meet link is created for the practitioner and the patient.
- Confirmation by email (Resend) and SMS (MSG91, DLT template), plus reminders 24 hours and 1 hour before the appointment.
- Patients can cancel or reschedule up to 12 hours before the start (with a refund via Razorpay when they cancel).
- Practitioners see their upcoming appointments at `/practitioner`.
