import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import NotesPage from "./NotesPage";
import type { Note } from "../types/api";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notesApi";
import { createTag, deleteTag, getUserTags, renameTag } from "../api/tagsApi";

vi.mock("../api/notesApi", () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock("../api/tagsApi", () => ({
  getUserTags: vi.fn(),
  createTag: vi.fn(),
  renameTag: vi.fn(),
  deleteTag: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
  logout: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    setAuthenticated: vi.fn(),
  }),
}));

vi.mock("../components/AppTopBar", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <button type="button" onClick={onLogout}>
      Logout
    </button>
  ),
}));

vi.mock("../components/notes/NoteCard", () => ({
  default: ({
    note,
    tagInputValue,
    tagOptions,
    onTagInputFocus,
    onTagInputChange,
    onTagSubmit,
    onTagRemove,
    onOpenPalette,
    onEdit,
    onDelete,
  }: {
    note: Note;
    tagInputValue: string;
    tagOptions: string[];
    onTagInputFocus: () => void;
    onTagInputChange: (value: string, reason: string) => void;
    onTagSubmit: (value: string) => void;
    onTagRemove: (tagName: string) => void;
    onOpenPalette: (event: unknown) => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid={`note-card-${note.id}`}>
      <div>{note.title}</div>
      <div data-testid={`note-tags-${note.id}`}>{note.tagNames.join(",")}</div>
      <div data-testid={`note-tag-input-${note.id}`}>{tagInputValue}</div>
      <div data-testid={`note-tag-options-${note.id}`}>{tagOptions.join(",")}</div>
      <button type="button" onClick={onEdit}>
        Edit
      </button>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
      <button type="button" onClick={() => onOpenPalette({ currentTarget: document.body })}>
        Palette
      </button>
      <button type="button" onClick={() => onTagInputFocus()}>
        FocusTagInput
      </button>
      <button type="button" onClick={() => onTagInputChange("work", "input")}>
        ChangeTagInput
      </button>
      <button type="button" onClick={() => onTagSubmit(" NewTag ")}>AddTag</button>
      <button type="button" onClick={() => onTagRemove(note.tagNames[0] ?? "work")}>
        RemoveTag
      </button>
    </div>
  ),
}));

vi.mock("../components/notes/NoteEditorDialog", () => ({
  default: ({
    open,
    isEditing,
    form,
    errorMessage,
    onClose,
    onSubmit,
    onTitleChange,
    onContentChange,
    onColorChange,
  }: {
    open: boolean;
    isEditing: boolean;
    form: { title: string; content: string; colorHex: string | null; tagNames: string[] };
    errorMessage: string;
    onClose: () => void;
    onSubmit: (event: { preventDefault: () => void }) => void;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onColorChange: (colorHex: string | null) => void;
  }) => (
    <div data-testid="note-editor">
      <div data-testid="note-editor-state">{open ? "editor-open" : "editor-closed"}</div>
      <div data-testid="note-editor-mode">{isEditing ? "editing" : "creating"}</div>
      <div data-testid="note-editor-title">{form.title}</div>
      <div data-testid="note-editor-error">{errorMessage}</div>
      <button type="button" onClick={() => onTitleChange("Updated title")}>SetTitle</button>
      <button type="button" onClick={() => onContentChange("Updated content")}>SetContent</button>
      <button type="button" onClick={() => onColorChange("#ff00ff")}>SetColor</button>
      <button type="button" onClick={() => onSubmit({ preventDefault: () => {} })}>
        Submit
      </button>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("../components/notes/DeleteNoteDialog", () => ({
  default: ({ note, onConfirm }: { note: Note | null; onConfirm: () => void }) => (
    <div data-testid="delete-note-dialog">
      <div data-testid="delete-note-title">{note ? note.title : ""}</div>
      <button type="button" onClick={onConfirm} disabled={!note}>
        ConfirmDelete
      </button>
    </div>
  ),
}));

vi.mock("../components/notes/NoteColorPopover", () => ({
  default: ({ open, onSelectColor, onSelectNone }: {
    open: boolean;
    onSelectColor: (colorHex: string) => void;
    onSelectNone: () => void;
  }) => (
    <div data-testid="note-color-popover">
      <div data-testid="note-color-open">{open ? "open" : "closed"}</div>
      <button type="button" onClick={() => onSelectColor("#00ff00")}>SelectColor</button>
      <button type="button" onClick={onSelectNone}>SelectNone</button>
    </div>
  ),
}));

vi.mock("../components/notes/NotesTagSidenav", () => ({
  default: ({
    selectedTag,
    onSelectTag,
    onCreateTag,
    onRenameTag,
    onDeleteTag,
  }: {
    selectedTag: string;
    onSelectTag: (tagName: string | null) => void;
    onCreateTag: (name: string) => Promise<void>;
    onRenameTag: (currentName: string, newName: string) => Promise<void>;
    onDeleteTag: (name: string) => Promise<void>;
  }) => (
    <div data-testid="notes-tag-sidenav">
      <div data-testid="selected-tag">{selectedTag}</div>
      <button type="button" onClick={() => onSelectTag("work")}>SelectWork</button>
      <button type="button" onClick={() => onSelectTag(null)}>ClearTag</button>
      <button type="button" onClick={() => onCreateTag("personal")}>CreateTag</button>
      <button type="button" onClick={() => onRenameTag("old", "new")}>RenameTag</button>
      <button type="button" onClick={() => onDeleteTag("work")}>DeleteTag</button>
    </div>
  ),
}));

const getNotesMock = vi.mocked(getNotes);
const getUserTagsMock = vi.mocked(getUserTags);
const createNoteMock = vi.mocked(createNote);
const updateNoteMock = vi.mocked(updateNote);
const deleteNoteMock = vi.mocked(deleteNote);
const createTagMock = vi.mocked(createTag);
const renameTagMock = vi.mocked(renameTag);
const deleteTagMock = vi.mocked(deleteTag);

const makeNote = (overrides: Partial<Note>): Note => ({
  id: 1,
  title: "Note",
  content: "Content",
  colorHex: null,
  tagNames: [],
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

const renderNotesPage = async ({
  notes = [],
  tags = [],
  route = "/",
}: {
  notes?: Note[];
  tags?: string[];
  route?: string;
} = {}) => {
  getNotesMock.mockResolvedValue(notes);
  getUserTagsMock.mockResolvedValue(tags);
  createNoteMock.mockResolvedValue(makeNote({ id: 99, title: "New" }));
  updateNoteMock.mockResolvedValue(makeNote({ id: 1 }));
  deleteNoteMock.mockResolvedValue(undefined);
  createTagMock.mockResolvedValue(undefined);
  renameTagMock.mockResolvedValue(undefined);
  deleteTagMock.mockResolvedValue(undefined);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <NotesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

test("shows empty state when no notes and no tag is selected", async () => {
  await renderNotesPage();

  expect(await screen.findByText("No notes yet. Create your first note.")).toBeInTheDocument();
  expect(screen.queryAllByTestId(/note-card-/)).toHaveLength(0);
});

test("shows tag-specific empty state when a tag filter is active", async () => {
  await renderNotesPage({ route: "/?tag=work" });

  expect(await screen.findByText('No notes found for tag "work".')).toBeInTheDocument();
});

test("filters notes by selected tag", async () => {
  const notes = [
    makeNote({ id: 1, title: "Work note", tagNames: ["work"] }),
    makeNote({ id: 2, title: "Personal note", tagNames: ["personal"] }),
  ];

  await renderNotesPage({ notes, route: "/?tag=work" });

  expect(await screen.findByText("Work note")).toBeInTheDocument();
  expect(screen.queryByText("Personal note")).not.toBeInTheDocument();
});

test("sorts notes by updated date using the saved preference", async () => {
  localStorage.setItem("noteSortOrder", "asc");

  const notes = [
    makeNote({ id: 1, title: "Newest", updatedAt: new Date("2024-02-01T00:00:00Z") }),
    makeNote({ id: 2, title: "Oldest", updatedAt: new Date("2024-01-01T00:00:00Z") }),
  ];

  await renderNotesPage({ notes });

  const cards = await screen.findAllByTestId(/note-card-/);
  expect(cards[0]).toHaveTextContent("Oldest");
  expect(cards[1]).toHaveTextContent("Newest");
});

test("opens the note editor when clicking add note", async () => {
  const user = userEvent.setup();
  await renderNotesPage();

  expect(await screen.findByTestId("note-editor-state")).toHaveTextContent("editor-closed");

  await user.click(screen.getByRole("button", { name: "Add note" }));

  expect(screen.getByTestId("note-editor-state")).toHaveTextContent("editor-open");
});

test("creates a note with selected tag", async () => {
  const user = userEvent.setup();
  await renderNotesPage({ route: "/?tag=work" });

  await user.click(screen.getByRole("button", { name: "Add note" }));
  await user.click(screen.getByRole("button", { name: "SetTitle" }));
  await user.click(screen.getByRole("button", { name: "SetContent" }));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(createNoteMock).toHaveBeenCalled());

  const [payload] = createNoteMock.mock.calls[0];
  expect(payload).toMatchObject({ title: "Updated title", content: "Updated content" });
  expect(payload.tagNames).toContain("work");
  expect(screen.getByTestId("note-editor-state")).toHaveTextContent("editor-closed");
});

test("edits a note and submits updates", async () => {
  const user = userEvent.setup();
  const notes = [makeNote({ id: 10, title: "Old title", content: "Old content" })];
  await renderNotesPage({ notes });

  await screen.findByTestId("note-card-10");

  await user.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByTestId("note-editor-mode")).toHaveTextContent("editing");

  await user.click(screen.getByRole("button", { name: "SetTitle" }));
  await user.click(screen.getByRole("button", { name: "SetContent" }));
  await user.click(screen.getByRole("button", { name: "SetColor" }));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(updateNoteMock).toHaveBeenCalled());

  const [id, payload] = updateNoteMock.mock.calls[0];
  expect(id).toBe(10);
  expect(payload).toMatchObject({
    title: "Updated title",
    content: "Updated content",
    colorHex: "#ff00ff",
  });
});

test("adds and removes tags from a note", async () => {
  const user = userEvent.setup();
  updateNoteMock.mockClear();

  const notes = [makeNote({ id: 1, tagNames: ["work"] })];
  await renderNotesPage({ notes, tags: ["work", "personal"] });

  await screen.findByTestId("note-card-1");

  await user.click(screen.getByRole("button", { name: "AddTag" }));
  await waitFor(() => expect(updateNoteMock).toHaveBeenCalled());
  expect(updateNoteMock.mock.calls[0][1].tagNames).toEqual(["work", "newtag"]);

  updateNoteMock.mockClear();
  await user.click(screen.getByRole("button", { name: "RemoveTag" }));
  await waitFor(() => expect(updateNoteMock).toHaveBeenCalled());
  expect(updateNoteMock.mock.calls[0][1].tagNames).toEqual([]);
});

test("updates note color from palette", async () => {
  const user = userEvent.setup();
  updateNoteMock.mockClear();

  const notes = [makeNote({ id: 5, title: "Color note" })];
  await renderNotesPage({ notes });

  await screen.findByTestId("note-card-5");

  await user.click(screen.getByRole("button", { name: "Palette" }));
  await user.click(screen.getByRole("button", { name: "SelectColor" }));

  await waitFor(() => expect(updateNoteMock).toHaveBeenCalled());
  expect(updateNoteMock.mock.calls[0][1].colorHex).toBe("#00ff00");
});

test("deletes a note after confirmation", async () => {
  const user = userEvent.setup();
  const notes = [makeNote({ id: 7, title: "Delete me" })];
  await renderNotesPage({ notes });

  await screen.findByTestId("note-card-7");

  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(screen.getByRole("button", { name: "ConfirmDelete" }));

  await waitFor(() => expect(deleteNoteMock).toHaveBeenCalledWith(7, expect.anything()));
});

test("renames a selected tag and updates the empty state", async () => {
  const user = userEvent.setup();
  await renderNotesPage({ route: "/?tag=old" });

  expect(await screen.findByText('No notes found for tag "old".')).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "RenameTag" }));

  await waitFor(() => expect(renameTagMock).toHaveBeenCalledWith("old", "new", expect.anything()));
  expect(await screen.findByText('No notes found for tag "new".')).toBeInTheDocument();
});

test("creates and deletes tags from the sidenav", async () => {
  const user = userEvent.setup();
  await renderNotesPage();

  await user.click(screen.getByRole("button", { name: "CreateTag" }));
  await user.click(screen.getByRole("button", { name: "DeleteTag" }));

  await waitFor(() => expect(createTagMock).toHaveBeenCalledWith("personal", expect.anything()));
  await waitFor(() => expect(deleteTagMock).toHaveBeenCalledWith("work", expect.anything()));
});
