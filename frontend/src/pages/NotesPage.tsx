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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Note, NoteInput } from "../types/api";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notesApi";
import { logout as logoutApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";
import AppTopBar from "../components/AppTopBar";

type SortOrder = "desc" | "asc";

const NOTE_SORT_ORDER_KEY = "noteSortOrder";

function readSortOrder(): SortOrder {
  const value = localStorage.getItem(NOTE_SORT_ORDER_KEY);
  return value === "asc" ? "asc" : "desc";
}

export default function NotesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<NoteInput>({ title: "", content: "" });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Note | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => readSortOrder());

  useEffect(() => {
    localStorage.setItem(NOTE_SORT_ORDER_KEY, sortOrder);
  }, [sortOrder]);

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

  const sortedNotes = useMemo(() => {
    if (!notesQuery.data) {
      return [];
    }

    return [...notesQuery.data].sort((a, b) => {
      const delta = a.updatedAt.getTime() - b.updatedAt.getTime();
      return sortOrder === "asc" ? delta : -delta;
    });
  }, [notesQuery.data, sortOrder]);

  const createMutation = useMutation({
    mutationFn: (payload: NoteInput) => createNote(payload, authPayload),
    onSuccess: async () => {
      closeNoteDialog();
      await queryClient.refetchQueries({ queryKey: ["notes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoteInput }) =>
      updateNote(id, payload, authPayload),
    onSuccess: async () => {
      closeNoteDialog();
      await queryClient.refetchQueries({ queryKey: ["notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNote(id, authPayload),
    onSuccess: async () => {
      setDeleteCandidate(null);
      await queryClient.refetchQueries({ queryKey: ["notes"] });
    },
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

    if (editingNoteId !== null) {
      updateMutation.mutate({ id: editingNoteId, payload: form });
      return;
    }

    createMutation.mutate(form);
  };

  function openCreateDialog() {
    createMutation.reset();
    updateMutation.reset();
    setEditingNoteId(null);
    setForm({ title: "", content: "" });
    setIsNoteDialogOpen(true);
  }

  function openEditDialog(note: Note) {
    createMutation.reset();
    updateMutation.reset();
    setEditingNoteId(note.id);
    setForm({ title: note.title, content: note.content });
    setIsNoteDialogOpen(true);
  }

  function closeNoteDialog() {
    setIsNoteDialogOpen(false);
    setEditingNoteId(null);
    setForm({ title: "", content: "" });
  }

  return (
    <Box>
      <AppTopBar onLogout={() => logoutMutation.mutate()} logoutDisabled={logoutMutation.isPending} />

      <Container sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel id="sort-notes-label">Sort by last modified</InputLabel>
              <Select
                labelId="sort-notes-label"
                value={sortOrder}
                label="Sort by last modified"
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              >
                <MenuItem value="desc">Newest first</MenuItem>
                <MenuItem value="asc">Oldest first</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                Add note
              </Button>
            </Box>
          </Stack>

          {notesQuery.isPending && <CircularProgress />}
          {notesQuery.isError && <Alert severity="error">{getErrorMessage(notesQuery.error)}</Alert>}
          {deleteMutation.isError && <Alert severity="error">{getErrorMessage(deleteMutation.error)}</Alert>}

          {notesQuery.isSuccess && (
            <Grid container spacing={2}>
              {sortedNotes.map((note) => (
                <Grid size={{ xs: 12, md: 6 }} key={note.id}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h6">{note.title}</Typography>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => openEditDialog(note)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteCandidate(note)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        Last modified: {note.updatedAt.toLocaleString()}
                      </Typography>
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

      <Dialog open={isNoteDialogOpen} onClose={closeNoteDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={onSubmit}>
          <DialogTitle>{editingNoteId !== null ? "Edit note" : "Add note"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
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
              minRows={5}
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            />
            {formErrorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formErrorMessage}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeNoteDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingNoteId !== null ? "Save" : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={deleteCandidate !== null}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteCandidate(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete note?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteCandidate
              ? `This will permanently delete "${deleteCandidate.title}".`
              : "This will permanently delete this note."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCandidate(null)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!deleteCandidate || deleteMutation.isPending}
            onClick={() => {
              if (deleteCandidate) {
                deleteMutation.mutate(deleteCandidate.id);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
