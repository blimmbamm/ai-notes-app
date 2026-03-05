import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "../api/authApi";
import { getErrorMessage } from "../utils/error";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: confirmPasswordReset,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ token, password });
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 8 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={2}>
          <Typography variant="h5">Reset password</Typography>

          {!token && <Alert severity="error">Reset token is missing.</Alert>}

          {token && mutation.isSuccess && (
            <Alert severity="success">
              Password has been reset. You can now <Link to="/login">log in</Link>.
            </Alert>
          )}

          {token && !mutation.isSuccess && (
            <Box component="form" onSubmit={onSubmit}>
              <TextField
                fullWidth
                type="password"
                label="New password"
                helperText="Use at least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {mutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {getErrorMessage(mutation.error)}
                </Alert>
              )}

              <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={mutation.isPending}>
                Set new password
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
