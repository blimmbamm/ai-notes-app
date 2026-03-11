import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import type { Note } from "../../types/api";

interface DeleteNoteDialogProps {
  note: Note | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteNoteDialog({ note, isPending, onCancel, onConfirm }: DeleteNoteDialogProps) {
  return (
    <Dialog
      open={note !== null}
      onClose={() => !isPending && onCancel()}
      maxWidth="xs"
      fullWidth
      data-testid="note-delete-dialog"
    >
      <DialogTitle>Delete note?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {note
            ? `This will permanently delete "${note.title}".`
            : "This will permanently delete this note."}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isPending} data-testid="note-delete-cancel">
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!note || isPending}
          onClick={onConfirm}
          data-testid="note-delete-confirm"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
