import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import VerifyEmailPage from "./VerifyEmailPage";

let verifyRequestCount = 0;

const server = setupServer(
  http.get("/api/auth/verify", ({ request }) => {
    verifyRequestCount += 1;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return HttpResponse.json({ message: "Token is missing." }, { status: 400 });
    }

    return HttpResponse.json({ message: "ok" });
  })
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  verifyRequestCount = 0;
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const renderVerifyEmailPage = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <VerifyEmailPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

test("shows an error when no token is provided and does not call the API", async () => {
  renderVerifyEmailPage("/verify-email");

  expect(await screen.findByText("Token is missing.")).toBeInTheDocument();

  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(verifyRequestCount).toBe(0);
});

test("verifies email token through the real auth API and shows success", async () => {
  renderVerifyEmailPage("/verify-email?token=token123");

  expect(await screen.findByText("Email verified. You can login now.")).toBeInTheDocument();
});

test("shows a loading state while verification is in flight", async () => {
  server.use(
    http.get("/api/auth/verify", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json({ message: "ok" });
    })
  );

  renderVerifyEmailPage("/verify-email?token=token123");

  expect(await screen.findByRole("progressbar")).toBeInTheDocument();
  expect(await screen.findByText("Email verified. You can login now.")).toBeInTheDocument();
});

test("shows backend error when token is invalid", async () => {
  server.use(
    http.get("/api/auth/verify", () =>
      HttpResponse.json({ message: "Invalid or expired token." }, { status: 400 })
    )
  );

  renderVerifyEmailPage("/verify-email?token=badtoken");

  expect(await screen.findByText("Invalid or expired token.")).toBeInTheDocument();
});

test("shows a network error when verification fails to reach the server", async () => {
  server.use(
    http.get("/api/auth/verify", () => HttpResponse.error())
  );

  renderVerifyEmailPage("/verify-email?token=token123");

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/Failed to fetch|fetch failed|Request failed/i);
});
