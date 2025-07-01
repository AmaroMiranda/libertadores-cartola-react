// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

// Contexto e Componentes de Autenticação
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas da Aplicação
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import ConfrontosPage from "./pages/ConfrontosPage";
import MataMataPage from "./pages/MataMataPage";
import MataMataConfrontosPage from "./pages/MataMataConfrontosPage";
import LoginPage from "./pages/LoginPage";
import SorteioPage from "./pages/SorteioPage"; // Importação da nova página

// Definição do tema da aplicação
const fantasyTechTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00E5FF" },
    secondary: { main: "#F48FB1", light: "rgba(244, 143, 177, 0.1)" },
    success: { main: "#00E5FF", light: "rgba(0, 229, 255, 0.1)" },
    background: { default: "#1A1A2E", paper: "#2C2C44" },
    text: { primary: "#EAEAEA", secondary: "#B0B0C0" },
    divider: "rgba(0, 229, 255, 0.2)",
  },
  typography: {
    fontFamily: '"Exo 2", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: "bold" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(0, 229, 255, 0.15)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: "#1A1A2E", backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: "bold" },
        outlined: {
          borderColor: "rgba(0, 229, 255, 0.4)",
          backgroundColor: "rgba(0, 229, 255, 0.1)",
        },
      },
    },
  },
});

/**
 * Componente de Navegação que se ajusta com base no estado de autenticação
 * e no tamanho do ecrã.
 */
const Navigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleClose();
    navigate("/");
  };

  const publicMenuItems = [
    { label: "Fase de Grupos", path: "/", public: true },
    { label: "Confrontos FG", path: "/confrontos", public: true },
    { label: "Chaveamento", path: "/mata-mata", public: true },
    { label: "Confrontos M-M", path: "/mata-mata-confrontos", public: true },
  ];

  const renderDesktopMenu = () => (
    <Box>
      {publicMenuItems.map((item) => (
        <Button
          key={item.label}
          color="inherit"
          component={Link}
          to={item.path}
        >
          {item.label}
        </Button>
      ))}
      {isAuthenticated ? (
        <>
          <Button
            color="inherit"
            component={Link}
            to="/admin"
            startIcon={<AdminPanelSettingsIcon />}
          >
            Admin
          </Button>
          <Button
            color="secondary"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Sair
          </Button>
        </>
      ) : (
        <Button
          color="inherit"
          component={Link}
          to="/login"
          startIcon={<LoginIcon />}
        >
          Login
        </Button>
      )}
    </Box>
  );

  const renderMobileMenu = () => (
    <>
      <IconButton
        size="large"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={handleMenu}
      >
        <MenuIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {publicMenuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={handleClose}
            component={Link}
            to={item.path}
          >
            {item.label}
          </MenuItem>
        ))}
        <Box sx={{ my: 1 }}>
          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          />
        </Box>
        {isAuthenticated ? (
          [
            <MenuItem
              key="admin"
              onClick={handleClose}
              component={Link}
              to="/admin"
            >
              <AdminPanelSettingsIcon sx={{ mr: 1 }} /> Admin
            </MenuItem>,
            <MenuItem
              key="logout"
              onClick={handleLogout}
              sx={{ color: "secondary.main" }}
            >
              <LogoutIcon sx={{ mr: 1 }} /> Sair
            </MenuItem>,
          ]
        ) : (
          <MenuItem onClick={handleClose} component={Link} to="/login">
            <LoginIcon sx={{ mr: 1 }} /> Login
          </MenuItem>
        )}
      </Menu>
    </>
  );

  return (
    <>
      <SportsSoccerIcon color="primary" sx={{ mr: 2, fontSize: "2rem" }} />
      <Typography
        variant="h6"
        component={Link}
        to="/"
        sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
      >
        Libertadores do Cartola
      </Typography>
      {isMobile ? renderMobileMenu() : renderDesktopMenu()}
    </>
  );
};

/**
 * Componente principal da aplicação.
 * Configura o tema, o router e a estrutura de rotas públicas e protegidas.
 */
function App() {
  return (
    <ThemeProvider theme={fantasyTechTheme}>
      <Router>
        <CssBaseline />
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Navigation />
          </Toolbar>
        </AppBar>
        <Container
          component="main"
          sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}
        >
          <Routes>
            {/* ROTAS PÚBLICAS (visíveis para todos) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/confrontos" element={<ConfrontosPage />} />
            <Route path="/mata-mata" element={<MataMataPage />} />
            <Route
              path="/mata-mata-confrontos"
              element={<MataMataConfrontosPage />}
            />
            <Route path="/login" element={<LoginPage />} />

            {/* ROTAS PRIVADAS (acessíveis apenas após login) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sorteio"
              element={
                <ProtectedRoute>
                  <SorteioPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
