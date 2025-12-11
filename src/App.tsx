import { BrowserRouter } from "react-router-dom";
import { ModeToggle } from "./components/theme-change/mode-toggle";
import { ThemeProvider } from "./components/theme-change/theme-provider";
import { AppRouter } from "./routes/router";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="relative min-h-screen">
          {/* THEME TOGGLE BUTTON (top-right) */}
          <div className="absolute top-2 right-4 z-50">
            <ModeToggle />
          </div>

          <AppRouter />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
