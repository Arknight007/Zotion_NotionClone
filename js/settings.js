document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}")
  if (!currentUser._id) {
    window.location.href = "index.html"
    return
  }

  // Set user info
  const userInitial = document.getElementById("user-initial")
  const userName = document.getElementById("user-name")

  if (userInitial && userName && currentUser.name) {
    userInitial.textContent = currentUser.name.charAt(0).toUpperCase()
    userName.textContent = `${currentUser.name}'s Workspace`
  }

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("currentUser")
      window.location.href = "index.html"
    })
  }

  // Initialize collections in sidebar
  initCollections()

  // Load user profile data
  const displayNameInput = document.getElementById("display-name")
  const emailAddressInput = document.getElementById("email-address")

  if (displayNameInput && emailAddressInput) {
    displayNameInput.value = currentUser.name
    emailAddressInput.value = currentUser.email
  }

  // Profile form submission
  const profileForm = document.getElementById("profile-form")
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const displayName = displayNameInput.value.trim()

      if (displayName === "") {
        showPopup("error", "Update Failed", "Display name cannot be empty")
        return
      }

      // Make API call to update user (in a real app)
      // For now just update in sessionStorage
      currentUser.name = displayName
      sessionStorage.setItem("currentUser", JSON.stringify(currentUser))

      // Update UI
      if (userInitial && userName) {
        userInitial.textContent = displayName.charAt(0).toUpperCase()
        userName.textContent = `${displayName}'s Workspace`
      }

      showPopup("success", "Profile Updated", "Your profile has been updated successfully")
    })
  }

  // Password form submission
  const passwordForm = document.getElementById("password-form")
  if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const currentPassword = document.getElementById("current-password").value
      const newPassword = document.getElementById("new-password").value
      const confirmNewPassword = document.getElementById("confirm-new-password").value

      // Validate inputs
      if (currentPassword === "" || newPassword === "" || confirmNewPassword === "") {
        showPopup("error", "Update Failed", "All fields are required")
        return
      }

      // In a real application, we would make an API call to verify the current password
      // For now, just simulate validation
      // if (currentPassword !== currentUser.password) {
      //   showPopup("error", "Update Failed", "Current password is incorrect")
      //   return
      // }

      if (newPassword.length < 6) {
        showPopup("error", "Update Failed", "New password must be at least 6 characters")
        return
      }

      if (newPassword !== confirmNewPassword) {
        showPopup("error", "Update Failed", "New passwords do not match")
        return
      }

      // In a real app, update via API
      // For this app, we just show success message
      
      // Reset form
      passwordForm.reset()
      
      showPopup("success", "Password Updated", "Your password has been updated successfully")
    })
  }

  // Dark mode toggle with animation
  const darkModeToggle = document.getElementById("dark-mode-toggle")
  if (darkModeToggle) {
    // Keep theme in localStorage so it persists across sessions
    const currentTheme = localStorage.getItem("theme") || "light"
    
    // Set initial state based on stored preference
    darkModeToggle.checked = currentTheme === "dark"
    applyTheme(currentTheme)

    // Toggle dark mode when checkbox changes
    darkModeToggle.addEventListener("change", function() {
      const theme = this.checked ? "dark" : "light"
      applyTheme(theme)
      localStorage.setItem("theme", theme)
      
      // Show confirmation
      showPopup("success", "Theme Updated", `Theme has been changed to ${theme} mode`)
    })
  }

  // Initialize collections
  function initCollections() {
    // Fetch collections from API if available
    // For now use static demo data
    
    // Add new collection button functionality
    const collectionAdd = document.querySelector(".collection-add")
    if (collectionAdd) {
      collectionAdd.addEventListener("click", () => {
        const collectionName = prompt("Enter a name for your new collection:")
        if (collectionName && collectionName.trim() !== "") {
          const collectionsList = document.querySelector(".collections-list")
          if (collectionsList) {
            const newCollection = document.createElement("li")
            const icon = getRandomCollectionIcon()
            newCollection.innerHTML = `<a href="#"><span class="collection-icon">${icon}</span> ${collectionName}</a>`
            collectionsList.appendChild(newCollection)
            
            showPopup("success", "Collection Added", "New collection created successfully")
          }
        }
      })
    }

    // Make collections clickable
    const collectionLinks = document.querySelectorAll(".collections-list a")
    collectionLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const collectionName = link.textContent.trim()
        showPopup("info", "Collection", `You selected the ${collectionName} collection`)
      })
    })
  }

  // Get a random icon for collections
  function getRandomCollectionIcon() {
    const icons = ["📚", "📘", "📗", "📙", "📓", "📕", "📔", "📒", "📝", "📋", "📌", "📎", "🗂️", "📁", "📂", "💼", "🏠", "🏬", "🏢", "🏛️", "🏠"]
    return icons[Math.floor(Math.random() * icons.length)]
  }

  // Function to apply theme
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }

  // Popup message function
  function showPopup(type, title, message) {
    // Remove any existing popups
    const existingPopup = document.querySelector(".popup")
    if (existingPopup) {
      existingPopup.remove()
    }

    // Create popup element
    const popup = document.createElement("div")
    popup.className = `popup popup-${type}`
    popup.innerHTML = `
      <div class="popup-title">
        <span>${title}</span>
        <span class="popup-close">&times;</span>
      </div>
      <div class="popup-message">${message}</div>
    `

    // Add popup to body
    document.body.appendChild(popup)

    // Add close functionality
    const closeBtn = popup.querySelector(".popup-close")
    closeBtn.addEventListener("click", () => {
      closePopup(popup)
    })

    // Auto close after 5 seconds for success messages, 8 seconds for errors
    const timeout = type === "success" ? 5000 : 8000
    setTimeout(() => {
      if (document.body.contains(popup)) {
        closePopup(popup)
      }
    }, timeout)
  }

  function closePopup(popup) {
    popup.classList.add("closing")
    setTimeout(() => {
      if (document.body.contains(popup)) {
        popup.remove()
      }
    }, 300) // Match the animation duration
  }
})

