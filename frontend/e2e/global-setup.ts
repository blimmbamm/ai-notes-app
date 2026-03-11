import { chromium, request } from "@playwright/test";
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

  console.log(apiBaseURL)

  const signupResponse = await api.post("/api/auth/signup", {
    data: { email, password },
  });

  console.log(signupResponse.url())

  if (!signupResponse.ok()) {
    throw new Error(`Signup failed with status ${signupResponse.status()}`);
  }

  const token = await waitForEmailVerificationToken(email);
  const verifyResponse = await api.get(`/api/auth/verify?token=${encodeURIComponent(token)}`);

  if (!verifyResponse.ok()) {
    throw new Error(`Email verification failed with status ${verifyResponse.status()}`);
  }

  const loginResponse = await api.post("/api/auth/login", {
    data: { email, password },
  });

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
