document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in from session storage
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

  // Initialize dashboard widgets
  initDashboardWidgets()

  // Load notes
  loadNotes()

  // Collection functionality
  initCollections()

  // Initialize sort select
  initSortSelect()

  // Initialize view toggle
  initViewToggle()

  // Initialize search
  initSearch()

  // New note modal
  const newNoteBtn = document.getElementById("new-note-btn")
  const newNoteModal = document.getElementById("new-note-modal")
  const closeModal = document.querySelector(".close-modal")
  const createNoteBtn = document.getElementById("create-note-btn")

  if (newNoteBtn && newNoteModal) {
    newNoteBtn.addEventListener("click", () => {
      newNoteModal.style.display = "flex"
    })
  }

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      newNoteModal.style.display = "none"
    })
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === newNoteModal) {
      newNoteModal.style.display = "none"
    }
  })

  // Template selection
  const templateCards = document.querySelectorAll(".template-card")
  let selectedTemplate = null

  templateCards.forEach((card) => {
    card.addEventListener("click", function () {
      templateCards.forEach((c) => c.classList.remove("selected"))
      this.classList.add("selected")
      selectedTemplate = this.getAttribute("data-template")
    })
  })

  // Create note
  if (createNoteBtn) {
    createNoteBtn.addEventListener("click", () => {
      const noteTitle = document.getElementById("note-title").value.trim()
      if (!noteTitle) {
        showPopup("error", "Error Creating Note", "Please enter a title for your note")
        return
      }

      if (!selectedTemplate) {
        showPopup("error", "Error Creating Note", "Please select a template")
        return
      }

      const collection = document.getElementById("note-collection").value

      const newNote = {
        title: noteTitle,
        template: selectedTemplate,
        content: getTemplateContent(selectedTemplate),
        userId: currentUser._id,
        favorite: false,
        collection: collection
      }

      // Create note via API
      fetch('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to create note');
          });
        }
        return response.json();
      })
      .then(createdNote => {
        // Close modal and reset form
        newNoteModal.style.display = "none"
        document.getElementById("note-title").value = ""
        document.getElementById("note-collection").value = ""
        templateCards.forEach((c) => c.classList.remove("selected"))
        selectedTemplate = null

        // Show success message
        showPopup("success", "Note Created", "Your note has been created successfully")

        // Reload notes to show the new one
        loadNotes()
      })
      .catch(error => {
        showPopup("error", "Error Creating Note", error.message);
      });
    })
  }

  // Dashboard widgets initialization
  function initDashboardWidgets() {
    const totalNotesCount = document.getElementById("total-notes-count")
    const favoritesWidgetCount = document.getElementById("favorites-widget-count")
    const templatesCount = document.getElementById("templates-count")
    const activityCount = document.getElementById("activity-count")

    // Fetch notes data for widgets
    fetch(`http://localhost:3000/api/notes/${currentUser._id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load notes data')
        }
        return response.json()
      })
      .then(notes => {
        if (totalNotesCount) {
          totalNotesCount.textContent = notes.length
        }

        if (favoritesWidgetCount) {
          const favorites = notes.filter(note => note.favorite)
          favoritesWidgetCount.textContent = favorites.length
        }

        if (templatesCount) {
          // Count unique templates used
          const uniqueTemplates = new Set(notes.map(note => note.template))
          templatesCount.textContent = uniqueTemplates.size
        }

        if (activityCount) {
          // Count recent activity (notes updated in the last 7 days)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          
          const recentActivity = notes.filter(note => {
            const updatedDate = new Date(note.updatedAt)
            return updatedDate > sevenDaysAgo
          })
          
          activityCount.textContent = `${recentActivity.length} updates`
        }
      })
      .catch(error => {
        console.error('Error loading widget data:', error)
      })
  }

  // Initialize collections
  function initCollections() {
    const collectionAdd = document.querySelector(".collection-add")
    if (collectionAdd) {
      collectionAdd.addEventListener("click", () => {
        const collectionName = prompt("Enter a name for your new collection:")
        if (collectionName && collectionName.trim() !== "") {
          const collectionsList = document.querySelector(".collections-list")
          const newCollection = document.createElement("li")
          const icon = getRandomCollectionIcon()
          newCollection.innerHTML = `<a href="#"><span class="collection-icon">${icon}</span> ${collectionName}</a>`
          collectionsList.appendChild(newCollection)
          
          // Also add to the select in the modal
          const collectionSelect = document.getElementById("note-collection")
          if (collectionSelect) {
            const option = document.createElement("option")
            option.value = collectionName.toLowerCase().replace(/\s+/g, '-')
            option.textContent = collectionName
            collectionSelect.appendChild(option)
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
        // In a real app, this would filter notes by collection
        showPopup("info", "Collection Filter", `Filtering by ${collectionName} collection`)
      })
    })
  }

  // Initialize sort select
  function initSortSelect() {
    const sortSelects = document.querySelectorAll(".sort-select")
    sortSelects.forEach(select => {
      select.addEventListener("change", function() {
        const section = this.closest("section")
        const notesContainer = section.querySelector(".notes-grid")
        const notes = Array.from(notesContainer.querySelectorAll(".note-card"))
        
        switch(this.value) {
          case "updated":
            notes.sort((a, b) => {
              const dateA = new Date(a.querySelector(".note-date").textContent)
              const dateB = new Date(b.querySelector(".note-date").textContent)
              return dateB - dateA // Newest first
            })
            break
          case "created":
            // In a real app, this would sort by creation date
            // For now, sort by ID as a placeholder
            notes.sort((a, b) => {
              const idA = a.getAttribute("data-note-id")
              const idB = b.getAttribute("data-note-id")
              return idA.localeCompare(idB)
            })
            break
          case "alphabetical":
            notes.sort((a, b) => {
              const titleA = a.querySelector("h3").textContent
              const titleB = b.querySelector("h3").textContent
              return titleA.localeCompare(titleB)
            })
            break
        }
        
        // Clear and re-append sorted notes
        notesContainer.innerHTML = ""
        notes.forEach(note => notesContainer.appendChild(note))
      })
    })
  }

  // Initialize view toggle
  function initViewToggle() {
    const viewToggles = document.querySelectorAll(".view-toggle")
    viewToggles.forEach(toggle => {
      toggle.addEventListener("click", function() {
        const section = this.closest("section")
        const notesGrid = section.querySelector(".notes-grid")
        
        if (notesGrid.classList.contains("list-view")) {
          notesGrid.classList.remove("list-view")
          this.innerHTML = "<span>☰</span>"
          this.setAttribute("title", "Switch to list view")
        } else {
          notesGrid.classList.add("list-view")
          this.innerHTML = "<span>⊞</span>"
          this.setAttribute("title", "Switch to grid view")
        }
      })
    })
  }

  // Initialize search
  function initSearch() {
    const searchInput = document.querySelector(".search-input")
    if (searchInput) {
      searchInput.addEventListener("input", function() {
        const searchTerm = this.value.toLowerCase().trim()
        const noteCards = document.querySelectorAll(".note-card")
        
        noteCards.forEach(card => {
          const title = card.querySelector("h3").textContent.toLowerCase()
          const content = card.querySelector(".note-preview").textContent.toLowerCase()
          
          if (searchTerm === "" || title.includes(searchTerm) || content.includes(searchTerm)) {
            card.style.display = ""
          } else {
            card.style.display = "none"
          }
        })
      })
    }
  }

  // LOAD NOTES
  function loadNotes() {
    const recentNotesContainer = document.getElementById("recent-notes");
    const favoriteNotesContainer = document.getElementById("favorite-notes");
    const recentCount = document.getElementById("recent-count");
    const favoritesCount = document.getElementById("favorites-count");

    if (!recentNotesContainer || !favoriteNotesContainer) {
      console.error("Notes containers not found in the HTML");
      return;
    }

    // Show loading state
    recentNotesContainer.innerHTML = '<div class="loading-spinner"></div>';
    favoriteNotesContainer.innerHTML = '<div class="loading-spinner"></div>';

    // Fetch notes from API with absolute URL
    fetch(`http://localhost:3000/api/notes/${currentUser._id}`)
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to load notes');
          });
        }
        return response.json();
      })
      .then(notes => {
        // Split notes into recent and favorites
        const favoriteNotes = notes.filter(note => note.favorite);
        const recentNotes = notes.filter(note => !note.favorite);
        
        // Update counts
        if (recentCount) recentCount.textContent = `${recentNotes.length} notes`;
        if (favoritesCount) favoritesCount.textContent = `${favoriteNotes.length} notes`;
        
        // Update dashboard widgets
        initDashboardWidgets();
        
        if (notes.length === 0) {
          // Show empty state message
          recentNotesContainer.innerHTML = `
            <div class="empty-state">
              <p>You haven't created any notes yet.</p>
              <button id="empty-create-btn" class="btn btn-primary">Create your first note</button>
            </div>
          `;
          favoriteNotesContainer.innerHTML = `
            <div class="empty-state">
              <p>No favorite notes yet.</p>
            </div>
          `;
          
          // Add event listener to the empty state create button
          const emptyCreateBtn = document.getElementById("empty-create-btn");
          if (emptyCreateBtn) {
            emptyCreateBtn.addEventListener("click", () => {
              if (newNoteModal) newNoteModal.style.display = "flex";
            });
          }
        } else {
          // Display notes in their respective containers
          displayNotes(recentNotes, recentNotesContainer);
          displayNotes(favoriteNotes, favoriteNotesContainer);
        }
      })
      .catch(error => {
        console.error('Error loading notes:', error);
        recentNotesContainer.innerHTML = `<p class="error-message">Error loading notes: ${error.message}</p>`;
        favoriteNotesContainer.innerHTML = '';
      });
  }

  function displayNotes(notes, container) {
    // Sort notes by date (newest first)
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Clear container
    container.innerHTML = "";

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No notes found.</p>
        </div>
      `;
      return;
    }

    // Add each note
    notes.forEach((note) => {
      const noteCard = document.createElement("div");
      noteCard.className = "note-card";
      noteCard.setAttribute("data-note-id", note._id);

      // Create title with favorite indicator
      const noteTitle = document.createElement("div");
      noteTitle.className = "note-title";
      noteTitle.innerHTML = `
        <h3>${note.title}</h3>
        ${note.favorite ? '<span class="favorite-icon">★</span>' : '<span class="favorite-icon" style="opacity: 0.3; color: var(--text-light);">☆</span>'}
      `;

      // Create preview based on template type
      const notePreview = document.createElement("div");
      notePreview.className = "note-preview";
      notePreview.innerHTML = generatePreview(note);

      // Create footer with metadata
      const noteInfo = document.createElement("div");
      noteInfo.className = "note-info";
      const templateIcon = getTemplateIcon(note.template);
      const dateFormatted = formatDate(note.updatedAt);
      
      // Add collection badge if available
      const collectionBadge = note.collection ? 
        `<span class="collection-badge">${note.collection}</span>` : '';
      
      noteInfo.innerHTML = `
        <div class="template-info">
          <span class="template-icon">${templateIcon}</span> 
          <span>${capitalizeFirstLetter(note.template)}</span>
          ${collectionBadge}
        </div>
        <span class="note-date">${dateFormatted}</span>
      `;

      // Add components to the card
      noteCard.appendChild(noteTitle);
      noteCard.appendChild(notePreview);
      noteCard.appendChild(noteInfo);

      // Add click event to open note
      noteCard.addEventListener("click", () => {
        window.location.href = `note-editor.html?id=${note._id}`;
      });

      // Add favorite toggle functionality
      const favoriteIcon = noteCard.querySelector(".favorite-icon");
      if (favoriteIcon) {
        favoriteIcon.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent card click event
          
          // Toggle favorite status
          const isFavorite = note.favorite;
          
          // Update via API
          fetch(`http://localhost:3000/api/notes/${note._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...note,
              favorite: !isFavorite
            }),
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to update note');
            }
            return response.json();
          })
          .then(() => {
            // Reload notes to reflect changes
            loadNotes();
          })
          .catch(error => {
            showPopup("error", "Error", error.message);
          });
        });
      }

      // Add to container
      container.appendChild(noteCard);
    });
  }

  function generatePreview(note) {
    switch (note.template) {
      case "basic":
        return `<div class="basic-preview">${note.content.text.substring(0, 150)}${
          note.content.text.length > 150 ? "..." : ""
        }</div>`;

      case "todo":
        if (!note.content.items || note.content.items.length === 0) {
          return `<div class="todo-preview">No tasks yet.</div>`;
        }

        const completedCount = note.content.items.filter((item) => item.completed).length;
        const totalCount = note.content.items.length;

        let todoPreview = `<div class="todo-preview">`;
        todoPreview += `<div class="preview-count">${completedCount}/${totalCount} completed</div>`;
        todoPreview += `<ul class="preview-list">`;

        // Show up to 3 tasks
        const tasksToShow = note.content.items.slice(0, 3);
        tasksToShow.forEach((item) => {
          todoPreview += `<li class="${item.completed ? "completed" : ""}">${item.text}</li>`;
        });

        if (note.content.items.length > 3) {
          todoPreview += `<li>+${note.content.items.length - 3} more</li>`;
        }

        todoPreview += `</ul></div>`;
        return todoPreview;

      case "table":
        if (!note.content.columns || !note.content.rows) {
          return `<div class="table-preview">Empty table</div>`;
        }

        const columnCount = note.content.columns.length;
        const rowCount = note.content.rows.length;

        return `<div class="table-preview">
          <div class="preview-table-stats">${columnCount} columns × ${rowCount} rows</div>
        </div>`;

      case "timeline":
        if (!note.content.events || note.content.events.length === 0) {
          return `<div class="timeline-preview">No events yet.</div>`;
        }

        return `<div class="timeline-preview">
          <div class="preview-timeline-stats">${note.content.events.length} events</div>
        </div>`;

      case "expense":
        if (!note.content.expenses || note.content.expenses.length === 0) {
          return `<div class="expense-preview">No expenses tracked yet.</div>`;
        }

        const totalExpenses = note.content.expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        return `<div class="expense-preview">
          <div class="preview-expense-stats">$${totalExpenses.toFixed(2)} total</div>
        </div>`;

      case "student":
        const courseCount = note.content.courses ? note.content.courses.length : 0;
        const assignmentCount = note.content.assignments ? note.content.assignments.length : 0;

        return `<div class="student-preview">
          <div class="preview-student-stats">${courseCount} courses, ${assignmentCount} assignments</div>
        </div>`;

      default:
        return `<div>Note preview not available</div>`;
    }
  }

  function getTemplateIcon(template) {
    switch (template) {
      case "basic":
        return "📝";
      case "todo":
        return "✓";
      case "table":
        return "📊";
      case "timeline":
        return "📅";
      case "expense":
        return "💰";
      case "student":
        return "🎓";
      default:
        return "📄";
    }
  }

  function getRandomCollectionIcon() {
    const icons = ["📚", "💼", "🏠", "💻", "🎮", "🎵", "✈️", "🍔", "🏋️", "🎨", "🌟"]
    return icons[Math.floor(Math.random() * icons.length)]
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Check if the date is today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      // Format as time for today
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Format as month and day for other dates
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  function getTemplateContent(template) {
    if (template === "basic") {
      return {
        text: "Start writing here...",
      }
    } else if (template === "todo") {
      return {
        items: [{ id: Date.now().toString(), text: "First task", completed: false }],
      }
    } else if (template === "table") {
      return {
        columns: ["Name", "Category", "Status"],
        rows: [
          ["Item 1", "Category A", "Active"],
          ["Item 2", "Category B", "Pending"],
        ],
      }
    } else if (template === "timeline") {
      const today = new Date().toISOString().split("T")[0]
      return {
        events: [{ id: Date.now().toString(), date: today, content: "First event" }],
      }
    } else if (template === "expense") {
      const today = new Date().toISOString().split("T")[0]
      return {
        expenses: [
          {
            id: Date.now().toString(),
            date: today,
            amount: 0,
            description: "New expense",
            category: "General",
          },
        ],
        categories: ["Home", "Food", "Transportation", "Entertainment", "Utilities", "Health", "Education", "General"],
        view: "daily",
      }
    } else if (template === "student") {
      return {
        courses: [
          {
            id: Date.now().toString(),
            name: "Introduction to Computer Science",
            icon: "💻",
            color: "#4285F4",
          },
        ],
        assignments: [
          {
            id: Date.now().toString(),
            courseId: Date.now().toString(),
            title: "First Assignment",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            completed: false,
          },
        ],
        exams: [],
        view: "weekly",
      }
    }
    return {}
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

