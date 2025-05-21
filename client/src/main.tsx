import { createRoot } from "react-dom/client";
import { createElement } from "react";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./hooks/use-theme";

const root = createRoot(document.getElementById("root")!);
root.render(
  createElement(ThemeProvider, null, createElement(App, null))
);
