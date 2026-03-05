import { Alert, Box, Button, Link, TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { signup } from "../api/authApi";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: signup,
  });

  return (
    <AuthLayout title="Create account">
      <Box component="form" onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(form);
      }}>
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
          helperText="Use at least 8 characters"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />

        {mutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{mutation.error.message}</Alert>}
        {mutation.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Signup succeeded. Check SMTP4DEV mail and verify your email.</Alert>}

        <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }} disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account..." : "Sign up"}
        </Button>

        <Link component={RouterLink} to="/login" sx={{ display: "inline-block", mt: 2 }}>
          Already have an account? Login
        </Link>
      </Box>
    </AuthLayout>
  );
}
