import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import NotesPage from "./NotesPage";
import type { Note } from "../types/api";
import { getNotes } from "../api/notesApi";
import { getUserTags } from "../api/tagsApi";

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
    accessToken: "token",
    refreshToken: "refresh",
    setTokens: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
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
  default: ({ note }: { note: Note }) => (
    <div data-testid="note-card">{note.title}</div>
  ),
}));

vi.mock("../components/notes/NoteEditorDialog", () => ({
  default: ({ open }: { open: boolean }) => (
    <div data-testid="note-editor">{open ? "editor-open" : "editor-closed"}</div>
  ),
}));

vi.mock("../components/notes/DeleteNoteDialog", () => ({
  default: () => <div data-testid="delete-note-dialog" />,
}));

vi.mock("../components/notes/NoteColorPopover", () => ({
  default: () => <div data-testid="note-color-popover" />,
}));

vi.mock("../components/notes/NotesTagSidenav", () => ({
  default: () => <div data-testid="notes-tag-sidenav" />,
}));

const getNotesMock = vi.mocked(getNotes);
const getUserTagsMock = vi.mocked(getUserTags);

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
  expect(screen.queryAllByTestId("note-card")).toHaveLength(0);
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

  const cards = await screen.findAllByTestId("note-card");
  expect(cards[0]).toHaveTextContent("Oldest");
  expect(cards[1]).toHaveTextContent("Newest");
});

test("opens the note editor when clicking add note", async () => {
  await renderNotesPage();

  expect(await screen.findByTestId("note-editor")).toHaveTextContent("editor-closed");

  await userEvent.click(screen.getByRole("button", { name: "Add note" }));

  expect(screen.getByTestId("note-editor")).toHaveTextContent("editor-open");
});
