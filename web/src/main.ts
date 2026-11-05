import "@fontsource-variable/inter";
import "./styles.css";
import "./coach.css";
import { App } from "./app";
import { mountShell } from "./shell";

const root = document.getElementById("app");
if (root) {
  const app = new App();
  mountShell(root, app);
  void app.load();
}
