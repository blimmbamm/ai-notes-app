import { useState } from "react";
import { Box, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ManageTagsDialog from "./ManageTagsDialog";

interface NotesTagSidenavProps {
  tags: string[];
  selectedTag: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectTag: (tagName: string | null) => void;
  onCreateTag: (name: string) => Promise<void>;
  onRenameTag: (currentName: string, newName: string) => Promise<void>;
  onDeleteTag: (name: string) => Promise<void>;
  width: number;
}

export default function NotesTagSidenav({
  tags,
  selectedTag,
  mobileOpen,
  onCloseMobile,
  onSelectTag,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
  width,
}: NotesTagSidenavProps) {
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  const content = (
    <Box data-testid="tags-sidenav" sx={{ width: "100%", maxWidth: width, overflowX: "hidden" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1 }}>
        <Typography variant="h6" sx={{ px: 1 }} data-testid="tags-title">
          Tags
        </Typography>
        <IconButton
          size="small"
          onClick={() => setManageDialogOpen(true)}
          aria-label="Manage tags"
          data-testid="tags-manage"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Stack>

      <List disablePadding sx={{ overflowX: "hidden" }}>
        <ListItemButton
          selected={selectedTag === ""}
          onClick={() => onSelectTag(null)}
          data-testid="tag-filter-all"
        >
          <ListItemText primary="All" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        {tags.map((tagName) => (
          <ListItemButton
            key={tagName}
            selected={selectedTag === tagName}
            onClick={() => onSelectTag(tagName)}
            data-testid="tag-filter-item"
          >
            <ListItemText primary={tagName} primaryTypographyProps={{ noWrap: true }} />
          </ListItemButton>
        ))}
      </List>

      <ManageTagsDialog
        open={manageDialogOpen}
        tags={tags}
        onClose={() => setManageDialogOpen(false)}
        onCreateTag={onCreateTag}
        onRenameTag={onRenameTag}
        onDeleteTag={onDeleteTag}
      />
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width,
            boxSizing: "border-box",
            overflowX: "hidden",
          },
        }}
      >
        {content}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width,
            boxSizing: "border-box",
            position: "relative",
            overflowX: "hidden",
            height: "calc(100vh - 64px)",
            maxHeight: "calc(100vh - 64px)",
            overflowY: "auto",
          },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}
