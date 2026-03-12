import { Alert, Box, Button, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { login, type LoginRequest } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";

export default function LoginPage() {
  const { setAuthenticated } = useAuth();
  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      setAuthenticated(true);
    },
  });

  return (
    <AuthLayout title="Login">
      <Stack spacing={2}>
        <Button
          variant="outlined"
          component="a"
          href="/oauth2/authorization/google"
          sx={{ textTransform: "none" }}
        >
          Continue with Google
        </Button>

        <Divider>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

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

        <Link component={NavLink} to="/signup" sx={{ display: "inline-block", mt: 2 }}>
          No account yet? Sign up
        </Link>
        </Box>
      </Stack>
    </AuthLayout>
  );
}
