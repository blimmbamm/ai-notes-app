import { chromium, request, type APIResponse } from "@playwright/test";
import { waitForEmailVerificationToken } from "./utils/db";

function uniqueEmail() {
  const stamp = Date.now();
  return `e2e+${stamp}@example.com`;
}

export default async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
  const apiBaseURL = process.env.E2E_API_BASE_URL ?? new URL(baseURL).origin;
  const email = uniqueEmail();
  const password = "Password123!";

  const api = await request.newContext({ baseURL: apiBaseURL });

  const signupResponse = await retryRequest(
    () =>
      api.post("/api/auth/signup", {
        data: { email, password },
      }),
    { label: "signup" },
  );

  if (!signupResponse.ok()) {
    throw new Error(`Signup failed with status ${signupResponse.status()}`);
  }

  const token = await waitForEmailVerificationToken(email);
  const verifyResponse = await retryRequest(
    () => api.get(`/api/auth/verify?token=${encodeURIComponent(token)}`),
    { label: "verify" },
  );

  if (!verifyResponse.ok()) {
    throw new Error(`Email verification failed with status ${verifyResponse.status()}`);
  }

  const loginResponse = await retryRequest(
    () =>
      api.post("/api/auth/login", {
        data: { email, password },
      }),
    { label: "login" },
  );

  if (!loginResponse.ok()) {
    throw new Error(`Login failed with status ${loginResponse.status()}`);
  }

  const loginBody = (await loginResponse.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(new URL("/login", baseURL).toString(), { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([accessToken, refreshToken]) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    },
    [loginBody.accessToken, loginBody.refreshToken],
  );

  await context.storageState({ path: "e2e/.auth/state.json" });
  await browser.close();
  await api.dispose();
}

async function retryRequest(
  requestFn: () => Promise<APIResponse>,
  options: { label: string; timeoutMs?: number; intervalMs?: number },
): Promise<APIResponse> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 500;
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await requestFn();
      if (response.ok()) {
        return response;
      }
      if ([502, 503, 504].includes(response.status())) {
        lastError = new Error(`${options.label} failed with status ${response.status()}`);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw lastError ?? new Error(`${options.label} failed after ${timeoutMs}ms`);
}
