import { Button, IconButton, Popover, Stack } from "@mui/material";
import { NOTE_COLORS } from "../../constants/noteColors";

interface NoteColorPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  isPending: boolean;
  onClose: () => void;
  onSelectNone: () => void;
  onSelectColor: (colorHex: string) => void;
}

export default function NoteColorPopover({
  open,
  anchorEl,
  isPending,
  onClose,
  onSelectNone,
  onSelectColor,
}: NoteColorPopoverProps) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={() => !isPending && onClose()}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
        <Button size="small" variant="outlined" disabled={isPending} onClick={onSelectNone}>
          None
        </Button>
        {NOTE_COLORS.map((color) => (
          <IconButton
            key={color}
            size="small"
            disabled={isPending}
            onClick={() => onSelectColor(color)}
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
  );
}
