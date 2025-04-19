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

  // Initialize template cards and details view
  initTemplateCards();
  initTemplateDetails();
  
  // Initialize modal
  initCreateNoteModal();
  
  // Add back button functionality
  const backButton = document.getElementById("back-btn");
  if (backButton) {
    backButton.addEventListener("click", () => {
      const mainContent = document.querySelector('.main-content');
      mainContent.classList.remove('show-details');
    });
  }

  function initTemplateCards() {
    const templateCards = document.querySelectorAll(".template-card");
    const mainContent = document.querySelector('.main-content');
    
    templateCards.forEach(card => {
      // Click on template card to show details
      card.addEventListener("click", function() {
        const template = this.getAttribute("data-template");
        showTemplateDetails(template);
        
        // Add class to main content to toggle view
        mainContent.classList.add('show-details');
        
        // Update hidden input in modal
        document.getElementById('note-template').value = template;
      });
      
      // Click on use template button
      const useTemplateBtn = card.querySelector('.use-template');
      useTemplateBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click
        const template = card.getAttribute('data-template');
        document.getElementById('note-template').value = template;
        document.getElementById('create-note-modal').style.display = 'block';
      });
    });
  }
  
  function initTemplateDetails() {
    // Handle create from template button in details view
    const createFromTemplateBtn = document.getElementById('create-from-template');
    if (createFromTemplateBtn) {
      createFromTemplateBtn.addEventListener('click', function() {
        document.getElementById('create-note-modal').style.display = 'block';
      });
    }
  }
  
  function showTemplateDetails(template) {
    // Set the selected template in the details view
    const detailIcon = document.getElementById('detail-icon');
    const detailTitle = document.getElementById('detail-title');
    const detailDescription = document.getElementById('detail-description');
    const detailFeatures = document.getElementById('detail-features');
    const detailBestUses = document.getElementById('detail-best-uses');
    const detailPreview = document.getElementById('detail-preview');
    
    // Update details based on template
    switch(template) {
      case 'basic':
        detailIcon.textContent = '📄';
        detailTitle.textContent = 'Basic Note';
        detailDescription.textContent = 'A clean, simple note for general writing and note-taking.';
        detailFeatures.innerHTML = `
          <li>Rich text formatting</li>
          <li>Support for headings, lists, and links</li>
          <li>Insert images and attachments</li>
          <li>Clean, distraction-free writing experience</li>
        `;
        detailBestUses.innerHTML = `
          <li>Meeting notes</li>
          <li>Project documentation</li>
          <li>Journal entries</li>
          <li>Research notes</li>
        `;
        updatePreviewContent(detailPreview, generateBasicPreview());
        break;
      case 'todo':
        detailIcon.textContent = '✓';
        detailTitle.textContent = 'Todo List';
        detailDescription.textContent = 'Keep track of tasks with interactive checkboxes and task management.';
        detailFeatures.innerHTML = `
          <li>Interactive checkboxes</li>
          <li>Add, edit, and delete tasks</li>
          <li>Mark tasks as complete</li>
          <li>Organize tasks with priorities</li>
        `;
        detailBestUses.innerHTML = `
          <li>Daily task lists</li>
          <li>Project checklists</li>
          <li>Shopping lists</li>
          <li>Travel packing lists</li>
        `;
        updatePreviewContent(detailPreview, generateTodoPreview());
        break;
      case 'table':
        detailIcon.textContent = '📊';
        detailTitle.textContent = 'Table';
        detailDescription.textContent = 'Organize information in rows and columns with interactive tables.';
        detailFeatures.innerHTML = `
          <li>Create structured data tables</li>
          <li>Add and remove rows and columns</li>
          <li>Sort and filter table data</li>
          <li>Format cells with different styles</li>
        `;
        detailBestUses.innerHTML = `
          <li>Data comparison</li>
          <li>Project timelines</li>
          <li>Content calendars</li>
          <li>Budget planning</li>
        `;
        updatePreviewContent(detailPreview, generateTablePreview());
        break;
      case 'timeline':
        detailIcon.textContent = '📅';
        detailTitle.textContent = 'Timeline';
        detailDescription.textContent = 'Track events chronologically with an interactive timeline layout.';
        detailFeatures.innerHTML = `
          <li>Visualize events chronologically</li>
          <li>Add dates, titles, and descriptions</li>
          <li>Color-coded event categories</li>
          <li>Easily navigate through time periods</li>
        `;
        detailBestUses.innerHTML = `
          <li>Project milestones</li>
          <li>Historical timelines</li>
          <li>Life events</li>
          <li>Content planning</li>
        `;
        updatePreviewContent(detailPreview, generateTimelinePreview());
        break;
      case 'expense':
        detailIcon.textContent = '💰';
        detailTitle.textContent = 'Expense Tracker';
        detailDescription.textContent = 'Track income and expenses with categories and visualizations.';
        detailFeatures.innerHTML = `
          <li>Track income and expenses</li>
          <li>Categorize transactions</li>
          <li>Calculate totals and balances</li>
          <li>Visual summary of financial data</li>
        `;
        detailBestUses.innerHTML = `
          <li>Personal budget</li>
          <li>Trip expenses</li>
          <li>Business expenses</li>
          <li>Project budgeting</li>
        `;
        updatePreviewContent(detailPreview, generateExpensePreview());
        break;
      case 'student':
        detailIcon.textContent = '🎓';
        detailTitle.textContent = 'Student Planner';
        detailDescription.textContent = 'Manage courses, assignments, and academic schedules.';
        detailFeatures.innerHTML = `
          <li>Track courses and class schedules</li>
          <li>Manage assignments and due dates</li>
          <li>Monitor grades and progress</li>
          <li>Set study reminders</li>
        `;
        detailBestUses.innerHTML = `
          <li>Course organization</li>
          <li>Assignment tracking</li>
          <li>Exam preparation</li>
          <li>Academic planning</li>
        `;
        updatePreviewContent(detailPreview, generateStudentPreview());
        break;
    }
  }
  
  function updatePreviewContent(previewElement, content) {
    // Replace the image with actual content preview
    if (previewElement) {
      previewElement.outerHTML = content;
    }
  }
  
  function generateBasicPreview() {
    return `
      <div id="detail-preview" class="preview-content basic-preview">
        <h1>Welcome to Your Note</h1>
        <p>This is a simple, clean note for your thoughts.</p>
        <h2>Use headings to organize</h2>
        <ul>
          <li>Create lists for better organization</li>
          <li>Add <strong>formatting</strong> to emphasize important points</li>
          <li>Insert links, images, and more</li>
        </ul>
        <p>Start writing and capture your ideas effortlessly.</p>
      </div>
    `;
  }
  
  function generateTodoPreview() {
    return `
      <div id="detail-preview" class="preview-content todo-preview">
        <h2>My Tasks</h2>
        <div class="todo-item">
          <div class="todo-checkbox checked"></div>
          <div class="todo-text">Complete project proposal</div>
        </div>
        <div class="todo-item">
          <div class="todo-checkbox"></div>
          <div class="todo-text">Schedule team meeting</div>
        </div>
        <div class="todo-item">
          <div class="todo-checkbox"></div>
          <div class="todo-text">Review quarterly goals</div>
        </div>
        <div class="todo-item">
          <div class="todo-checkbox"></div>
          <div class="todo-text">Prepare presentation slides</div>
        </div>
        <div class="todo-add">+ Add new task</div>
      </div>
    `;
  }
  
  function generateTablePreview() {
    return `
      <div id="detail-preview" class="preview-content table-preview">
        <h2>Project Status</h2>
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Research</td>
              <td>John</td>
              <td>Mar 15</td>
              <td>Completed</td>
            </tr>
            <tr>
              <td>Design</td>
              <td>Lisa</td>
              <td>Mar 22</td>
              <td>In Progress</td>
            </tr>
            <tr>
              <td>Development</td>
              <td>Michael</td>
              <td>Apr 5</td>
              <td>Not Started</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  
  function generateTimelinePreview() {
    return `
      <div id="detail-preview" class="preview-content timeline-preview">
        <h2>Project Timeline</h2>
        <div class="timeline-container">
          <div class="timeline-entry">
            <div class="timeline-date">March 1</div>
            <div class="timeline-title">Project Kickoff</div>
            <div class="timeline-description">Initial meeting with stakeholders to define project scope and goals</div>
          </div>
          <div class="timeline-entry">
            <div class="timeline-date">March 15</div>
            <div class="timeline-title">Research Phase</div>
            <div class="timeline-description">Complete market analysis and user research</div>
          </div>
          <div class="timeline-entry">
            <div class="timeline-date">April 10</div>
            <div class="timeline-title">Design Approval</div>
            <div class="timeline-description">Present designs to stakeholders for approval</div>
          </div>
        </div>
      </div>
    `;
  }
  
  function generateExpensePreview() {
    return `
      <div id="detail-preview" class="preview-content expense-preview">
        <h2>Monthly Expenses</h2>
        <div class="expense-summary">
          <div class="expense-stat">
            <div class="expense-stat-title">Income</div>
            <div class="expense-stat-value income">$3,500.00</div>
          </div>
          <div class="expense-stat">
            <div class="expense-stat-title">Expenses</div>
            <div class="expense-stat-value expenses">$2,180.50</div>
          </div>
          <div class="expense-stat">
            <div class="expense-stat-title">Balance</div>
            <div class="expense-stat-value">$1,319.50</div>
          </div>
        </div>
        <div class="expense-list">
          <div class="expense-item">
            <div class="expense-name">Rent</div>
            <div class="expense-category">Housing</div>
            <div class="expense-amount expense">-$1,200.00</div>
          </div>
          <div class="expense-item">
            <div class="expense-name">Groceries</div>
            <div class="expense-category">Food</div>
            <div class="expense-amount expense">-$350.50</div>
          </div>
          <div class="expense-item">
            <div class="expense-name">Salary</div>
            <div class="expense-category">Income</div>
            <div class="expense-amount income">+$3,500.00</div>
          </div>
        </div>
      </div>
    `;
  }
  
  function generateStudentPreview() {
    return `
      <div id="detail-preview" class="preview-content student-preview">
        <h2>Student Planner</h2>
        <div class="course-grid">
          <div class="course-card">
            <div class="course-header">
              <div class="course-title">Computer Science 101</div>
              <div class="course-code">CS101</div>
            </div>
            <div class="course-body">
              <div class="course-schedule">Mon/Wed 10:00-11:30</div>
              <div class="course-instructor">Prof. Johnson</div>
              <div class="course-progress">
                <div class="progress-bar" style="width: 65%"></div>
              </div>
              <div class="progress-text">65% Complete</div>
            </div>
          </div>
          <div class="course-card">
            <div class="course-header">
              <div class="course-title">Mathematics</div>
              <div class="course-code">MATH202</div>
            </div>
            <div class="course-body">
              <div class="course-schedule">Tue/Thu 13:00-14:30</div>
              <div class="course-instructor">Prof. Smith</div>
              <div class="course-progress">
                <div class="progress-bar" style="width: 40%"></div>
              </div>
              <div class="progress-text">40% Complete</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function initCreateNoteModal() {
    const modal = document.getElementById('create-note-modal');
    const closeModal = document.querySelector('.close-modal');
    const createNoteBtn = document.getElementById('create-note-btn');
    
    // Close modal when clicking X
    if (closeModal) {
      closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // Create note button
    if (createNoteBtn) {
      createNoteBtn.addEventListener('click', function() {
        const title = document.getElementById('note-title').value || 'Untitled Note';
        const template = document.getElementById('note-template').value;
        const collection = document.getElementById('note-collection').value;
        
        createNewNote(title, template, collection);
      });
    }
  }

  function createNewNote(title, template, collection) {
    // Create note object
    const note = {
      title: title,
      template: template,
      collection: collection,
      content: getTemplateContent(template),
      userId: currentUser._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create note via API
    fetch('http://localhost:3000/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(note)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      return response.json();
    })
    .then(data => {
      // Redirect to editor with the new note ID
      window.location.href = `note-editor.html?id=${data._id}`;
    })
    .catch(error => {
      console.error('Error creating note:', error);
      showMessage('Error creating note: ' + error.message, 'error');
    });
  }

  // Helper function
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
  
  // Show message function
  function showMessage(message, type = 'success') {
    // Check if the message container already exists
    let messageContainer = document.querySelector('.message-popup');
    
    // If it doesn't exist, create it
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = `message-popup ${type}`;
      document.body.appendChild(messageContainer);
    } else {
      // If it exists, update its class
      messageContainer.className = `message-popup ${type}`;
    }
    
    // Set the message text
    messageContainer.textContent = message;
    
    // Show the message
    setTimeout(() => {
      messageContainer.classList.add('show');
    }, 10);
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      messageContainer.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(messageContainer)) {
          document.body.removeChild(messageContainer);
        }
      }, 300);
    }, 3000);
  }

  // Add message styles if not already present
  if (!document.getElementById('message-styles')) {
    const style = document.createElement('style');
    style.id = 'message-styles';
    style.textContent = `
      .message-popup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 0.9rem;
        box-shadow: var(--shadow-md);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
      }
      
      .message-popup.show {
        transform: translateY(0);
        opacity: 1;
      }
      
      .message-popup.success {
        background-color: #C6F6D5;
        color: #22543D;
      }
      
      .message-popup.error {
        background-color: #FED7D7;
        color: #822727;
      }
      
      @media (prefers-color-scheme: dark) {
        .message-popup.success {
          background-color: rgba(198, 246, 213, 0.2);
          color: #9AE6B4;
        }
        
        .message-popup.error {
          background-color: rgba(254, 215, 215, 0.2);
          color: #FEB2B2;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
})

