import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "./SignupPage";
import { signup } from "../api/authApi";

vi.mock("../api/authApi", () => ({
  signup: vi.fn(),
}));

const signupMock = vi.mocked(signup);

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
    </QueryClientProvider>,
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

test("submits signup form and shows success", async () => {
  const user = userEvent.setup();
  signupMock.mockResolvedValue({ message: "ok" });

  renderSignupPage();

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  await waitFor(() => expect(signupMock).toHaveBeenCalledWith({
    email: "new@example.com",
    password: "password123",
  }, expect.anything()));

  expect(
    await screen.findByText("Signup succeeded. Check SMTP4DEV mail and verify your email."),
  ).toBeInTheDocument();
});
