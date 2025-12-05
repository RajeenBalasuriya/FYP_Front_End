import "./App.css";
import LoginPage from './app/login/page'
import SignUpPage from './app/signup/page'
import DashboardPage from "./app/dashboard/page";
import { ModeToggle } from "./components/mode-toggle";
import { ThemeProvider } from "./components/theme-provider";


function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="relative min-h-screen">
        
        {/* THEME TOGGLE BUTTON (top-right) */}
        <div className="absolute top-4 right-4 z-50">
          <ModeToggle />
        </div>

        {/* MAIN PAGE */}
        <DashboardPage/>
      </div>
    </ThemeProvider>
  );
}

export default App;
