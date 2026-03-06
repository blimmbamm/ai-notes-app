import { Box, Drawer, List, ListItemButton, ListItemText, Typography } from "@mui/material";

interface NotesTagSidenavProps {
  tags: string[];
  selectedTag: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectTag: (tagName: string | null) => void;
  width: number;
}

export default function NotesTagSidenav({
  tags,
  selectedTag,
  mobileOpen,
  onCloseMobile,
  onSelectTag,
  width,
}: NotesTagSidenavProps) {
  const content = (
    <Box sx={{ width: "100%", maxWidth: width, overflowX: "hidden" }}>
      <Typography variant="h6" sx={{ px: 2, py: 1.5 }}>
        Tags
      </Typography>
      <List disablePadding sx={{ overflowX: "hidden" }}>
        <ListItemButton selected={selectedTag === ""} onClick={() => onSelectTag(null)}>
          <ListItemText primary="All" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        {tags.map((tagName) => (
          <ListItemButton key={tagName} selected={selectedTag === tagName} onClick={() => onSelectTag(tagName)}>
            <ListItemText primary={tagName} primaryTypographyProps={{ noWrap: true }} />
          </ListItemButton>
        ))}
      </List>
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

