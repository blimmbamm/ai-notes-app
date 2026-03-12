import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { deleteAccount, getAccount, requestCurrentUserPasswordReset } from "../api/accountApi";
import { logout as logoutApi } from "../api/authApi";
import AppTopBar from "../components/AppTopBar";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";

export default function AccountPage() {
  const auth = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const accountQuery = useQuery({
    queryKey: ["account"],
    queryFn: () => getAccount(auth),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutApi(auth),
    onSettled: () => {
      auth.logout();
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => requestCurrentUserPasswordReset(auth),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteAccount(auth),
    onSuccess: () => {
      auth.logout();
    },
  });

  return (
    <Box>
      <AppTopBar onLogout={() => logoutMutation.mutate()} logoutDisabled={logoutMutation.isPending} />

      <Container sx={{ py: { xs: 2, md: 4 } }} maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h5">User account</Typography>

          <Card>
            <CardContent>
              {accountQuery.isPending && <CircularProgress />}
              {accountQuery.isError && <Alert severity="error">{getErrorMessage(accountQuery.error)}</Alert>}
              {accountQuery.isSuccess && (
                <Stack spacing={1}>
                  <Typography>
                    <strong>Email:</strong> {accountQuery.data.email}
                  </Typography>
                  <Typography>
                    <strong>Member since:</strong> {accountQuery.data.createdAt.toLocaleString()}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Reset password</Typography>
                <Typography color="text.secondary">
                  Send a password reset email. You can set a new password through the link in the email.
                </Typography>
                {resetPasswordMutation.isError && (
                  <Alert severity="error">{getErrorMessage(resetPasswordMutation.error)}</Alert>
                )}
                {resetPasswordMutation.isSuccess && (
                  <Alert severity="success">Password reset email sent.</Alert>
                )}
                <Box>
                  <Button
                    variant="contained"
                    onClick={() => resetPasswordMutation.mutate()}
                    disabled={resetPasswordMutation.isPending}
                  >
                    Send reset email
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" color="error.main">
                  Delete account
                </Typography>
                <Typography color="text.secondary">
                  Permanently delete your account and all notes. This action cannot be undone.
                </Typography>
                {deleteAccountMutation.isError && (
                  <Alert severity="error">{getErrorMessage(deleteAccountMutation.error)}</Alert>
                )}
                <Box>
                  <Button color="error" variant="contained" onClick={() => setDeleteDialogOpen(true)}>
                    Delete account
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleteAccountMutation.isPending) {
            setDeleteDialogOpen(false);
          }
        }}
      >
        <DialogTitle>Delete account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete your account and all your notes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteAccountMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteAccountMutation.isPending}
            onClick={() => deleteAccountMutation.mutate()}
          >
            Delete account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
