import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import type { SubmitEvent } from "react";
import { NOTE_COLORS } from "../../constants/noteColors";
import type { NoteInput } from "../../types/api";

interface NoteEditorDialogProps {
  open: boolean;
  isEditing: boolean;
  form: NoteInput;
  isPending: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onColorChange: (colorHex: string | null) => void;
}

export default function NoteEditorDialog({
  open,
  isEditing,
  form,
  isPending,
  errorMessage,
  onClose,
  onSubmit,
  onTitleChange,
  onContentChange,
  onColorChange,
}: NoteEditorDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={onSubmit}>
        <DialogTitle>{isEditing ? "Edit note" : "Add note"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Title"
            margin="normal"
            value={form.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <TextField
            fullWidth
            label="Content"
            margin="normal"
            multiline
            minRows={5}
            value={form.content}
            onChange={(event) => onContentChange(event.target.value)}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant={form.colorHex === null ? "contained" : "outlined"}
              onClick={() => onColorChange(null)}
            >
              No color
            </Button>
            {NOTE_COLORS.map((color) => (
              <IconButton
                key={color}
                size="small"
                onClick={() => onColorChange(color)}
                sx={{
                  width: 28,
                  height: 28,
                  border: "1px solid",
                  borderColor: form.colorHex === color ? "text.primary" : "divider",
                  backgroundColor: color,
                  borderWidth: form.colorHex === color ? 2 : 1,
                }}
              />
            ))}
          </Stack>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isEditing ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
