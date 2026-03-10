import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import SignupPage from "./SignupPage";

const server = setupServer(
  http.post("/api/auth/signup", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body?.email || !body?.password) {
      return HttpResponse.json({ message: "Missing credentials." }, { status: 400 });
    }

    return HttpResponse.json({ message: "ok" });
  })
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const renderSignupPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

test("signs up a user through the real auth API and shows success", async () => {
  const user = userEvent.setup();

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  await waitFor(() => {
    expect(
      screen.getByText("Signup succeeded. Check SMTP4DEV mail and verify your email.")
    ).toBeInTheDocument();
  });
});

test("shows an error when the account already exists", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/auth/signup", () =>
      HttpResponse.json({ message: "Account already exists." }, { status: 409 })
    )
  );

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Account already exists.")).toBeInTheDocument();
});

test("shows backend validation error when password is too short", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/auth/signup", () =>
      HttpResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 })
    )
  );

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "short");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
});

test("shows loading state while request is in flight", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/auth/signup", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json({ message: "ok" });
    })
  );

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  const pendingButton = screen.getByRole("button", { name: "Creating account..." });
  expect(pendingButton).toBeDisabled();

  expect(
    await screen.findByText("Signup succeeded. Check SMTP4DEV mail and verify your email.")
  ).toBeInTheDocument();

  expect(screen.getByRole("button", { name: "Sign up" })).toBeEnabled();
});

test("clears an error after a successful retry", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/auth/signup", () =>
      HttpResponse.json({ message: "Account already exists." }, { status: 409 })
    )
  );

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Account already exists.")).toBeInTheDocument();

  server.use(
    http.post("/api/auth/signup", () => HttpResponse.json({ message: "ok" }))
  );

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByText("Signup succeeded. Check SMTP4DEV mail and verify your email.")
  ).toBeInTheDocument();
  expect(screen.queryByText("Account already exists.")).not.toBeInTheDocument();
});

test("shows a generic server error for a 500 response", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/auth/signup", () =>
      HttpResponse.text("Server error", { status: 500 })
    )
  );

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Request failed with status 500")).toBeInTheDocument();
});

test("shows a network error when the request fails to reach the server", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/auth/signup", () => HttpResponse.error())
  );

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/Failed to fetch|fetch failed|Request failed/i);
});

test("links to the login page", () => {
  renderSignupPage();

  expect(screen.getByRole("link", { name: "Already have an account? Login" }))
    .toHaveAttribute("href", "/login");
});
