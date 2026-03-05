import { Alert, Box, Button, Link, TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { login, type LoginRequest } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate("/notes");
    },
  });

  return (
    <AuthLayout title="Login">
      <Box
        component="form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          mutation.mutate(form);
        }}
      >
        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />

        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {getErrorMessage(mutation.error)}
          </Alert>
        )}

        <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }} disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in..." : "Login"}
        </Button>

        <Link component={RouterLink} to="/signup" sx={{ display: "inline-block", mt: 2 }}>
          No account yet? Sign up
        </Link>
      </Box>
    </AuthLayout>
  );
}
