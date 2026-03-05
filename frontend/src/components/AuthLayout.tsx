import { Box, Container, Paper, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 8 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          {title}
        </Typography>
        <Box>{children}</Box>
      </Paper>
    </Container>
  );
}
