import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import VerifyEmailPage from "./VerifyEmailPage";
import { verifyEmail } from "../api/authApi";

vi.mock("../api/authApi", () => ({
  verifyEmail: vi.fn(),
}));

const verifyEmailMock = vi.mocked(verifyEmail);

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
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

test("shows an error when no token is provided", async () => {
  renderVerifyEmailPage("/verify-email");

  expect(await screen.findByText("Token is missing.")).toBeInTheDocument();
});

test("verifies email token and shows success", async () => {
  verifyEmailMock.mockResolvedValue({ message: "ok" });

  renderVerifyEmailPage("/verify-email?token=token123");

  await waitFor(() => expect(verifyEmailMock).toHaveBeenCalledWith("token123"));
  expect(await screen.findByText("Email verified. You can login now.")).toBeInTheDocument();
});
