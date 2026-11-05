try {
  var theme = localStorage.getItem("cch.theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch (e) {
  // Storage blocked: fall back to the system theme
}
