# Serve the catalogue and practitioners from PostgreSQL

Move products and practitioners from the sample data in `src/lib/catalog.ts` and `src/lib/consultations.ts` into PostgreSQL using the existing `prisma/schema.prisma` models.

- Add the first Prisma migration and a seed script that loads the current sample data (prices converted to paise).
- `getProduct`, `getProductsByCategory`, `getFeaturedProducts`, `recommendProducts`, `PRACTITIONERS` and `getOpenSlots` read from the database, with the same behaviour and tests as today.
- Open slots come from `AvailabilityRule`, minus `TimeOff` and existing `Appointment`s, replacing the stand-in "taken" hash.
- Product and shop pages keep working with static generation plus revalidation (for example every 10 minutes).
- Tests run without a live database (mock the data layer or use an in-memory fixture).
