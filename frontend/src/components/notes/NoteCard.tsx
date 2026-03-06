import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PaletteIcon from "@mui/icons-material/Palette";
import type { MouseEvent, SyntheticEvent } from "react";
import type { Note } from "../../types/api";

interface NoteCardProps {
  note: Note;
  tagInputValue: string;
  tagOptions: string[];
  onTagInputFocus: () => void;
  onTagInputChange: (value: string, reason: string) => void;
  onTagSubmit: (value: string) => void;
  onTagRemove: (tagName: string) => void;
  onOpenPalette: (event: MouseEvent<HTMLElement>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NoteCard({
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
}: NoteCardProps) {
  return (
    <Card sx={{ backgroundColor: note.colorHex ?? "background.paper" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">{note.title}</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={onOpenPalette}>
              <PaletteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Last modified: {note.updatedAt.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>
          {note.content}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", minHeight: 32 }}>
          {note.tagNames.map((tagName) => (
            <Chip key={tagName} size="small" label={tagName} onDelete={() => onTagRemove(tagName)} />
          ))}

          <Autocomplete
            freeSolo
            size="small"
            options={tagOptions}
            inputValue={tagInputValue}
            onInputChange={(_: SyntheticEvent, value: string, reason: string) => onTagInputChange(value, reason)}
            onChange={(_: SyntheticEvent, value: string | null) => {
              if (typeof value === "string") {
                onTagSubmit(value);
              }
            }}
            sx={{ minWidth: 140, maxWidth: 220 }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder="Add tags..."
                onFocus={onTagInputFocus}
                onBlur={() => onTagSubmit(tagInputValue)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onTagSubmit(tagInputValue);
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
  );
}

