document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) {
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
      localStorage.removeItem("currentUser")
      window.location.href = "index.html"
    })
  }

  // Get note ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const noteId = urlParams.get("id")

  if (!noteId) {
    window.location.href = "dashboard.html"
    return
  }

  // Get note from localStorage
  const notes = JSON.parse(localStorage.getItem("notes") || "[]")
  const note = notes.find((n) => n.id === noteId && n.userId === currentUser.id)

  if (!note) {
    window.location.href = "dashboard.html"
    return
  }

  // Set note title
  const noteTitle = document.getElementById("note-title")
  if (noteTitle) {
    noteTitle.textContent = note.title
  }

  // Set favorite button state
  const favoriteBtn = document.getElementById("favorite-btn")
  if (favoriteBtn) {
    favoriteBtn.innerHTML = note.isFavorite ? '<span class="icon">★</span>' : '<span class="icon">☆</span>'

    // Toggle favorite
    favoriteBtn.addEventListener("click", function () {
      note.isFavorite = !note.isFavorite
      this.innerHTML = note.isFavorite ? '<span class="icon">★</span>' : '<span class="icon">☆</span>'
      updateNote(note)
    })
  }

  // Back button
  const backBtn = document.getElementById("back-btn")
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  // Edit button
  const editBtn = document.getElementById("edit-btn")
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      window.location.href = `note-editor.html?id=${noteId}`
    })
  }

  // Dropdown menu actions
  const shareNote = document.getElementById("share-note")
  const duplicateNote = document.getElementById("duplicate-note")
  const deleteNote = document.getElementById("delete-note")

  if (shareNote) {
    shareNote.addEventListener("click", (e) => {
      e.preventDefault()
      alert("Sharing functionality would be implemented here.")
    })
  }

  if (duplicateNote) {
    duplicateNote.addEventListener("click", (e) => {
      e.preventDefault()

      // Create duplicate note
      const duplicatedNote = {
        ...note,
        id: Date.now().toString(),
        title: `${note.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save duplicated note
      const notes = JSON.parse(localStorage.getItem("notes") || "[]")
      notes.push(duplicatedNote)
      localStorage.setItem("notes", JSON.stringify(notes))

      // Redirect to duplicated note
      window.location.href = `view-note.html?id=${duplicatedNote.id}`
    })
  }

  if (deleteNote) {
    deleteNote.addEventListener("click", (e) => {
      e.preventDefault()

      if (confirm("Are you sure you want to delete this note?")) {
        // Delete note
        const notes = JSON.parse(localStorage.getItem("notes") || "[]")
        const updatedNotes = notes.filter((n) => n.id !== noteId)
        localStorage.setItem("notes", JSON.stringify(updatedNotes))

        // Redirect to dashboard
        window.location.href = "dashboard.html"
      }
    })
  }

  // Load note content
  const noteContent = document.getElementById("note-content")
  if (noteContent) {
    loadNoteContent(note.template, note.content)
  }

  // Helper functions
  function loadNoteContent(template, content) {
    if (template === "basic") {
      loadBasicContent(content)
    } else if (template === "todo") {
      loadTodoContent(content)
    } else if (template === "table") {
      loadTableContent(content)
    } else if (template === "gallery") {
      loadGalleryContent(content)
    } else if (template === "timeline") {
      loadTimelineContent(content)
    }
  }

  function loadBasicContent(content) {
    noteContent.innerHTML = `
            <div class="basic-content">${content.text}</div>
        `
  }

  function loadTodoContent(content) {
    const todoList = document.createElement("div")
    todoList.className = "todo-list"

    content.items.forEach((item) => {
      const todoItem = document.createElement("div")
      todoItem.className = "todo-item"

      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.checked = item.completed
      checkbox.disabled = true

      const text = document.createElement("span")
      text.innerHTML = item.text

      todoItem.appendChild(checkbox)
      todoItem.appendChild(text)
      todoList.appendChild(todoItem)
    })

    noteContent.appendChild(todoList)
  }

  function loadTableContent(content) {
    const table = document.createElement("table")

    // Header row
    const thead = document.createElement("thead")
    const headerRow = document.createElement("tr")

    content.columns.forEach((column) => {
      const th = document.createElement("th")
      th.innerHTML = column
      headerRow.appendChild(th)
    })

    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body rows
    const tbody = document.createElement("tbody")

    content.rows.forEach((row) => {
      const tr = document.createElement("tr")

      row.forEach((cell) => {
        const td = document.createElement("td")
        td.innerHTML = cell
        tr.appendChild(td)
      })

      tbody.appendChild(tr)
    })

    table.appendChild(tbody)
    noteContent.appendChild(table)
  }

  function loadGalleryContent(content) {
    const galleryGrid = document.createElement("div")
    galleryGrid.className = "gallery-grid"

    content.images.forEach((image) => {
      const galleryItem = document.createElement("div")
      galleryItem.className = "gallery-item"

      const img = document.createElement("img")
      img.src = image.url
      img.alt = image.caption || ""

      galleryItem.appendChild(img)
      galleryGrid.appendChild(galleryItem)
    })

    noteContent.appendChild(galleryGrid)
  }

  function loadTimelineContent(content) {
    const timeline = document.createElement("div")
    timeline.className = "timeline"

    content.events.forEach((event) => {
      const timelineItem = document.createElement("div")
      timelineItem.className = "timeline-item"

      const date = document.createElement("div")
      date.className = "timeline-date"
      date.textContent = formatDate(event.date)

      const eventContent = document.createElement("div")
      eventContent.className = "timeline-content"
      eventContent.innerHTML = event.content

      timelineItem.appendChild(date)
      timelineItem.appendChild(eventContent)
      timeline.appendChild(timelineItem)
    })

    noteContent.appendChild(timeline)
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  function updateNote(note) {
    note.updatedAt = new Date().toISOString()

    const notes = JSON.parse(localStorage.getItem("notes") || "[]")
    const noteIndex = notes.findIndex((n) => n.id === note.id)

    if (noteIndex !== -1) {
      notes[noteIndex] = note
      localStorage.setItem("notes", JSON.stringify(notes))
    }
  }
})

