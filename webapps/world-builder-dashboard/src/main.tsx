import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "summon-ui/styles/mantine/mantine-notifications.css";
import "summon-ui/styles/mantine/mantine-tiptap.css";
import "./styles/index.css";
import "summon-ui/styles/mantine/mantine-core.css";
import "summon-ui/styles/summon-ui.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
