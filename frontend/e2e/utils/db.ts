import pg from "pg";

const { Client } = pg;

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDbConfig(): DbConfig {
  return {
    host: process.env.E2E_DB_HOST ?? "localhost",
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    user: process.env.E2E_DB_USER ?? "notes",
    password: process.env.E2E_DB_PASSWORD ?? "notes",
    database: process.env.E2E_DB_NAME ?? "notesdb",
  };
}

export async function waitForEmailVerificationToken(
  email: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<string> {
  const { timeoutMs = 10_000, intervalMs = 250 } = options;
  const client = new Client(getDbConfig());
  const startedAt = Date.now();

  await client.connect();

  try {
    while (Date.now() - startedAt < timeoutMs) {
      const result = await client.query(
        `
        select evt.token
        from email_verification_tokens evt
        join users u on u.id = evt.user_id
        where lower(u.email) = lower($1)
        order by evt.id desc
        limit 1
      `,
        [email],
      );

      if (result.rows.length > 0) {
        return result.rows[0].token as string;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } finally {
    await client.end();
  }

  throw new Error(`Timed out waiting for verification token for ${email}`);
}
