import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMonitoring, reportWebVitals } from "@/lib/monitoring";

initMonitoring();
reportWebVitals();

createRoot(document.getElementById("root")!).render(<App />);
