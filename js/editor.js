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

  // Add back button functionality
  const backBtn = document.getElementById("back-btn")
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  // Initialize editor
  const urlParams = new URLSearchParams(window.location.search)
  const noteId = urlParams.get("id")
  
  // Current note being edited
  let currentNote = null

  // Load collections for the user
  loadCollections()

  // Load note if ID is provided
  if (noteId) {
    loadNote(noteId)
  } else {
    window.location.href = "dashboard.html"
  }

  // Dropdown menu toggle
  const dropdownToggle = document.querySelector(".dropdown-toggle")
  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", function() {
      this.nextElementSibling.classList.toggle("active")
    })
  }

  // Setup logout button
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("currentUser")
      window.location.href = "index.html"
    })
  }

  // Load collections from the server
  function loadCollections() {
    fetch(`http://localhost:3000/api/collections/${currentUser._id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to load collections")
        }
        return response.json()
      })
      .then(collections => {
        populateCollectionDropdown(collections)
        updateSidebarCollections(collections)
      })
      .catch(error => {
        console.error("Error loading collections:", error)
      })
  }

  // Populate collection dropdown in the modal
  function populateCollectionDropdown(collections) {
    const collectionSelect = document.getElementById("collection-select")
    
    // Keep the "No Collection" option
    collectionSelect.innerHTML = '<option value="">No Collection</option>'
    
    // Add collections from the server
    collections.forEach(collection => {
      const option = document.createElement("option")
      option.value = collection._id
      option.textContent = collection.name
      collectionSelect.appendChild(option)
    })
  }

  // Update collections in the sidebar
  function updateSidebarCollections(collections) {
    const collectionsList = document.querySelector(".collections-list")
    if (!collectionsList) return

    collectionsList.innerHTML = "" // Clear existing collections
    
    // Add collections to the sidebar
    collections.forEach(collection => {
      const li = document.createElement("li")
      const icon = getRandomCollectionIcon()
      li.innerHTML = `<a href="#"><span class="collection-icon">${icon}</span> ${collection.name}</a>`
      collectionsList.appendChild(li)
    })

    // Add click handler to the "+" button
    const collectionAdd = document.querySelector(".collection-add")
    if (collectionAdd) {
      collectionAdd.addEventListener("click", () => {
        const name = prompt("Enter a name for your new collection:")
        if (name && name.trim() !== "") {
          createNewCollection(name)
        }
      })
    }
  }

  // Get random icon for collection
  function getRandomCollectionIcon() {
    const icons = ["📚", "📘", "📗", "📙", "📓", "📕", "📔", "📒", "📝", "📋", "📌", "📎", "🗂️", "📁", "📂", "💼", "🏠", "🏬", "🏢", "🏛️", "🏠"]
    return icons[Math.floor(Math.random() * icons.length)]
  }

  // Load note from the server
  function loadNote(id) {
    if (!id) {
      return
    }
    
    const editorArea = document.getElementById("editor-area")
    editorArea.innerHTML = `<div class="loading-spinner"></div>`
    
    fetch(`http://localhost:3000/api/notes/note/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Note not found")
        }
        return response.json()
      })
      .then(data => {
        currentNote = data;

        // Set note title
        document.getElementById("note-title-input").value = currentNote.title || "Untitled"
        
        // Set template icon and name
        const templateIcon = document.getElementById("template-icon")
        const templateName = document.getElementById("template-name")
        
        if (templateIcon && templateName) {
          const templateInfo = getTemplateInfo(currentNote.template)
          templateIcon.textContent = templateInfo.icon
          templateName.textContent = templateInfo.name
        }
        
        // Load editor based on template
        loadEditor(currentNote.template, currentNote.content, currentNote)
        
        // Set favorite button state
        updateFavoriteButton(currentNote.favorite)
        
        // Set collection in modal if applicable
        if (currentNote.collection) {
          const collectionSelect = document.getElementById('collection-select');
          if (collectionSelect) {
            // Find and select the option with the matching collection ID
            const existingOption = Array.from(collectionSelect.options)
              .find(option => option.value === String(currentNote.collection));
            
            if (existingOption) {
              existingOption.selected = true;
            } else {
              // If the collection option doesn't exist, fetch its details and add it
              fetch(`http://localhost:3000/api/collections/${currentUser._id}`)
                .then(response => response.json())
                .then(collections => {
                  const collection = collections.find(c => c._id === currentNote.collection);
                  if (collection) {
                    const option = document.createElement('option');
                    option.value = collection._id;
                    option.textContent = collection.name;
                    option.selected = true;
                    collectionSelect.appendChild(option);
                  }
                })
                .catch(error => {
                  console.error('Error fetching collection details:', error);
                });
            }
          }
        }
      })
      .catch(error => {
        console.error('Error loading note:', error);
        editorArea.innerHTML = `<div class="error-message">
          <h3>Error Loading Note</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">Back to Dashboard</button>
        </div>`;
      });
  }

  // Function to provide default content for templates
  function getDefaultContentForTemplate(template) {
    switch(template) {
      case "basic":
        return { text: "Start writing here..." }
      case "todo":
        return { items: [] }
      case "table":
        return { columns: ["Column 1", "Column 2"], rows: [["", ""]] }
      case "timeline":
        return { events: [] }
      case "expense":
        return { 
          expenses: [],
          categories: ["Home", "Food", "Transportation", "Entertainment", "Utilities", "Health", "Education", "General"],
          view: "daily"
        }
      case "student":
        return {
          courses: [],
          assignments: [],
          exams: [],
          view: "weekly"
        }
      default:
        return { text: "Start writing here..." }
    }
  }

  // Helper functions
  function loadEditor(template, content, note) {
    const editorArea = document.getElementById("editor-area");
    if (!editorArea) {
      throw new Error("Editor area not found");
    }
    
    // Clear any previous content
    editorArea.innerHTML = '';
    
    if (template === "basic") {
      loadBasicEditor(content, note, editorArea)
    } else if (template === "todo") {
      loadTodoEditor(content, note, editorArea)
    } else if (template === "table") {
      loadTableEditor(content, note, editorArea)
    } else if (template === "timeline") {
      loadTimelineEditor(content, note, editorArea)
    } else if (template === "expense") {
      loadExpenseEditor(content, note, editorArea)
    } else if (template === "student") {
      loadStudentEditor(content, note, editorArea)
    }
  }

  function loadBasicEditor(content, note, editorArea) {
    editorArea.className = "editor-area basic-editor"
    editorArea.innerHTML = `
            <div id="basic-content" contenteditable="true" class="basic-content">${content.text}</div>
        `

    const basicContent = document.getElementById("basic-content")

    // Save content on input
    basicContent.addEventListener("input", function() {
      note.content.text = this.innerHTML
      updateNote(note)
    })
  }

  function loadTodoEditor(content, note, editorArea) {
    editorArea.className = "editor-area todo-list-editor"

    // Create todo list container
    const todoListContainer = document.createElement("div")
    todoListContainer.className = "todo-list-container"

    // Add todo items
    content.items.forEach((item) => {
      const todoItem = createTodoItem(item, note)
      todoListContainer.appendChild(todoItem)
    })

    // Add "Add todo" button
    const addTodoBtn = document.createElement("div")
    addTodoBtn.className = "add-todo"
    addTodoBtn.innerHTML = "<span>+</span> Add a task"
    addTodoBtn.addEventListener("click", () => {
      const newItem = {
        id: Date.now().toString(),
        text: "",
        completed: false,
      }

      note.content.items.push(newItem)
      const todoItem = createTodoItem(newItem, note)
      todoListContainer.insertBefore(todoItem, addTodoBtn)

      // Focus on the new item
      const textElement = todoItem.querySelector('[contenteditable="true"]')
      if (textElement) {
        textElement.focus()
      }

      updateNote(note)
    })

    todoListContainer.appendChild(addTodoBtn)
    editorArea.appendChild(todoListContainer)
  }

  function createTodoItem(item, note) {
    const todoItem = document.createElement("div")
    todoItem.className = "todo-item"
    todoItem.setAttribute("data-id", item.id)

    // Checkbox
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = item.completed
    checkbox.addEventListener("change", function () {
      item.completed = this.checked
      updateNote(note)
    })

    // Text
    const text = document.createElement("div")
    text.contentEditable = "true"
    text.innerHTML = item.text
    text.addEventListener("input", function () {
      item.text = this.innerHTML
      updateNote(note)
    })

    // Delete button
    const deleteBtn = document.createElement("span")
    deleteBtn.className = "delete-todo"
    deleteBtn.innerHTML = "×"
    deleteBtn.addEventListener("click", () => {
      note.content.items = note.content.items.filter((i) => i.id !== item.id)
      todoItem.remove()
      updateNote(note)
    })

    todoItem.appendChild(checkbox)
    todoItem.appendChild(text)
    todoItem.appendChild(deleteBtn)

    return todoItem
  }

  function loadTableEditor(content, note, editorArea) {
    editorArea.className = "editor-area table-editor"

    // Create table controls
    const tableControls = document.createElement("div")
    tableControls.className = "table-controls"

    const addRowBtn = document.createElement("button")
    addRowBtn.className = "btn btn-outline"
    addRowBtn.textContent = "Add Row"
    addRowBtn.addEventListener("click", () => {
      const newRow = Array(content.columns.length).fill("")
      content.rows.push(newRow)
      updateTable(note)
      updateNote(note)
    })

    const addColumnBtn = document.createElement("button")
    addColumnBtn.className = "btn btn-outline"
    addColumnBtn.textContent = "Add Column"
    addColumnBtn.addEventListener("click", () => {
      content.columns.push("New Column")
      content.rows.forEach((row) => row.push(""))
      updateTable(note)
      updateNote(note)
    })

    tableControls.appendChild(addRowBtn)
    tableControls.appendChild(addColumnBtn)
    editorArea.appendChild(tableControls)

    // Create table container
    const tableContainer = document.createElement("div")
    tableContainer.className = "table-container"
    editorArea.appendChild(tableContainer)

    // Update table function
    function updateTable(note) {
      tableContainer.innerHTML = ""

      const table = document.createElement("table")

      // Header row
      const thead = document.createElement("thead")
      const headerRow = document.createElement("tr")

      content.columns.forEach((column, colIndex) => {
        const th = document.createElement("th")

        const headerContent = document.createElement("div")
        headerContent.contentEditable = "true"
        headerContent.innerHTML = column
        headerContent.addEventListener("input", function () {
          content.columns[colIndex] = this.innerHTML
          updateNote(note)
        })

        const deleteColumnBtn = document.createElement("span")
        deleteColumnBtn.className = "delete-column"
        deleteColumnBtn.innerHTML = "×"
        deleteColumnBtn.addEventListener("click", () => {
          if (content.columns.length > 1) {
            content.columns.splice(colIndex, 1)
            content.rows.forEach((row) => row.splice(colIndex, 1))
            updateTable(note)
            updateNote(note)
          }
        })

        th.appendChild(headerContent)
        th.appendChild(deleteColumnBtn)
        headerRow.appendChild(th)
      })

      thead.appendChild(headerRow)
      table.appendChild(thead)

      // Body rows
      const tbody = document.createElement("tbody")

      content.rows.forEach((row, rowIndex) => {
        const tr = document.createElement("tr")

        row.forEach((cell, colIndex) => {
          const td = document.createElement("td")

          const cellContent = document.createElement("div")
          cellContent.contentEditable = "true"
          cellContent.innerHTML = cell
          cellContent.addEventListener("input", function () {
            content.rows[rowIndex][colIndex] = this.innerHTML
            updateNote(note)
          })

          td.appendChild(cellContent)
          tr.appendChild(td)
        })

        // Delete row button
        const deleteCell = document.createElement("td")
        deleteCell.className = "delete-row-cell"

        const deleteRowBtn = document.createElement("span")
        deleteRowBtn.className = "delete-row"
        deleteRowBtn.innerHTML = "×"
        deleteRowBtn.addEventListener("click", () => {
          content.rows.splice(rowIndex, 1)
          updateTable(note)
          updateNote(note)
        })

        deleteCell.appendChild(deleteRowBtn)
        tr.appendChild(deleteCell)

        tbody.appendChild(tr)
      })

      table.appendChild(tbody)
      tableContainer.appendChild(table)
    }

    // Initial table render
    updateTable(note)
  }

  function loadTimelineEditor(content, note, editorArea) {
    editorArea.className = "editor-area timeline-editor"

    // Create timeline container
    const timelineContainer = document.createElement("div")
    timelineContainer.className = "timeline"

    // Add timeline events
    content.events.forEach((event) => {
      const timelineItem = createTimelineItem(event, note)
      timelineContainer.appendChild(timelineItem)
    })

    // Add "Add event" button
    const addEventBtn = document.createElement("div")
    addEventBtn.className = "add-timeline-item"
    addEventBtn.innerHTML = "<span>+</span> Add event"
    addEventBtn.addEventListener("click", () => {
      const today = new Date().toISOString().split("T")[0]
      const newEvent = {
        id: Date.now().toString(),
        date: today,
        content: "",
      }

      content.events.push(newEvent)
      const timelineItem = createTimelineItem(newEvent, note)
      timelineContainer.insertBefore(timelineItem, addEventBtn)

      // Focus on the new item
      const contentElement = timelineItem.querySelector('[contenteditable="true"]')
      if (contentElement) {
        contentElement.focus()
      }

      updateNote(note)
    })

    timelineContainer.appendChild(addEventBtn)
    editorArea.appendChild(timelineContainer)
  }

  function createTimelineItem(event, note) {
    const timelineItem = document.createElement("div")
    timelineItem.className = "timeline-item"
    timelineItem.setAttribute("data-id", event.id)

    // Date input
    const dateContainer = document.createElement("div")
    dateContainer.className = "timeline-date"

    const dateInput = document.createElement("input")
    dateInput.type = "date"
    dateInput.value = event.date
    dateInput.addEventListener("change", function () {
      event.date = this.value
      updateNote(note)
    })

    dateContainer.appendChild(dateInput)

    // Content
    const contentContainer = document.createElement("div")
    contentContainer.className = "timeline-content"

    const content = document.createElement("div")
    content.contentEditable = "true"
    content.innerHTML = event.content
    content.addEventListener("input", function () {
      event.content = this.innerHTML
      updateNote(note)
    })

    contentContainer.appendChild(content)

    // Delete button
    const deleteBtn = document.createElement("div")
    deleteBtn.className = "remove-timeline-item"
    deleteBtn.innerHTML = "×"
    deleteBtn.addEventListener("click", () => {
      note.content.events = note.content.events.filter((e) => e.id !== event.id)
      timelineItem.remove()
      updateNote(note)
    })

    timelineItem.appendChild(dateContainer)
    timelineItem.appendChild(contentContainer)
    timelineItem.appendChild(deleteBtn)

    return timelineItem
  }

  function loadExpenseEditor(content, note, editorArea) {
    editorArea.className = "editor-area expense-editor"

    // Create expense tracker container
    const expenseContainer = document.createElement("div")
    expenseContainer.className = "expense-container"

    // Create view tabs
    const viewTabs = document.createElement("div")
    viewTabs.className = "expense-tabs"

    const views = ["daily", "monthly", "yearly"]
    views.forEach((view) => {
      const tab = document.createElement("span")
      tab.className = `expense-tab ${content.view === view ? "active" : ""}`
      tab.textContent = view.charAt(0).toUpperCase() + view.slice(1)
      tab.addEventListener("click", function () {
        // Update active tab
        document.querySelectorAll(".expense-tab").forEach((t) => t.classList.remove("active"))
        this.classList.add("active")

        // Update view
        content.view = view
        updateNote(note)
      })
      viewTabs.appendChild(tab)
    })

    expenseContainer.appendChild(viewTabs)

    // Add new expense button
    const addExpenseBtn = document.createElement("button")
    addExpenseBtn.className = "btn btn-primary add-expense-btn"
    addExpenseBtn.innerHTML = "+ Add Expense"
    addExpenseBtn.addEventListener("click", () => {
      const today = new Date().toISOString().split("T")[0]
      const newExpense = {
        id: Date.now().toString(),
        date: today,
        amount: 0,
        description: "New expense",
        category: "General",
      }

      content.expenses.push(newExpense)
      updateExpenseList(note)
      updateNote(note)
    })

    expenseContainer.appendChild(addExpenseBtn)

    // Create expense list
    const expenseList = document.createElement("div")
    expenseList.className = "expense-list"
    expenseContainer.appendChild(expenseList)

    // Update expense list function
    function updateExpenseList(note) {
      expenseList.innerHTML = ""

      // Group expenses by date
      const groupedExpenses = {}
      content.expenses.forEach((expense) => {
        if (!groupedExpenses[expense.date]) {
          groupedExpenses[expense.date] = []
        }
        groupedExpenses[expense.date].push(expense)
      })

      // Sort dates in descending order
      const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a))

      // Create expense groups
      sortedDates.forEach((date) => {
        const expenses = groupedExpenses[date]
        const totalAmount = expenses.reduce((sum, exp) => sum + Number.parseFloat(exp.amount || 0), 0)

        const expenseGroup = document.createElement("div")
        expenseGroup.className = "expense-group"

        // Date header
        const dateHeader = document.createElement("div")
        dateHeader.className = "expense-date"

        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        dateHeader.innerHTML = `
                    <span>${formattedDate}</span>
                    <span class="expense-total">$${totalAmount.toFixed(2)}</span>
                `

        expenseGroup.appendChild(dateHeader)

        // Expense items
        expenses.forEach((expense) => {
          const expenseItem = createExpenseItem(expense, note)
          expenseGroup.appendChild(expenseItem)
        })

        expenseList.appendChild(expenseGroup)
      })
    }

    function createExpenseItem(expense, note) {
      const expenseItem = document.createElement("div")
      expenseItem.className = "expense-item"
      expenseItem.setAttribute("data-id", expense.id)

      // Get icon for category
      const categoryIcon = getCategoryIcon(expense.category)

      // Create expense item content
      expenseItem.innerHTML = `
                <span class="expense-icon">${categoryIcon}</span>
                <input type="text" class="expense-name" value="${expense.description}">
                <select class="expense-category-select">
                    ${content.categories
                      .map(
                        (cat) => `
                        <option value="${cat}" ${expense.category === cat ? "selected" : ""}>${cat}</option>
                    `,
                      )
                      .join("")}
                </select>
                <input type="number" class="expense-amount-input" value="${expense.amount || 0}" step="0.01" min="0">
                <span class="delete-expense">×</span>
            `

      // Add event listeners
      const nameInput = expenseItem.querySelector(".expense-name")
      nameInput.addEventListener("input", function () {
        expense.description = this.value
        updateNote(note)
      })

      const categorySelect = expenseItem.querySelector(".expense-category-select")
      categorySelect.addEventListener("change", function () {
        expense.category = this.value
        expenseItem.querySelector(".expense-icon").textContent = getCategoryIcon(this.value)
        updateNote(note)
      })

      const amountInput = expenseItem.querySelector(".expense-amount-input")
      amountInput.addEventListener("input", function () {
        expense.amount = Number.parseFloat(this.value) || 0
        updateExpenseList(note) // Update to recalculate totals
        updateNote(note)
      })

      const deleteBtn = expenseItem.querySelector(".delete-expense")
      deleteBtn.addEventListener("click", () => {
        content.expenses = content.expenses.filter((e) => e.id !== expense.id)
        updateExpenseList(note)
        updateNote(note)
      })

      return expenseItem
    }

    function getCategoryIcon(category) {
      const icons = {
        Home: "🏠",
        Food: "🍔",
        Transportation: "🚗",
        Entertainment: "🎬",
        Utilities: "💡",
        Health: "❤️",
        Education: "📚",
        General: "💼",
      }
      return icons[category] || "💼"
    }

    editorArea.appendChild(expenseContainer)

    // Initial render
    updateExpenseList(note)
  }

  function loadStudentEditor(content, note, editorArea) {
    editorArea.className = "editor-area student-editor"

    // Create student planner container
    const studentContainer = document.createElement("div")
    studentContainer.className = "student-container"

    // Create tabs for different sections
    const sectionTabs = document.createElement("div")
    sectionTabs.className = "student-tabs"

    const sections = ["courses", "assignments", "exams"]
    sections.forEach((section) => {
      const tab = document.createElement("span")
      tab.className = "student-tab"
      tab.textContent = section.charAt(0).toUpperCase() + section.slice(1)
      tab.setAttribute("data-section", section)
      tab.addEventListener("click", function () {
        // Update active tab
        document.querySelectorAll(".student-tab").forEach((t) => t.classList.remove("active"))
        this.classList.add("active")

        // Show corresponding section
        document.querySelectorAll(".student-section-content").forEach((s) => (s.style.display = "none"))
        document.querySelector(`.${section}-section`).style.display = "block"
      })
      sectionTabs.appendChild(tab)
    })

    studentContainer.appendChild(sectionTabs)

    // Set first tab as active
    sectionTabs.querySelector(".student-tab").classList.add("active")

    // Create content sections
    const coursesSection = createCoursesSection(content, note)
    const assignmentsSection = createAssignmentsSection(content, note)
    const examsSection = createExamsSection(content, note)

    studentContainer.appendChild(coursesSection)
    studentContainer.appendChild(assignmentsSection)
    studentContainer.appendChild(examsSection)

    // Show first section, hide others
    coursesSection.style.display = "block"
    assignmentsSection.style.display = "none"
    examsSection.style.display = "none"

    editorArea.appendChild(studentContainer)

    // Create courses section
    function createCoursesSection(content, note) {
      const section = document.createElement("div")
      section.className = "student-section-content courses-section"

      // Add course button
      const addBtn = document.createElement("button")
      addBtn.className = "btn btn-primary add-course-btn"
      addBtn.innerHTML = "+ Add Course"
      addBtn.addEventListener("click", () => {
        const newCourse = {
          id: Date.now().toString(),
          name: "New Course",
          icon: "",
          color: getRandomColor(),
        }

        content.courses.push(newCourse)
        updateCoursesList(content, note)
        updateNote(note)
      })

      section.appendChild(addBtn)

      // Courses list
      const coursesList = document.createElement("div")
      coursesList.className = "courses-list"
      section.appendChild(coursesList)

      // Update courses list function
      function updateCoursesList(content, note) {
        coursesList.innerHTML = ""

        content.courses.forEach((course) => {
          const courseItem = document.createElement("div")
          courseItem.className = "course-item"
          courseItem.setAttribute("data-id", course.id)

          // Course content
          courseItem.innerHTML = `
                        <div class="course-icon" style="background-color: ${course.color}">${course.icon}</div>
                        <input type="text" class="course-name" value="${course.name}">
                        <div class="course-actions">
                            <span class="course-icon-selector">🔄</span>
                            <span class="delete-course">×</span>
                        </div>
                    `

          // Add event listeners
          const nameInput = courseItem.querySelector(".course-name")
          nameInput.addEventListener("input", function () {
            course.name = this.value
            updateNote(note)
          })

          const iconSelector = courseItem.querySelector(".course-icon-selector")
          iconSelector.addEventListener("click", () => {
            // Simple icon selection - in a real app, this would be a dropdown
            const icons = ["📚", "💻", "🧪", "🔬", "📐", "🎨", "🎭", "🏛️", "🌍", "📊"]
            const currentIndex = icons.indexOf(course.icon)
            const nextIndex = (currentIndex + 1) % icons.length
            course.icon = icons[nextIndex]
            courseItem.querySelector(".course-icon").textContent = course.icon
            updateNote(note)
          })

          const deleteBtn = courseItem.querySelector(".delete-course")
          deleteBtn.addEventListener("click", () => {
            if (confirm("Delete this course? This will also delete all associated assignments and exams.")) {
              // Remove course and associated items
              content.courses = content.courses.filter((c) => c.id !== course.id)
              content.assignments = content.assignments.filter((a) => a.courseId !== course.id)
              content.exams = content.exams.filter((e) => e.courseId !== course.id)

              updateCoursesList(content, note)
              updateNote(note)
            }
          })

          coursesList.appendChild(courseItem)
        })
      }

      // Initial render
      updateCoursesList(content, note)

      return section
    }

    // Create assignments section
    function createAssignmentsSection(content, note) {
      const section = document.createElement("div")
      section.className = "student-section-content assignments-section"

      // Add assignment button
      const addBtn = document.createElement("button")
      addBtn.className = "btn btn-primary add-assignment-btn"
      addBtn.innerHTML = "+ Add Assignment"
      addBtn.addEventListener("click", () => {
        if (content.courses.length === 0) {
          alert("Please create a course first")
          return
        }

        const newAssignment = {
          id: Date.now().toString(),
          courseId: content.courses[0].id,
          title: "New Assignment",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          completed: false,
        }

        content.assignments.push(newAssignment)
        updateAssignmentsList(content, note)
        updateNote(note)
      })

      section.appendChild(addBtn)

      // Assignments list
      const assignmentsList = document.createElement("div")
      assignmentsList.className = "assignments-list"
      section.appendChild(assignmentsList)

      // Update assignments list function
      function updateAssignmentsList(content, note) {
        assignmentsList.innerHTML = ""

        // Sort assignments by due date
        const sortedAssignments = [...content.assignments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

        sortedAssignments.forEach((assignment) => {
          const assignmentItem = document.createElement("div")
          assignmentItem.className = "assignment-item"
          assignmentItem.setAttribute("data-id", assignment.id)

          // Find associated course
          const course = content.courses.find((c) => c.id === assignment.courseId) || {
            name: "Unknown Course",
            icon: "📚",
            color: "#cccccc",
          }

          // Assignment content
          assignmentItem.innerHTML = `
                        <div class="assignment-status">
                            <input type="checkbox" class="assignment-completed" ${assignment.completed ? "checked" : ""}>
                        </div>
                        <div class="assignment-content">
                            <input type="text" class="assignment-title" value="${assignment.title}">
                            <div class="assignment-course">
                                <span class="course-icon" style="background-color: ${course.color}">${course.icon}</span>
                                <select class="assignment-course-select">
                                    ${content.courses
                                      .map(
                                        (c) => `
                                        <option value="${c.id}" ${c.id === assignment.courseId ? "selected" : ""}>${c.name}</option>
                                    `,
                                      )
                                      .join("")}
                                </select>
                            </div>
                        </div>
                        <div class="assignment-due-date">
                            <input type="date" class="assignment-date" value="${assignment.dueDate}">
                        </div>
                        <div class="assignment-actions">
                            <span class="delete-assignment">×</span>
                        </div>
                    `

          // Add event listeners
          const completedCheckbox = assignmentItem.querySelector(".assignment-completed")
          completedCheckbox.addEventListener("change", function () {
            assignment.completed = this.checked
            updateNote(note)
          })

          const titleInput = assignmentItem.querySelector(".assignment-title")
          titleInput.addEventListener("input", function () {
            assignment.title = this.value
            updateNote(note)
          })

          const courseSelect = assignmentItem.querySelector(".assignment-course-select")
          courseSelect.addEventListener("change", function () {
            assignment.courseId = this.value
            updateAssignmentsList(content, note) // Refresh to update course icon
            updateNote(note)
          })

          const dateInput = assignmentItem.querySelector(".assignment-date")
          dateInput.addEventListener("change", function () {
            assignment.dueDate = this.value
            updateAssignmentsList(content, note) // Refresh to maintain sort order
            updateNote(note)
          })

          const deleteBtn = assignmentItem.querySelector(".delete-assignment")
          deleteBtn.addEventListener("click", () => {
            content.assignments = content.assignments.filter((a) => a.id !== assignment.id)
            updateAssignmentsList(content, note)
            updateNote(note)
          })

          assignmentsList.appendChild(assignmentItem)
        })
      }

      // Initial render
      updateAssignmentsList(content, note)

      return section
    }

    // Create exams section
    function createExamsSection(content, note) {
      const section = document.createElement("div")
      section.className = "student-section-content exams-section"

      // Add exam button
      const addBtn = document.createElement("button")
      addBtn.className = "btn btn-primary add-exam-btn"
      addBtn.innerHTML = "+ Add Exam"
      addBtn.addEventListener("click", () => {
        if (content.courses.length === 0) {
          alert("Please create a course first")
          return
        }

        const newExam = {
          id: Date.now().toString(),
          courseId: content.courses[0].id,
          title: "New Exam",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          time: "09:00",
          location: "TBD",
        }

        content.exams.push(newExam)
        updateExamsList(content, note)
        updateNote(note)
      })

      section.appendChild(addBtn)

      // Exams list
      const examsList = document.createElement("div")
      examsList.className = "exams-list"
      section.appendChild(examsList)

      // Update exams list function
      function updateExamsList(content, note) {
        examsList.innerHTML = ""

        // Sort exams by date
        const sortedExams = [...content.exams].sort((a, b) => new Date(a.date) - new Date(b.date))

        sortedExams.forEach((exam) => {
          const examItem = document.createElement("div")
          examItem.className = "exam-item"
          examItem.setAttribute("data-id", exam.id)

          // Find associated course
          const course = content.courses.find((c) => c.id === exam.courseId) || {
            name: "Unknown Course",
            icon: "📚",
            color: "#cccccc",
          }

          // Exam content
          examItem.innerHTML = `
                        <div class="exam-content">
                            <input type="text" class="exam-title" value="${exam.title}">
                            <div class="exam-course">
                                <span class="course-icon" style="background-color: ${course.color}">${course.icon}</span>
                                <select class="exam-course-select">
                                    ${content.courses
                                      .map(
                                        (c) => `
                                        <option value="${c.id}" ${c.id === exam.courseId ? "selected" : ""}>${c.name}</option>
                                    `,
                                      )
                                      .join("")}
                                </select>
                            </div>
                        </div>
                        <div class="exam-details">
                            <div class="exam-date-time">
                                <input type="date" class="exam-date" value="${exam.date}">
                                <input type="time" class="exam-time" value="${exam.time}">
                            </div>
                            <div class="exam-location">
                                <input type="text" class="exam-location-input" value="${exam.location}" placeholder="Location">
                            </div>
                        </div>
                        <div class="exam-actions">
                            <span class="delete-exam">×</span>
                        </div>
                    `

          // Add event listeners
          const titleInput = examItem.querySelector(".exam-title")
          titleInput.addEventListener("input", function () {
            exam.title = this.value
            updateNote(note)
          })

          const courseSelect = examItem.querySelector(".exam-course-select")
          courseSelect.addEventListener("change", function () {
            exam.courseId = this.value
            updateExamsList(content, note) // Refresh to update course icon
            updateNote(note)
          })

          const dateInput = examItem.querySelector(".exam-date")
          dateInput.addEventListener("change", function () {
            exam.date = this.value
            updateExamsList(content, note) // Refresh to maintain sort order
            updateNote(note)
          })

          const timeInput = examItem.querySelector(".exam-time")
          timeInput.addEventListener("change", function () {
            exam.time = this.value
            updateNote(note)
          })

          const locationInput = examItem.querySelector(".exam-location-input")
          locationInput.addEventListener("input", function () {
            exam.location = this.value
            updateNote(note)
          })

          const deleteBtn = examItem.querySelector(".delete-exam")
          deleteBtn.addEventListener("click", () => {
            content.exams = content.exams.filter((e) => e.id !== exam.id)
            updateExamsList(content, note)
            updateNote(note)
          })

          examsList.appendChild(examItem)
        })
      }

      // Initial render
      updateExamsList(content, note)

      return section
    }

    function getRandomColor() {
      const colors = [
        "#4285F4", // Blue
        "#EA4335", // Red
        "#FBBC05", // Yellow
        "#34A853", // Green
        "#8E24AA", // Purple
        "#F4511E", // Orange
        "#039BE5", // Light Blue
        "#0F9D58", // Emerald
        "#757575", // Gray
        "#607D8B", // Blue Gray
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }
  }

  // Update favorite button appearance
  function updateFavoriteButton(isFavorite) {
    const favoriteBtn = document.getElementById("favorite-btn")
    const favoriteIcon = favoriteBtn.querySelector(".favorite-icon")
    
    if (isFavorite) {
      favoriteBtn.classList.add("active")
      favoriteIcon.textContent = "★"
    } else {
      favoriteBtn.classList.remove("active")
      favoriteIcon.textContent = "☆"
    }
  }

  // Get template icon and name
  function getTemplateInfo(templateKey) {
    const templates = {
      "basic": { icon: "📄", name: "Basic Note" },
      "todo": { icon: "✓", name: "Todo List" },
      "table": { icon: "📊", name: "Table" },
      "timeline": { icon: "📅", name: "Timeline" },
      "expense": { icon: "💰", name: "Expense Tracker" },
      "student": { icon: "🎓", name: "Student Planner" }
    }
    
    return templates[templateKey] || templates.basic
  }

  // Update note function
  function updateNote(note) {
    const saveStatus = document.getElementById("save-status")
    if (saveStatus) {
      saveStatus.textContent = "Saving..."
    }
    
    // Debounce save operation
    clearTimeout(window.saveTimeout)
    window.saveTimeout = setTimeout(() => {
      // Send update to server
      fetch(`http://localhost:3000/api/notes/update/${note._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(note)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to save note")
        }
        return response.json()
      })
      .then(data => {
        if (saveStatus) {
          saveStatus.textContent = "All changes saved"
        }
      })
      .catch(error => {
        console.error("Error saving note:", error)
        if (saveStatus) {
          saveStatus.textContent = "Error saving changes"
        }
      })
    }, 1000)
  }

  // Set up dropdown menu actions
  document.getElementById("share-note").addEventListener("click", function(e) {
    e.preventDefault()
    alert("Sharing functionality will be available soon!")
  })

  document.getElementById("export-note").addEventListener("click", function(e) {
    e.preventDefault()
    alert("Export functionality will be available soon!")
  })

  document.getElementById("duplicate-note").addEventListener("click", function(e) {
    e.preventDefault()
    if (currentNote) {
      duplicateNote(currentNote)
    }
  })

  document.getElementById("move-to-collection").addEventListener("click", function(e) {
    e.preventDefault()
    document.getElementById("collection-modal").style.display = "block"
  })

  document.getElementById("delete-note").addEventListener("click", function(e) {
    e.preventDefault()
    if (currentNote && confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      deleteNote(currentNote._id)
    }
  })

  // Set up collection modal
  const collectionModal = document.getElementById("collection-modal")
  const closeModal = document.querySelector(".close-modal")

  closeModal.addEventListener("click", function() {
    collectionModal.style.display = "none"
  })

  window.addEventListener("click", function(e) {
    if (e.target === collectionModal) {
      collectionModal.style.display = "none"
    }
  })

  document.getElementById("move-collection-btn").addEventListener("click", function() {
    if (currentNote) {
      const collectionId = document.getElementById("collection-select").value
      moveNoteToCollection(currentNote._id, collectionId)
    }
  })

  document.getElementById("create-collection-btn").addEventListener("click", function() {
    const newCollectionName = document.getElementById("new-collection").value.trim()
    if (newCollectionName) {
      createNewCollection(newCollectionName)
    }
  })

  // Set up favorite button
  document.getElementById("favorite-btn").addEventListener("click", function() {
    if (currentNote) {
      const isFavorite = !currentNote.favorite
      toggleFavorite(currentNote._id, isFavorite)
    }
  })

  // Title input change
  document.getElementById("note-title-input").addEventListener("input", function() {
    if (currentNote) {
      currentNote.title = this.value
      updateNote(currentNote)
    }
  })

  // Helper functions for note operations
  function toggleFavorite(noteId, isFavorite) {
    if (!noteId) return
    
    fetch(`http://localhost:3000/api/notes/favorite/${noteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ favorite: isFavorite })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to update favorite status")
      }
      return response.json()
    })
    .then(data => {
      if (currentNote) {
        currentNote.favorite = isFavorite
        updateFavoriteButton(isFavorite)
      }
    })
    .catch(error => {
      console.error("Error updating favorite status:", error)
    })
  }

  function moveNoteToCollection(noteId, collectionId) {
    if (!noteId) return
    
    fetch(`http://localhost:3000/api/notes/collection/${noteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ collection: collectionId })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to move note to collection")
      }
      return response.json()
    })
    .then(data => {
      if (currentNote) {
        currentNote.collection = data.collection
        collectionModal.style.display = "none"
        // Show success message
        const messageEl = document.createElement('div');
        messageEl.className = 'message-popup success';
        messageEl.textContent = 'Note moved to collection successfully';
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
          messageEl.classList.add('show');
        }, 10);
        
        setTimeout(() => {
          messageEl.classList.remove('show');
          setTimeout(() => {
            if (document.body.contains(messageEl)) {
              document.body.removeChild(messageEl);
            }
          }, 300);
        }, 3000);
      }
    })
    .catch(error => {
      console.error("Error moving note to collection:", error)
      // Show error message
      const messageEl = document.createElement('div');
      messageEl.className = 'message-popup error';
      messageEl.textContent = 'Error moving note to collection';
      document.body.appendChild(messageEl);
      
      setTimeout(() => {
        messageEl.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }, 300);
      }, 3000);
    })
  }

  function createNewCollection(name) {
    if (!name) return
    
    fetch(`http://localhost:3000/api/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        name: name,
        userId: currentUser._id
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to create collection")
      }
      return response.json()
    })
    .then(collection => {
      // Add new collection to select dropdown
      const collectionSelect = document.getElementById("collection-select")
      const option = document.createElement("option")
      option.value = collection._id
      option.textContent = collection.name
      collectionSelect.appendChild(option)
      
      // Select the new collection
      collectionSelect.value = collection._id
      
      // Clear the input field
      document.getElementById("new-collection").value = ""
      
      // Refresh sidebar collections
      loadCollections()
      
      // Show success message
      const messageEl = document.createElement('div');
      messageEl.className = 'message-popup success';
      messageEl.textContent = 'Collection created successfully';
      document.body.appendChild(messageEl);
      
      setTimeout(() => {
        messageEl.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }, 300);
      }, 3000);
    })
    .catch(error => {
      console.error("Error creating collection:", error)
      // Show error message
      const messageEl = document.createElement('div');
      messageEl.className = 'message-popup error';
      messageEl.textContent = 'Error creating collection';
      document.body.appendChild(messageEl);
      
      setTimeout(() => {
        messageEl.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }, 300);
      }, 3000);
    })
  }

  function deleteNote(noteId) {
    if (!noteId) return
    
    fetch(`http://localhost:3000/api/notes/${noteId}`, {
      method: "DELETE"
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to delete note")
      }
      return response.json()
    })
    .then(data => {
      // Redirect to dashboard
      window.location.href = "dashboard.html"
    })
    .catch(error => {
      console.error("Error deleting note:", error)
    })
  }

  function duplicateNote(note) {
    if (!note) return
    
    // Create copy of note
    const noteCopy = { ...note }
    delete noteCopy._id // Remove ID so a new one is generated
    noteCopy.title = `${note.title} (Copy)`
    noteCopy.createdAt = new Date().toISOString()
    noteCopy.updatedAt = new Date().toISOString()
    
    fetch(`http://localhost:3000/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(noteCopy)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to duplicate note")
      }
      return response.json()
    })
    .then(newNote => {
      // Redirect to the new note
      window.location.href = `note-editor.html?id=${newNote._id}`
    })
    .catch(error => {
      console.error("Error duplicating note:", error)
    })
  }
})

