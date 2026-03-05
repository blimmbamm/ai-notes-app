import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid2,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notesApi";
import { logout as logoutApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function NotesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState(null);

  const authPayload = useMemo(
    () => ({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      setTokens: auth.setTokens,
      logout: auth.logout,
    }),
    [auth.accessToken, auth.refreshToken, auth.setTokens, auth.logout]
  );

  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes(authPayload),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createNote(payload, authPayload),
    onSuccess: () => {
      setForm({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateNote(id, payload, authPayload),
    onSuccess: () => {
      setEditingId(null);
      setForm({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNote(id, authPayload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutApi({ refreshToken: auth.refreshToken }, authPayload),
    onSettled: () => auth.logout(),
  });

  const onSubmit = (event) => {
    event.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: form });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Notes App</Typography>
          <Button color="inherit" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Box component="form" onSubmit={onSubmit} sx={{ background: "white", p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{editingId ? "Edit note" : "Create note"}</Typography>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <TextField
              fullWidth
              label="Content"
              margin="normal"
              multiline
              minRows={4}
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            />
            {(createMutation.isError || updateMutation.isError) && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createMutation.error?.message || updateMutation.error?.message}
              </Alert>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save" : "Add note"}
              </Button>
              {editingId && (
                <Button variant="outlined" onClick={() => {
                  setEditingId(null);
                  setForm({ title: "", content: "" });
                }}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Box>

          {notesQuery.isLoading && <CircularProgress />}
          {notesQuery.isError && <Alert severity="error">{notesQuery.error.message}</Alert>}

          {notesQuery.isSuccess && (
            <Grid2 container spacing={2}>
              {notesQuery.data.map((note) => (
                <Grid2 size={{ xs: 12, md: 6 }} key={note.id}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h6">{note.title}</Typography>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => {
                            setEditingId(note.id);
                            setForm({ title: note.title, content: note.content });
                          }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(note.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{note.content}</Typography>
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
