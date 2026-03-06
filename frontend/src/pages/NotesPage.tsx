import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  useMediaQuery,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type SubmitEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import type { Note, NoteInput } from "../types/api";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notesApi";
import { logout as logoutApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/error";
import AppTopBar from "../components/AppTopBar";
import { getUserTags } from "../api/tagsApi";
import NoteCard from "../components/notes/NoteCard";
import NoteEditorDialog from "../components/notes/NoteEditorDialog";
import DeleteNoteDialog from "../components/notes/DeleteNoteDialog";
import NoteColorPopover from "../components/notes/NoteColorPopover";
import NotesTagSidenav from "../components/notes/NotesTagSidenav";

type SortOrder = "desc" | "asc";

const NOTE_SORT_ORDER_KEY = "noteSortOrder";
const SIDENAV_WIDTH = 240;

function readSortOrder(): SortOrder {
  const value = localStorage.getItem(NOTE_SORT_ORDER_KEY);
  return value === "asc" ? "asc" : "desc";
}

function normalizeTag(rawTag: string): string {
  return rawTag.trim().toLowerCase();
}

interface NotesSnapshotContext {
  previousNotes: Note[] | undefined;
}

export default function NotesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const tagSubmitLockRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [form, setForm] = useState<NoteInput>({ title: "", content: "", colorHex: null, tagNames: [] });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Note | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => readSortOrder());
  const [paletteAnchorEl, setPaletteAnchorEl] = useState<HTMLElement | null>(null);
  const [paletteNote, setPaletteNote] = useState<Note | null>(null);
  const [tagInputByNoteId, setTagInputByNoteId] = useState<Record<number, string>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedTagParam = normalizeTag(searchParams.get("tag") ?? "");

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
    staleTime: Infinity,
  });

  const filteredAndSortedNotes = useMemo(() => {
    if (!notesQuery.data) {
      return [];
    }

    const filtered = selectedTagParam
      ? notesQuery.data.filter((note) => note.tagNames.includes(selectedTagParam))
      : notesQuery.data;

    return [...filtered].sort((a, b) => {
      const delta = a.updatedAt.getTime() - b.updatedAt.getTime();
      return sortOrder === "asc" ? delta : -delta;
    });
  }, [notesQuery.data, selectedTagParam, sortOrder]);

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

  const colorMutation = useMutation<
    Note,
    Error,
    { note: Note; colorHex: string | null },
    NotesSnapshotContext
  >({
    mutationFn: ({ note, colorHex }) =>
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
    onMutate: async ({ note, colorHex }) => {
      closePalette();
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);
      queryClient.setQueryData<Note[]>(["notes"], (currentNotes) =>
        currentNotes?.map((currentNote) =>
          currentNote.id === note.id
            ? { ...currentNote, colorHex, updatedAt: new Date() }
            : currentNote,
        ),
      );

      return { previousNotes };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(["notes"], context?.previousNotes);
    },
    onSettled: async () => {
      await queryClient.refetchQueries({ queryKey: ["notes"] });
    },
  });

  const tagMutation = useMutation<
    { result: Note; syncCatalog: boolean },
    Error,
    { note: Note; tagNames: string[]; syncCatalog: boolean },
    NotesSnapshotContext
  >({
    mutationFn: ({ note, tagNames, syncCatalog }) =>
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
    onMutate: async ({ note, tagNames }) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);
      queryClient.setQueryData<Note[]>(["notes"], (currentNotes) =>
        currentNotes?.map((currentNote) =>
          currentNote.id === note.id
            ? { ...currentNote, tagNames, updatedAt: new Date() }
            : currentNote,
        ),
      );

      return { previousNotes };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(["notes"], context?.previousNotes);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.refetchQueries({ queryKey: ["notes"] });

      if (variables.syncCatalog) {
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
    mutationFn: () => logoutApi({ refreshToken: auth.refreshToken }, authPayload),
    onSettled: () => auth.logout(),
  });

  const formErrorMessage = createMutation.isError
    ? getErrorMessage(createMutation.error)
    : updateMutation.isError
      ? getErrorMessage(updateMutation.error)
      : "";

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingNoteId !== null) {
      updateMutation.mutate({ id: editingNoteId, payload: form });
      return;
    }

    const createPayload: NoteInput =
      selectedTagParam && !form.tagNames.includes(selectedTagParam)
        ? { ...form, tagNames: [...form.tagNames, selectedTagParam] }
        : form;

    createMutation.mutate(createPayload);
  };

  function selectTag(tagName: string | null) {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (tagName) {
        nextParams.set("tag", tagName);
      } else {
        nextParams.delete("tag");
      }
      return nextParams;
    });

    if (isMobile) {
      setMobileNavOpen(false);
    }
  }

  function openCreateDialog() {
    createMutation.reset();
    updateMutation.reset();
    setEditingNoteId(null);
    setForm({
      title: "",
      content: "",
      colorHex: null,
      tagNames: selectedTagParam ? [selectedTagParam] : [],
    });
    setIsNoteDialogOpen(true);
  }

  function openEditDialog(note: Note) {
    createMutation.reset();
    updateMutation.reset();
    setEditingNoteId(note.id);
    setForm({ title: note.title, content: note.content, colorHex: note.colorHex, tagNames: note.tagNames });
    setIsNoteDialogOpen(true);
  }

  function closeNoteDialog() {
    setIsNoteDialogOpen(false);
    setEditingNoteId(null);
    setForm({
      title: "",
      content: "",
      colorHex: null,
      tagNames: selectedTagParam ? [selectedTagParam] : [],
    });
  }

  function openPalette(event: MouseEvent<HTMLElement>, note: Note) {
    setPaletteAnchorEl(event.currentTarget);
    setPaletteNote(note);
  }

  function closePalette() {
    setPaletteAnchorEl(null);
    setPaletteNote(null);
  }

  function clearTagInput(noteId: number) {
    setTagInputByNoteId((prev) => ({ ...prev, [noteId]: "" }));
  }

  function addTagToNote(note: Note, rawTag: string) {
    const normalizedTag = normalizeTag(rawTag);
    clearTagInput(note.id);

    if (!normalizedTag || note.tagNames.includes(normalizedTag)) {
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
        showMenuButton={isMobile}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <Box sx={{ display: "flex" }}>
        <NotesTagSidenav
          tags={tagCatalogQuery.data ?? []}
          selectedTag={selectedTagParam}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          onSelectTag={selectTag}
          width={SIDENAV_WIDTH}
        />

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
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
              {tagCatalogQuery.isError && <Alert severity="error">{getErrorMessage(tagCatalogQuery.error)}</Alert>}
              {deleteMutation.isError && <Alert severity="error">{getErrorMessage(deleteMutation.error)}</Alert>}
              {colorMutation.isError && <Alert severity="error">{getErrorMessage(colorMutation.error)}</Alert>}
              {tagMutation.isError && <Alert severity="error">{getErrorMessage(tagMutation.error)}</Alert>}

              {notesQuery.isSuccess && filteredAndSortedNotes.length === 0 && (
                <Box
                  sx={{
                    minHeight: { xs: "40vh", md: "50vh" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "text.disabled",
                    fontSize: "0.95rem",
                  }}
                >
                  {selectedTagParam
                    ? `No notes found for tag "${selectedTagParam}".`
                    : "No notes yet. Create your first note."}
                </Box>
              )}

              {notesQuery.isSuccess && filteredAndSortedNotes.length > 0 && (
                <Grid container spacing={2}>
                  {filteredAndSortedNotes.map((note) => {
                    const inputValue = tagInputByNoteId[note.id] ?? "";
                    const normalizedInput = normalizeTag(inputValue);
                    const tagOptions = (tagCatalogQuery.data ?? []).filter(
                      (tagName) => !note.tagNames.includes(tagName) && (normalizedInput === "" || tagName.includes(normalizedInput)),
                    );

                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={note.id}>
                        <NoteCard
                          note={note}
                          tagInputValue={inputValue}
                          tagOptions={tagOptions}
                          onTagInputFocus={() => {
                            if (tagCatalogQuery.isStale) {
                              queryClient.refetchQueries({ queryKey: ["tag-catalog"] });
                            }
                          }}
                          onTagInputChange={(value, reason) => {
                            if (reason === "reset") {
                              return;
                            }

                            setTagInputByNoteId((prev) => ({ ...prev, [note.id]: value }));
                          }}
                          onTagSubmit={(value) => submitInlineTag(note, value)}
                          onTagRemove={(tagName) => removeTagFromNote(note, tagName)}
                          onOpenPalette={(event) => openPalette(event, note)}
                          onEdit={() => openEditDialog(note)}
                          onDelete={() => setDeleteCandidate(note)}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Stack>
          </Container>
        </Box>
      </Box>

      <NoteEditorDialog
        open={isNoteDialogOpen}
        isEditing={editingNoteId !== null}
        form={form}
        isPending={createMutation.isPending || updateMutation.isPending}
        errorMessage={formErrorMessage}
        onClose={closeNoteDialog}
        onSubmit={onSubmit}
        onTitleChange={(title) => setForm((prev) => ({ ...prev, title }))}
        onContentChange={(content) => setForm((prev) => ({ ...prev, content }))}
        onColorChange={(colorHex) => setForm((prev) => ({ ...prev, colorHex }))}
      />

      <NoteColorPopover
        open={Boolean(paletteAnchorEl) && Boolean(paletteNote)}
        anchorEl={paletteAnchorEl}
        isPending={colorMutation.isPending}
        onClose={closePalette}
        onSelectNone={() => {
          if (paletteNote) {
            colorMutation.mutate({ note: paletteNote, colorHex: null });
          }
        }}
        onSelectColor={(colorHex) => {
          if (paletteNote) {
            colorMutation.mutate({ note: paletteNote, colorHex });
          }
        }}
      />

      <DeleteNoteDialog
        note={deleteCandidate}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteMutation.mutate(deleteCandidate.id);
          }
        }}
      />
    </Box>
  );
}





