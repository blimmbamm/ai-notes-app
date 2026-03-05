import { Alert, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authApi";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const query = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 8 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Email verification</Typography>
        {!token && <Alert severity="error">Token is missing.</Alert>}
        {token && query.isLoading && <CircularProgress />}
        {query.isError && <Alert severity="error">{query.error.message}</Alert>}
        {query.isSuccess && <Alert severity="success">Email verified. You can login now.</Alert>}
      </Paper>
    </Container>
  );
}
