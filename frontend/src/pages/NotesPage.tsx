import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PaletteIcon from "@mui/icons-material/Palette";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import type { Note, NoteInput } from "../types/api";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notesApi";
import { logout as logoutApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";
import AppTopBar from "../components/AppTopBar";
import { NOTE_COLORS } from "../constants/noteColors";
import { getUserTags } from "../api/tagsApi";

type SortOrder = "desc" | "asc";

const NOTE_SORT_ORDER_KEY = "noteSortOrder";

function readSortOrder(): SortOrder {
  const value = localStorage.getItem(NOTE_SORT_ORDER_KEY);
  return value === "asc" ? "asc" : "desc";
}

function normalizeTag(rawTag: string): string {
  return rawTag.trim().toLowerCase();
}

export default function NotesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const tagSubmitLockRef = useRef(false);

  const [form, setForm] = useState<NoteInput>({
    title: "",
    content: "",
    colorHex: null,
    tagNames: [],
  });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Note | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => readSortOrder());
  const [paletteAnchorEl, setPaletteAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [paletteNote, setPaletteNote] = useState<Note | null>(null);
  const [tagInputByNoteId, setTagInputByNoteId] = useState<
    Record<number, string>
  >({});
  const [isTagCatalogEnabled, setIsTagCatalogEnabled] = useState(false);

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
    [auth.accessToken, auth.refreshToken, auth.setTokens, auth.logout],
  );

  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes(authPayload),
  });

  const tagCatalogQuery = useQuery({
    queryKey: ["tag-catalog"],
    queryFn: () => getUserTags(authPayload),
    enabled: isTagCatalogEnabled,
    staleTime: Infinity,
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

  const colorMutation = useMutation({
    mutationFn: ({ note, colorHex }: { note: Note; colorHex: string | null }) =>
      updateNote(
        note.id,
        {
          title: note.title,
          content: note.content,
          colorHex,
          tagNames: note.tagNames,
        },
        authPayload,
      ),
    onSuccess: async () => {
      setPaletteAnchorEl(null);
      setPaletteNote(null);
      await queryClient.refetchQueries({ queryKey: ["notes"] });
    },
  });

  const tagMutation = useMutation({
    mutationFn: ({
      note,
      tagNames,
      syncCatalog,
    }: {
      note: Note;
      tagNames: string[];
      syncCatalog: boolean;
    }) =>
      updateNote(
        note.id,
        {
          title: note.title,
          content: note.content,
          colorHex: note.colorHex,
          tagNames,
        },
        authPayload,
      ).then((result) => ({ result, syncCatalog })),
    onSuccess: async ({ syncCatalog }) => {
      await queryClient.refetchQueries({ queryKey: ["notes"] });

      if (syncCatalog) {
        await queryClient.invalidateQueries({
          queryKey: ["tag-catalog"],
          refetchType: "active",
        });
      }
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
    mutationFn: () =>
      logoutApi({ refreshToken: auth.refreshToken }, authPayload),
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
    setForm({ title: "", content: "", colorHex: null, tagNames: [] });
    setIsNoteDialogOpen(true);
  }

  function openEditDialog(note: Note) {
    createMutation.reset();
    updateMutation.reset();
    setEditingNoteId(note.id);
    setForm({
      title: note.title,
      content: note.content,
      colorHex: note.colorHex,
      tagNames: note.tagNames,
    });
    setIsNoteDialogOpen(true);
  }

  function closeNoteDialog() {
    setIsNoteDialogOpen(false);
    setEditingNoteId(null);
    setForm({ title: "", content: "", colorHex: null, tagNames: [] });
  }

  function openPalette(event: MouseEvent<HTMLElement>, note: Note) {
    setPaletteAnchorEl(event.currentTarget);
    setPaletteNote(note);
  }

  function clearTagInput(noteId: number) {
    setTagInputByNoteId((prev) => ({ ...prev, [noteId]: "" }));
  }

  function addTagToNote(note: Note, rawTag: string) {
    const normalizedTag = normalizeTag(rawTag);
    clearTagInput(note.id);

    if (!normalizedTag) {
      return;
    }

    if (note.tagNames.includes(normalizedTag)) {
      return;
    }

    const knownTags = tagCatalogQuery.data;
    const shouldSyncCatalog = !knownTags || !knownTags.includes(normalizedTag);

    tagMutation.mutate({
      note,
      tagNames: [...note.tagNames, normalizedTag],
      syncCatalog: shouldSyncCatalog,
    });
  }

  function submitInlineTag(note: Note, rawTag: string) {
    if (tagSubmitLockRef.current) {
      return;
    }

    tagSubmitLockRef.current = true;
    addTagToNote(note, rawTag);

    window.setTimeout(() => {
      tagSubmitLockRef.current = false;
    }, 0);
  }

  function removeTagFromNote(note: Note, tagToRemove: string) {
    tagMutation.mutate({
      note,
      tagNames: note.tagNames.filter((tag) => tag !== tagToRemove),
      syncCatalog: false,
    });
  }

  return (
    <Box>
      <AppTopBar
        onLogout={() => logoutMutation.mutate()}
        logoutDisabled={logoutMutation.isPending}
      />

      <Container sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel id="sort-notes-label">
                Sort by last modified
              </InputLabel>
              <Select
                labelId="sort-notes-label"
                value={sortOrder}
                label="Sort by last modified"
                onChange={(event) =>
                  setSortOrder(event.target.value as SortOrder)
                }
              >
                <MenuItem value="desc">Newest first</MenuItem>
                <MenuItem value="asc">Oldest first</MenuItem>
              </Select>
            </FormControl>

            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "stretch", sm: "flex-end" },
              }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
              >
                Add note
              </Button>
            </Box>
          </Stack>

          {notesQuery.isPending && <CircularProgress />}
          {notesQuery.isError && (
            <Alert severity="error">{getErrorMessage(notesQuery.error)}</Alert>
          )}
          {deleteMutation.isError && (
            <Alert severity="error">
              {getErrorMessage(deleteMutation.error)}
            </Alert>
          )}
          {colorMutation.isError && (
            <Alert severity="error">
              {getErrorMessage(colorMutation.error)}
            </Alert>
          )}
          {tagMutation.isError && (
            <Alert severity="error">{getErrorMessage(tagMutation.error)}</Alert>
          )}

          {notesQuery.isSuccess && (
            <Grid container spacing={2}>
              {sortedNotes.map((note) => {
                const inputValue = tagInputByNoteId[note.id] ?? "";
                const normalizedInput = normalizeTag(inputValue);
                const filteredOptions = (tagCatalogQuery.data ?? []).filter(
                  (tagName) =>
                    !note.tagNames.includes(tagName) &&
                    (normalizedInput === "" || tagName.includes(normalizedInput)),
                );

                return (
                  <Grid size={{ xs: 12, md: 6 }} key={note.id}>
                    <Card
                      sx={{
                        backgroundColor: note.colorHex ?? "background.paper",
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="h6">{note.title}</Typography>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={(event) => openPalette(event, note)}
                            >
                              <PaletteIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(note)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteCandidate(note)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1 }}
                        >
                          Last modified: {note.updatedAt.toLocaleString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}
                        >
                          {note.content}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            minHeight: 32,
                          }}
                        >
                          {note.tagNames.map((tagName) => (
                            <Chip
                              key={tagName}
                              size="small"
                              label={tagName}
                              onDelete={() => removeTagFromNote(note, tagName)}
                            />
                          ))}

                          <Autocomplete
                            freeSolo
                            size="small"
                            options={filteredOptions}
                            inputValue={inputValue}
                            onInputChange={(_, value, reason) => {
                              if (reason === "reset") {
                                return;
                              }

                              setTagInputByNoteId((prev) => ({
                                ...prev,
                                [note.id]: value,
                              }));
                            }}
                            onChange={(_, value) => {
                              if (typeof value === "string") {
                                submitInlineTag(note, value);
                              }
                            }}
                            sx={{ minWidth: 140, maxWidth: 220 }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="standard"
                                placeholder="Add tags..."
                                onFocus={() => setIsTagCatalogEnabled(true)}
                                onBlur={() =>
                                  submitInlineTag(
                                    note,
                                    tagInputByNoteId[note.id] ?? "",
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    submitInlineTag(
                                      note,
                                      tagInputByNoteId[note.id] ?? "",
                                    );
                                  }
                                }}
                                InputProps={{
                                  ...params.InputProps,
                                  disableUnderline: true,
                                  sx: { fontSize: 14 },
                                }}
                              />
                            )}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Stack>
      </Container>

      <Dialog
        open={isNoteDialogOpen}
        onClose={closeNoteDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={onSubmit}>
          <DialogTitle>
            {editingNoteId !== null ? "Edit note" : "Add note"}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Title"
              margin="normal"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Content"
              margin="normal"
              multiline
              minRows={5}
              value={form.content}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, content: event.target.value }))
              }
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2 }}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                size="small"
                variant={form.colorHex === null ? "contained" : "outlined"}
                onClick={() =>
                  setForm((prev) => ({ ...prev, colorHex: null }))
                }
              >
                No color
              </Button>
              {NOTE_COLORS.map((color) => (
                <IconButton
                  key={color}
                  size="small"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, colorHex: color }))
                  }
                  sx={{
                    width: 28,
                    height: 28,
                    border: "1px solid",
                    borderColor:
                      form.colorHex === color ? "text.primary" : "divider",
                    backgroundColor: color,
                    borderWidth: form.colorHex === color ? 2 : 1,
                  }}
                />
              ))}
            </Stack>
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

      <Popover
        open={Boolean(paletteAnchorEl) && Boolean(paletteNote)}
        anchorEl={paletteAnchorEl}
        onClose={() => {
          if (!colorMutation.isPending) {
            setPaletteAnchorEl(null);
            setPaletteNote(null);
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={!paletteNote || colorMutation.isPending}
            onClick={() => {
              if (paletteNote) {
                colorMutation.mutate({ note: paletteNote, colorHex: null });
              }
            }}
          >
            None
          </Button>
          {NOTE_COLORS.map((color) => (
            <IconButton
              key={color}
              size="small"
              disabled={!paletteNote || colorMutation.isPending}
              onClick={() => {
                if (paletteNote) {
                  colorMutation.mutate({ note: paletteNote, colorHex: color });
                }
              }}
              sx={{
                width: 26,
                height: 26,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: color,
              }}
            />
          ))}
        </Stack>
      </Popover>

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
          <Button
            onClick={() => setDeleteCandidate(null)}
            disabled={deleteMutation.isPending}
          >
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

