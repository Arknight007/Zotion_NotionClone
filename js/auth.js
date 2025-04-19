document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in from session storage (temporary client-side storage)
  const currentUser = sessionStorage.getItem("currentUser");
  if (currentUser && window.location.pathname.includes("index.html")) {
    window.location.href = "dashboard.html";
  }

  const validationState = {
    signup: {
      name: false,
      email: false,
      password: false,
      confirmPassword: false,
    },
    signin: {
      email: false,
      password: false,
    },
  };

  // SIGN UP
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    const nameInput = signupForm.querySelector("#name");
    const emailInput = signupForm.querySelector("#email");
    const passwordInput = signupForm.querySelector("#password");
    const confirmPasswordInput = signupForm.querySelector("#confirm-password");
    const signupButton = signupForm.querySelector("#signup-button");
    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const confirmPasswordError = document.getElementById("confirm-password-error");
    const passwordStrengthMeter = document.getElementById("password-strength-meter");
    
    // Password requirements elements
    const lengthRequirement = document.getElementById("length-requirement");
    const uppercaseRequirement = document.getElementById("uppercase-requirement");
    const lowercaseRequirement = document.getElementById("lowercase-requirement");
    const numberRequirement = document.getElementById("number-requirement");
    const specialRequirement = document.getElementById("special-requirement");

    if (signupButton) {
      signupButton.disabled = false;
      
      // Add direct click handler to ensure button works
      signupButton.addEventListener('click', function(e) {
        console.log('Signup button clicked directly');
        // Let the form submit handler handle the actual submission
      });
    }

    passwordInput?.addEventListener("input", () => {
      updatePasswordStrengthVisual(passwordInput.value);
    });

    // Add direct form submit function for testing
    window.submitSignupForm = function() {
      console.log('Direct form submission triggered');
      const nameValid = validateName(nameInput.value);
      const emailValid = validateEmail(emailInput.value, "signup");
      const passwordValid = validatePassword(passwordInput.value);
      const confirmPasswordValid = validateConfirmPassword(confirmPasswordInput.value, passwordInput.value);
      
      console.log('Validation results:', {
        nameValid,
        emailValid,
        passwordValid,
        confirmPasswordValid
      });
      
      if (nameValid && emailValid && passwordValid && confirmPasswordValid) {
        console.log('Validation passed, submitting to API');
        registerUser(nameInput.value, emailInput.value, passwordInput.value);
      } else {
        let errorMessage = "Please fix the following issues:<ul>";
        if (!nameValid) errorMessage += "<li>Name is required</li>";
        if (!emailValid) errorMessage += "<li>Valid email is required</li>";
        if (!passwordValid) errorMessage += "<li>Password doesn't meet requirements</li>";
        if (!confirmPasswordValid) errorMessage += "<li>Passwords don't match</li>";
        errorMessage += "</ul>";

        showPopup("error", "Registration Failed", errorMessage);
      }
    };
    
    // Function to handle the actual API call
    function registerUser(name, email, password) {
      console.log('Form validation passed, sending registration request...');
      // Register user via API
      fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
        }),
      })
      .then(response => {
        console.log('Registration response status:', response.status);
        if (!response.ok) {
          return response.json().then(data => {
            console.error('Registration error data:', data);
            throw new Error(data.error || 'Registration failed');
          });
        }
        return response.json();
      })
      .then(user => {
        console.log('Registration successful, user data:', user);
        // Store user in session storage (temporary client-side storage)
        sessionStorage.setItem("currentUser", JSON.stringify(user));
        showPopup("success", "Registration Successful", "Your account has been created successfully. Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
      })
      .catch(error => {
        console.error('Registration error:', error);
        showPopup("error", "Registration Failed", error.message);
      });
    }

    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log('Form submit event triggered');
      
      // Use the direct submission function
      window.submitSignupForm();
    });
  }

  // SIGN IN
  const signinForm = document.getElementById("signin-form");
  if (signinForm) {
    const emailInput = signinForm.querySelector("#email");
    const passwordInput = signinForm.querySelector("#password");
    const signinButton = signinForm.querySelector("#signin-button");

    if (signinButton) signinButton.disabled = false;

    signinForm.addEventListener("submit", function(e) {
      e.preventDefault();
      
      // Reset errors
      resetErrors();
      
      // Validate inputs
      let isValid = true;
      
      if (!emailInput.value) {
        showError(emailInput, emailError, "Email is required");
        isValid = false;
      } else if (!isValidEmail(emailInput.value)) {
        showError(emailInput, emailError, "Please enter a valid email address");
        isValid = false;
      }
      
      if (!passwordInput.value) {
        showError(passwordInput, passwordError, "Password is required");
        isValid = false;
      }
      
      if (isValid) {
        // Attempt login
        fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailInput.value,
            password: passwordInput.value,
          }),
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || 'Login failed');
            });
          }
          return response.json();
        })
        .then(user => {
          // Store user in session storage
          sessionStorage.setItem("currentUser", JSON.stringify(user));
          
          // Redirect to dashboard
          window.location.href = "dashboard.html";
        })
        .catch(error => {
          console.error("Login error:", error);
          showError(emailInput, emailError, error.message);
        });
      }
    });
  }

  // VALIDATIONS
  function validateName(name) {
    return name.trim().length >= 2;
  }

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email.trim() !== "" && emailRegex.test(email);
  }

  function validatePassword(password) {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const strength = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    return strength >= 3 && hasLength;
  }

  function validateConfirmPassword(confirmPassword, password) {
    return confirmPassword === password && confirmPassword !== "";
  }

  function validateSigninPassword(password) {
    return password.trim() !== "";
  }

  // STRENGTH METER
  function updatePasswordStrengthVisual(password) {
    const strengthMeter = document.getElementById("password-strength-meter");
    const requirements = {
      length: document.getElementById("length-requirement"),
      upper: document.getElementById("uppercase-requirement"),
      lower: document.getElementById("lowercase-requirement"),
      number: document.getElementById("number-requirement"),
      special: document.getElementById("special-requirement"),
    };

    if (!strengthMeter || Object.values(requirements).some(el => !el)) return;

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    resetRequirement(requirements.length);
    resetRequirement(requirements.upper);
    resetRequirement(requirements.lower);
    resetRequirement(requirements.number);
    resetRequirement(requirements.special);

    if (hasLength) setRequirementMet(requirements.length);
    if (hasUpper) setRequirementMet(requirements.upper);
    if (hasLower) setRequirementMet(requirements.lower);
    if (hasNumber) setRequirementMet(requirements.number);
    if (hasSpecial) setRequirementMet(requirements.special);

    const strength = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    const strengthPercent = Math.min(100, (strength / 3) * 100);

    strengthMeter.style.width = `${strengthPercent}%`;
    strengthMeter.style.backgroundColor = getStrengthColor(strength);

    validationState.signup.password = strength >= 3 && hasLength;
    updateSignupButton();
  }

  function resetRequirement(reqElement) {
    if (reqElement) {
      reqElement.classList.remove("valid");
      reqElement.classList.add("invalid");
    }
  }

  function setRequirementMet(reqElement) {
    if (reqElement) {
      reqElement.classList.remove("invalid");
      reqElement.classList.add("valid");
    }
  }

  function getStrengthColor(strength) {
    if (strength < 2) return "#EA4335"; // Red
    if (strength < 3) return "#FBBC05"; // Yellow
    return "#34A853"; // Green
  }

  function updateSignupButton() {
    const signupButton = document.querySelector("#signup-button");
    if (!signupButton) return;

    const { name, email, password, confirmPassword } = validationState.signup;
    signupButton.disabled = !(name && email && password && confirmPassword);
  }

  // POPUP MESSAGE
  function showPopup(type, title, message) {
    // Remove any existing popups
    const existingPopup = document.querySelector(".popup");
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup element
    const popup = document.createElement("div");
    popup.className = `popup popup-${type}`;
    popup.innerHTML = `
      <div class="popup-title">
        <span>${title}</span>
        <span class="popup-close">&times;</span>
      </div>
      <div class="popup-message">${message}</div>
    `;

    // Add popup to body
    document.body.appendChild(popup);

    // Add close functionality
    const closeBtn = popup.querySelector(".popup-close");
    closeBtn.addEventListener("click", () => {
      closePopup(popup);
    });

    // Auto close after 5 seconds for success messages, 8 seconds for errors
    const timeout = type === "success" ? 5000 : 8000;
    setTimeout(() => {
      if (document.body.contains(popup)) {
        closePopup(popup);
      }
    }, timeout);
  }

  function closePopup(popup) {
    popup.classList.add("popup-closing");
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 300);
  }

  // Helper functions
  function showError(inputElement, errorElement, message) {
    inputElement.parentElement.classList.add("error");
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
  
  function resetErrors() {
    // Clear all errors
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach(element => {
      element.textContent = "";
      element.style.display = "none";
    });
    
    const inputParents = document.querySelectorAll(".error");
    inputParents.forEach(element => {
      element.classList.remove("error");
    });
  }
  
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function isStrongPassword(password) {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    return hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }
});
