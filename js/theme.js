document.addEventListener("DOMContentLoaded", () => {
  // Apply theme on page load
  const currentTheme = localStorage.getItem("theme") || "light"
  applyTheme(currentTheme)

  // Function to apply theme
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }
})

