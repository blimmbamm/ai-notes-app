import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AccountPage from "./AccountPage";
import { deleteAccount, getAccount, requestCurrentUserPasswordReset } from "../api/accountApi";
import { logout } from "../api/authApi";

const { logout: authLogout } = vi.hoisted(() => ({
  logout: vi.fn(),
}));

vi.mock("../api/accountApi", () => ({
  getAccount: vi.fn(),
  requestCurrentUserPasswordReset: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
  logout: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "token",
    refreshToken: "refresh",
    setTokens: vi.fn(),
    logout: authLogout,
    isAuthenticated: true,
  }),
}));

vi.mock("../components/AppTopBar", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <button type="button" onClick={onLogout}>
      TopLogout
    </button>
  ),
}));

const getAccountMock = vi.mocked(getAccount);
const requestResetMock = vi.mocked(requestCurrentUserPasswordReset);
const deleteAccountMock = vi.mocked(deleteAccount);
const logoutMock = vi.mocked(logout);

const renderAccountPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

test("renders account data", async () => {
  const createdAt = new Date("2024-01-02T10:00:00Z");
  getAccountMock.mockResolvedValue({
    email: "user@example.com",
    createdAt,
  });

  renderAccountPage();

  expect(await screen.findByText(/Email:/)).toBeInTheDocument();
  expect(screen.getByText("user@example.com")).toBeInTheDocument();
  expect(screen.getByText(new RegExp(createdAt.toLocaleString()))).toBeInTheDocument();
});

test("sends password reset request", async () => {
  const user = userEvent.setup();
  getAccountMock.mockResolvedValue({
    email: "user@example.com",
    createdAt: new Date("2024-01-02T10:00:00Z"),
  });
  requestResetMock.mockResolvedValue({ message: "ok" });

  renderAccountPage();

  await user.click(await screen.findByRole("button", { name: "Send reset email" }));

  await waitFor(() => expect(requestResetMock).toHaveBeenCalled());
  expect(await screen.findByText("Password reset email sent.")).toBeInTheDocument();
});

test("deletes account after confirmation", async () => {
  const user = userEvent.setup();
  getAccountMock.mockResolvedValue({
    email: "user@example.com",
    createdAt: new Date("2024-01-02T10:00:00Z"),
  });
  deleteAccountMock.mockResolvedValue({ message: "ok" });

  renderAccountPage();

  await user.click(await screen.findByRole("button", { name: "Delete account" }));

  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Delete account" }));

  await waitFor(() => expect(deleteAccountMock).toHaveBeenCalled());
  expect(authLogout).toHaveBeenCalled();
});

test("logs out from top bar", async () => {
  const user = userEvent.setup();
  getAccountMock.mockResolvedValue({
    email: "user@example.com",
    createdAt: new Date("2024-01-02T10:00:00Z"),
  });
  logoutMock.mockResolvedValue({ message: "ok" });

  renderAccountPage();

  await user.click(await screen.findByRole("button", { name: "TopLogout" }));

  await waitFor(() => expect(logoutMock).toHaveBeenCalledWith(
    { refreshToken: "refresh" },
    expect.anything(),
  ));
  expect(authLogout).toHaveBeenCalled();
});
