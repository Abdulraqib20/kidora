import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool, schema } from "../src/db";
import { auth } from "../src/lib/auth";

/** Reset or create the administrator account with the configured email and password. */
async function main() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || "admin@kidora.store").trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || "kidora2026";

  console.log(`Setting admin password for: ${email}`);

  // 1. Hash new password using Better Auth hasher
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);

  // 2. Check if user already exists in target DB
  const [existingUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email));

  if (existingUser) {
    // Update role
    await db
      .update(schema.user)
      .set({ role: "admin" })
      .where(eq(schema.user.id, existingUser.id));

    // Update or insert credential account
    const [existingAccount] = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, existingUser.id));

    if (existingAccount) {
      await db
        .update(schema.account)
        .set({ password: passwordHash })
        .where(eq(schema.account.id, existingAccount.id));
      console.log(`✔ Password successfully updated for existing admin: ${email}`);
    } else {
      await db.insert(schema.account).values({
        userId: existingUser.id,
        accountId: email,
        providerId: "credential",
        password: passwordHash,
      });
      console.log(`✔ Credential account created with new password for: ${email}`);
    }
  } else {
    // Create new admin user
    const [newUser] = await db
      .insert(schema.user)
      .values({
        name: "Store Admin",
        email,
        role: "admin",
      })
      .returning();

    await db.insert(schema.account).values({
      userId: newUser.id,
      accountId: email,
      providerId: "credential",
      password: passwordHash,
    });
    console.log(`✔ New admin account created successfully for: ${email}`);
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error("Failed to set admin password:", err);
  await pool.end();
  process.exit(1);
});
