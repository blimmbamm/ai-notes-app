import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import { login } from "../api/authApi";

const { setTokens } = vi.hoisted(() => ({
  setTokens: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
  login: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "",
    refreshToken: "",
    setTokens,
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}));

const loginMock = vi.mocked(login);

const renderLoginPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

test("submits login credentials and stores tokens", async () => {
  const user = userEvent.setup();
  loginMock.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });

  renderLoginPage();

  await user.type(screen.getByLabelText("Email"), "user@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Login" }));

  await waitFor(() => expect(loginMock).toHaveBeenCalledWith({
    email: "user@example.com",
    password: "password123",
  }, expect.anything()));
  expect(setTokens).toHaveBeenCalledWith("access", "refresh");
});
