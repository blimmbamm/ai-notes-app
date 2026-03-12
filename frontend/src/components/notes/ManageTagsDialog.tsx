import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface ManageTagsDialogProps {
  open: boolean;
  tags: string[];
  onClose: () => void;
  onCreateTag: (name: string) => Promise<void>;
  onRenameTag: (currentName: string, newName: string) => Promise<void>;
  onDeleteTag: (name: string) => Promise<void>;
}

function normalizeTag(rawValue: string): string {
  return rawValue.trim().toLowerCase();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Request failed";
}

export default function ManageTagsDialog({
  open,
  tags,
  onClose,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
}: ManageTagsDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [addError, setAddError] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tagSet = useMemo(() => new Set(tags), [tags]);

  function resetDialogState() {
    setNewTagName("");
    setAddError("");
    setEditingTag(null);
    setEditingValue("");
    setRenameError("");
    setActionError("");
    setIsSubmitting(false);
  }

  function handleDialogClose() {
    resetDialogState();
    onClose();
  }

  useEffect(() => {
    if (!open) {
      resetDialogState();
    }
  }, [open]);

  async function handleAddTag() {
    const normalized = normalizeTag(newTagName);
    setAddError("");
    setActionError("");

    if (!normalized) {
      setAddError("Tag name is required");
      return;
    }

    if (tagSet.has(normalized)) {
      setAddError("Tag already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTag(normalized);
      setNewTagName("");
    } catch (error) {
      setAddError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function startRename(tagName: string) {
    setEditingTag(tagName);
    setEditingValue(tagName);
    setRenameError("");
    setActionError("");
  }

  function cancelRename() {
    setEditingTag(null);
    setEditingValue("");
    setRenameError("");
  }

  async function handleRename() {
    if (!editingTag) {
      return;
    }

    const normalized = normalizeTag(editingValue);
    setRenameError("");
    setActionError("");

    if (!normalized) {
      setRenameError("Tag name is required");
      return;
    }

    if (normalized !== editingTag && tagSet.has(normalized)) {
      setRenameError("Tag already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      await onRenameTag(editingTag, normalized);
      cancelRename();
    } catch (error) {
      setRenameError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(tagName: string) {
    setActionError("");
    setIsSubmitting(true);
    try {
      await onDeleteTag(tagName);
      if (editingTag === tagName) {
        cancelRename();
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

    return (
      <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="xs" data-testid="manage-tags-dialog">
        <DialogTitle>Manage tags</DialogTitle>
        <DialogContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            label="New tag"
            inputProps={{ "data-testid": "tag-new-input" }}
            value={newTagName}
            onChange={(event) => {
              setNewTagName(event.target.value);
              if (addError) {
                setAddError("");
              }
            }}
            error={Boolean(addError)}
            helperText={addError}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAddTag();
              }
            }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            data-testid="tag-add"
            onClick={() => void handleAddTag()}
            disabled={isSubmitting}
            sx={{ mt: 0.5, whiteSpace: "nowrap" }}
          >
            Add
          </Button>
        </Stack>

        {actionError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {actionError}
          </Alert>
        )}

        <List disablePadding sx={{ mt: 1 }} data-testid="tags-list">
          {tags.map((tagName) => {
            const isEditingThis = editingTag === tagName;

            return (
              <ListItem
                key={tagName}
                disableGutters
                data-testid="tag-row"
                data-tag-name={tagName}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    {!isEditingThis && (
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label="Rename tag"
                        data-testid="tag-rename"
                        onClick={() => startRename(tagName)}
                        disabled={isSubmitting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {isEditingThis && (
                      <>
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label="Confirm rename"
                          data-testid="tag-rename-confirm"
                          onClick={() => void handleRename()}
                          disabled={isSubmitting}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label="Cancel rename"
                          data-testid="tag-rename-cancel"
                          onClick={cancelRename}
                          disabled={isSubmitting}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      edge="end"
                      size="small"
                      aria-label="Delete tag"
                      data-testid="tag-delete"
                      onClick={() => void handleDelete(tagName)}
                      disabled={isSubmitting}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
                sx={{ pr: 14, py: 0.5 }}
              >
                {isEditingThis ? (
                  <Box sx={{ width: "100%", pr: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={editingValue}
                      inputProps={{ "data-testid": "tag-edit-input" }}
                      onChange={(event) => {
                        setEditingValue(event.target.value);
                        if (renameError) {
                          setRenameError("");
                        }
                      }}
                      error={Boolean(renameError)}
                      helperText={renameError}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleRename();
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <ListItemText primary={tagName} primaryTypographyProps={{ noWrap: true }} />
                )}
              </ListItem>
            );
          })}
        </List>

        {tags.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No tags yet.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
