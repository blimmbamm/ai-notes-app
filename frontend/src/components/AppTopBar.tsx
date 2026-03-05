import { AppBar, IconButton, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useState } from "react";
import type { MouseEvent } from "react";
import { NavLink } from "react-router-dom";

interface AppTopBarProps {
  onLogout: () => void;
  logoutDisabled?: boolean;
}

export default function AppTopBar({ onLogout, logoutDisabled = false }: AppTopBarProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(menuAnchor);

  const onOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const onCloseMenu = () => {
    setMenuAnchor(null);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography
          component={NavLink}
          to="/notes"
          variant="h6"
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          Notes App
        </Typography>

        <IconButton color="inherit" onClick={onOpenMenu}>
          <AccountCircleIcon />
        </IconButton>

        <Menu anchorEl={menuAnchor} open={menuOpen} onClose={onCloseMenu}>
          <MenuItem component={NavLink} to="/account" onClick={onCloseMenu}>
            User account
          </MenuItem>
          <MenuItem
            onClick={() => {
              onCloseMenu();
              onLogout();
            }}
            disabled={logoutDisabled}
          >
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
