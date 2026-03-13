import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import { login } from "../api/authApi";

const { setAuthenticated } = vi.hoisted(() => ({
  setAuthenticated: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
  login: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    setAuthenticated,
    logout: vi.fn(),
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

test("submits login credentials and marks session as authenticated", async () => {
  const user = userEvent.setup();
  loginMock.mockResolvedValue({ message: "Login successful" });

  renderLoginPage();

  await user.type(screen.getByLabelText("Email"), "user@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Login" }));
  
  await waitFor(() => {
    expect(loginMock).toHaveBeenCalledWith(
      {
        email: "user@example.com",
        password: "password123",
      },
      expect.anything(),
    );
  });
  expect(setAuthenticated).toHaveBeenCalledWith(true);
});
