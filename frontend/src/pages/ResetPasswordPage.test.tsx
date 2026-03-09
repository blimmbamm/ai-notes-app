import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ResetPasswordPage from "./ResetPasswordPage";
import { confirmPasswordReset } from "../api/authApi";

vi.mock("../api/authApi", () => ({
  confirmPasswordReset: vi.fn(),
}));

const confirmPasswordResetMock = vi.mocked(confirmPasswordReset);

const renderResetPasswordPage = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <ResetPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

test("shows an error when token is missing", async () => {
  renderResetPasswordPage("/reset");

  expect(await screen.findByText("Reset token is missing.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Set new password" })).not.toBeInTheDocument();
});

test("submits password reset when token is present", async () => {
  const user = userEvent.setup();
  confirmPasswordResetMock.mockResolvedValue({ message: "ok" });

  renderResetPasswordPage("/reset?token=abc123");

  await user.type(screen.getByLabelText("New password"), "newpassword123");
  await user.click(screen.getByRole("button", { name: "Set new password" }));

  await waitFor(() => expect(confirmPasswordResetMock).toHaveBeenCalledWith({
    token: "abc123",
    password: "newpassword123",
  }, expect.anything()));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Password has been reset. You can now log in.");
});
