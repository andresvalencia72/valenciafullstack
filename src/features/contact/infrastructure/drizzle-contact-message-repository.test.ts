import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createPgliteTestDb, type PgliteTestDb } from "@/shared/db/create-pglite-test-db";
import { createDrizzleContactMessageRepository } from "./drizzle-contact-message-repository";

describe("createDrizzleContactMessageRepository", () => {
  let testDb: PgliteTestDb;

  afterEach(async () => {
    await testDb?.close();
  });

  it("persists a contact message with all validated fields (persistence: Infrastructure Repository Implementations)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleContactMessageRepository(testDb.db);

    await repository.save({
      name: "Andrés Valencia",
      email: "andres@example.com",
      message: "Hello from the contact form",
      locale: "es",
      ipHash: "hash-1",
    });

    const rows = await testDb.db.execute(
      sql`SELECT name, email, message, locale, ip_hash FROM contact_messages`,
    );

    expect(rows.rows).toEqual([
      {
        name: "Andrés Valencia",
        email: "andres@example.com",
        message: "Hello from the contact form",
        locale: "es",
        ip_hash: "hash-1",
      },
    ]);
  });

  it("persists multiple independent messages as separate rows (triangulation)", async () => {
    testDb = await createPgliteTestDb();
    const repository = createDrizzleContactMessageRepository(testDb.db);

    await repository.save({
      name: "First",
      email: "first@example.com",
      message: "First message",
      locale: "es",
      ipHash: "hash-a",
    });
    await repository.save({
      name: "Second",
      email: "second@example.com",
      message: "Second message",
      locale: "en",
      ipHash: "hash-b",
    });

    const rows = await testDb.db.execute(
      sql`SELECT name, locale FROM contact_messages ORDER BY name`,
    );

    expect(rows.rows).toEqual([
      { name: "First", locale: "es" },
      { name: "Second", locale: "en" },
    ]);
  });
});
