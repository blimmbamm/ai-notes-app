import { render, screen } from "@testing-library/react";
import AuthLayout from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders title and children", () => {
    render(
      <AuthLayout title="Sign in">
        <div>Inner content</div>
      </AuthLayout>
    );

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Inner content")).toBeInTheDocument();
  });
});
