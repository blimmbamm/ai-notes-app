import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import type { NoteInput } from "../types/api";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notesApi";
import { logout as logoutApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";

export default function NotesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<NoteInput>({ title: "", content: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

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
    mutationFn: (payload: NoteInput) => createNote(payload, authPayload),
    onSuccess: () => {
      setForm({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoteInput }) =>
      updateNote(id, payload, authPayload),
    onSuccess: () => {
      setEditingId(null);
      setForm({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNote(id, authPayload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutApi({ refreshToken: auth.refreshToken }, authPayload),
    onSettled: () => auth.logout(),
  });

  const formErrorMessage = createMutation.isError
    ? getErrorMessage(createMutation.error)
    : updateMutation.isError
      ? getErrorMessage(updateMutation.error)
      : "";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, payload: form });
      return;
    }

    createMutation.mutate(form);
  };

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Notes App
          </Typography>
          <Button color="inherit" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Box
            component="form"
            onSubmit={onSubmit}
            sx={{ background: "white", p: { xs: 2, md: 3 }, borderRadius: 2 }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              {editingId !== null ? "Edit note" : "Create note"}
            </Typography>
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
            {formErrorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formErrorMessage}
              </Alert>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId !== null ? "Save" : "Add note"}
              </Button>
              {editingId !== null && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ title: "", content: "" });
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Box>

          {notesQuery.isPending && <CircularProgress />}
          {notesQuery.isError && <Alert severity="error">{getErrorMessage(notesQuery.error)}</Alert>}

          {notesQuery.isSuccess && (
            <Grid container spacing={2}>
              {notesQuery.data.map((note) => (
                <Grid size={{ xs: 12, md: 6 }} key={note.id}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h6">{note.title}</Typography>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingId(note.id);
                              setForm({ title: note.title, content: note.content });
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(note.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
