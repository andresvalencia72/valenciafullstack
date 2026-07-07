import type { Database } from "@/shared/db/database";
import { contactMessages } from "@/shared/db/schema";
import type {
  ContactMessageInput,
  ContactMessageRepository,
} from "../domain/contact-message-repository";

/**
 * `ContactMessageRepository` implementation backed by Drizzle
 * (infrastructure: Drizzle repository implementation, persistence:
 * Infrastructure Repository Implementations). Accepts an injected
 * `Database` handle so it can be exercised against a pglite test
 * database in tests, and the production `getDb()` client at the `app/`
 * composition root.
 */
export function createDrizzleContactMessageRepository(
  db: Database,
): ContactMessageRepository {
  return {
    async save(input: ContactMessageInput): Promise<void> {
      await db.insert(contactMessages).values({
        name: input.name,
        email: input.email,
        message: input.message,
        locale: input.locale,
        ipHash: input.ipHash,
      });
    },
  };
}
