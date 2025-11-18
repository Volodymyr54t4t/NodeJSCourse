// Import AOS library
const AOS = window.AOS

document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS (Animate On Scroll)
  AOS.init({
    duration: 800,
    easing: "ease",
    once: false,
    mirror: false,
  })

  // Initialize Three.js for hero particles
  initParticles()

  // Setup custom cursor
  setupCustomCursor()

  // Setup navigation
  setupNavigation()

  // Setup scroll effects
  setupScrollEffects()

  // Fetch lessons
  fetchLessons()

  // Setup event listeners
  setupEventListeners()

  // Setup contact form
  setupContactForm()

  // Setup stats counter
  setupStatsCounter()

  // Setup lesson filter
  setupLessonFilter()

  // Check auth and load progress
  checkAuthStatus()
  loadUserProgress()
})

let lessons = []
let currentLesson = null
let currentTest = null
let currentQuestionIndex = 0
let userAnswers = []
let originalCorrectAnswers = []

// Custom Cursor
function setupCustomCursor() {
  const cursorGlow = document.querySelector(".cursor-glow")
  const cursorDot = document.querySelector(".cursor-dot")

  if (!cursorGlow || !cursorDot) return

  document.addEventListener("mousemove", (e) => {
    cursorGlow.style.left = e.clientX + "px"
    cursorGlow.style.top = e.clientY + "px"

    cursorDot.style.left = e.clientX + "px"
    cursorDot.style.top = e.clientY + "px"
  })

  // Change cursor size on clickable elements
  const clickables = document.querySelectorAll("a, button, .lesson-card, .project-card, .close")

  clickables.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      cursorGlow.style.width = "50px"
      cursorGlow.style.height = "50px"
      cursorGlow.style.background = "radial-gradient(circle, rgba(104, 211, 145, 0.8) 0%, rgba(104, 211, 145, 0) 70%)"
      cursorDot.style.backgroundColor = "var(--secondary-color)"
    })

    element.addEventListener("mouseleave", () => {
      cursorGlow.style.width = "30px"
      cursorGlow.style.height = "30px"
      cursorGlow.style.background = "radial-gradient(circle, rgba(104, 211, 145, 0.5) 0%, rgba(104, 211, 145, 0) 70%)"
      cursorDot.style.backgroundColor = "var(--primary-color)"
    })
  })
}

// Navigation
function setupNavigation() {
  const menuToggle = document.querySelector(".menu-toggle")
  const navLinks = document.querySelector(".nav-links")

  if (!menuToggle || !navLinks) return

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active")
    navLinks.classList.toggle("active")
  })

  // Close menu when clicking on a link
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("active")
      navLinks.classList.remove("active")
    })
  })
}

// Scroll Effects
function setupScrollEffects() {
  const header = document.querySelector("header")
  const backToTop = document.querySelector(".back-to-top")

  window.addEventListener("scroll", () => {
    // Header effect
    if (header && window.scrollY > 100) {
      header.classList.add("scrolled")
    } else if (header) {
      header.classList.remove("scrolled")
    }

    // Back to top button
    if (backToTop && window.scrollY > 500) {
      backToTop.classList.add("visible")
    } else if (backToTop) {
      backToTop.classList.remove("visible")
    }
  })

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        })
      }
    })
  })
}

// Three.js Particles
function initParticles() {
  const particlesContainer = document.querySelector(".hero-particles")
  if (!particlesContainer) return

  // Import Three.js library
  const THREE = window.THREE
  if (!THREE) return

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  particlesContainer.appendChild(renderer.domElement)

  // Create particles
  const particlesGeometry = new THREE.BufferGeometry()
  const particlesCount = 2000

  const posArray = new Float32Array(particlesCount * 3)
  const colorsArray = new Float32Array(particlesCount * 3)

  for (let i = 0; i < particlesCount * 3; i++) {
    // Position
    posArray[i] = (Math.random() - 0.5) * 10

    // Colors (green to magenta gradient)
    if (i % 3 === 0) {
      // R
      colorsArray[i] = Math.random() * 0.5
    } else if (i % 3 === 1) {
      // G
      colorsArray[i] = Math.random() * 0.5 + 0.5
    } else {
      // B
      colorsArray[i] = Math.random() * 0.5
    }
  }

  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3))

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.01,
    vertexColors: true,
    transparent: true,
    sizeAttenuation: true,
  })

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particlesMesh)

  camera.position.z = 3

  // Animation
  function animate() {
    requestAnimationFrame(animate)

    particlesMesh.rotation.x += 0.0005
    particlesMesh.rotation.y += 0.0005

    renderer.render(scene, camera)
  }

  animate()

  // Resize handler
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

// Fetch Lessons
async function fetchLessons() {
  try {
    const response = await fetch("lessons.json")
    lessons = await response.json()
    displayLessons(lessons)
  } catch (error) {
    showToast("Помилка завантаження уроків", "error")
  }
}

function displayLessons(lessons) {
  const container = document.getElementById("lessons-container")
  if (!container) return

  container.innerHTML = lessons
    .map(
      (lesson) => `
          <div class="lesson-card" data-category="${getLessonCategory(lesson.title)}">
              <div class="lesson-icon">
                  <i class="${getLessonIcon(lesson.title)}"></i>
              </div>
              <h3>${lesson.title}</h3>
              <div class="lesson-meta">
                  <span class="lesson-difficulty">${lesson.difficulty}</span>
                  <span class="lesson-duration">${lesson.duration}</span>
              </div>
              <p>${lesson.description}</p>
              <button class="cta-button primary lesson-button" data-id="${lesson.id}">
                  <span class="cta-text">Вивчити</span>
                  <span class="cta-icon"><i class="fas fa-graduation-cap"></i></span>
              </button>
          </div>
      `,
    )
    .join("")

  document.querySelectorAll(".lesson-button").forEach((button) => {
    button.addEventListener("click", () => showLesson(button.dataset.id))
  })
}

function getLessonCategory(title) {
  if (title.includes("Основи") || title.includes("встановлення") || title.includes("Модулі") || title.includes("NPM"))
    return "basics"
  if (
    title.includes("Express") ||
    title.includes("MongoDB") ||
    title.includes("Асинхронне") ||
    title.includes("Аутентифікація")
  )
    return "advanced"
  if (title.includes("Тестування") || title.includes("Деплой")) return "practice"
  return "basics"
}

function getLessonIcon(title) {
  if (title.includes("Основи")) return "fas fa-play-circle"
  if (title.includes("Модулі")) return "fas fa-cube"
  if (title.includes("HTTP")) return "fas fa-server"
  if (title.includes("Асинхронне")) return "fas fa-sync-alt"
  if (title.includes("NPM")) return "fas fa-box"
  if (title.includes("Express")) return "fas fa-rocket"
  if (title.includes("MongoDB") || title.includes("базами даних")) return "fas fa-database"
  if (title.includes("Аутентифікація") || title.includes("безпека")) return "fas fa-shield-alt"
  if (title.includes("Тестування")) return "fas fa-vial"
  if (title.includes("Деплой") || title.includes("продакшн")) return "fas fa-cloud"
  return "fas fa-code"
}

function showLesson(id) {
  currentLesson = lessons.find((l) => l.id === Number.parseInt(id))
  if (currentLesson) {
    const modal = document.getElementById("lesson-modal")
    document.getElementById("modal-title").textContent = currentLesson.title
    document.getElementById("modal-difficulty").textContent = currentLesson.difficulty
    document.getElementById("modal-duration").textContent = currentLesson.duration
    document.getElementById("modal-content").innerHTML = currentLesson.content

    document.getElementById("code-example").textContent = currentLesson.example
    document.getElementById("code-output").textContent = ""
    modal.style.display = "block"
    document.body.style.overflow = "hidden"
  }
}

function executeCode() {
  const code = document.getElementById("code-example").textContent
  const outputElement = document.getElementById("code-output")

  try {
    const safeRequire = (module) => {
      if (module === "fs") {
        return {
          readFileSync: (path, encoding) => {
            if (path === "package.json") {
              return JSON.stringify(
                {
                  name: "my-node-app",
                  version: "1.0.0",
                  description: "Мій Node.js додаток",
                  main: "index.js",
                  scripts: {
                    start: "node index.js",
                    dev: "nodemon index.js",
                  },
                },
                null,
                2,
              )
            }
            throw new Error("Файл не знайдено")
          },
          readFile: (path, encoding, callback) => {
            setTimeout(() => {
              if (path === "package.json") {
                callback(
                  null,
                  JSON.stringify(
                    {
                      name: "my-node-app",
                      version: "1.0.0",
                    },
                    null,
                    2,
                  ),
                )
              } else {
                callback(new Error("Файл не знайдено"))
              }
            }, 100)
          },
        }
      }
      if (module === "path") {
        return {
          join: (...paths) => paths.join("/"),
          extname: (path) => path.split(".").pop() || "",
        }
      }
      if (module === "http") {
        return {
          createServer: (callback) => ({
            listen: (port, cb) => {
              setTimeout(() => {
                cb && cb()
              }, 100)
            },
          }),
        }
      }
      if (module === "express") {
        const mockApp = {
          use: (middleware) => console.log("Middleware додано"),
          get: (path, handler) => console.log(`GET маршрут: ${path}`),
          post: (path, handler) => console.log(`POST маршрут: ${path}`),
          listen: (port, cb) => {
            setTimeout(() => {
              cb && cb()
            }, 100)
          },
        }
        return () => mockApp
      }
      if (module === "mongoose") {
        return {
          connect: (url) => console.log("Підключено до MongoDB"),
          Schema: function (definition) {
            this.definition = definition
            this.pre = () => {}
            this.methods = {}
          },
          model: (name, schema) => {
            return {
              find: () => Promise.resolve([]),
              save: () => Promise.resolve({}),
              findById: () => Promise.resolve({}),
              findByIdAndUpdate: () => Promise.resolve({}),
              findByIdAndDelete: () => Promise.resolve({}),
            }
          },
        }
      }
      if (module === "bcrypt") {
        return {
          hash: (password, rounds) => Promise.resolve("hashed_password"),
          compare: (password, hash) => Promise.resolve(true),
        }
      }
      if (module === "jsonwebtoken") {
        return {
          sign: (payload, secret, options) => "jwt_token",
          verify: (token, secret, callback) => callback(null, { userId: 1 }),
        }
      }
      throw new Error(`Module ${module} is not supported in this environment.`)
    }

    const capturedOutput = []
    const safeConsole = {
      log: (...args) => capturedOutput.push(args.join(" ")),
      error: (...args) => capturedOutput.push("Error: " + args.join(" ")),
      warn: (...args) => capturedOutput.push("Warning: " + args.join(" ")),
    }

    // Mock global objects for Node.js examples
    const mockProcess = {
      version: "v18.17.0",
      platform: "linux",
      cwd: () => "/home/user/project",
      argv: ["node", "script.js", "--example"],
    }

    const mockGlobals = {
      __dirname: "/home/user/project",
      __filename: "/home/user/project/script.js",
      setTimeout: setTimeout,
      process: mockProcess,
      Buffer: {
        from: (str) => ({ toString: () => str }),
      },
    }

    // Create function with safe environment
    const runUserCode = new Function(
      "console",
      "require",
      "process",
      "__dirname",
      "__filename",
      "setTimeout",
      "Buffer",
      code,
    )

    // Execute code with mocked environment
    runUserCode(
      safeConsole,
      safeRequire,
      mockGlobals.process,
      mockGlobals.__dirname,
      mockGlobals.__filename,
      mockGlobals.setTimeout,
      mockGlobals.Buffer,
    )

    // Show captured output after a delay to simulate async operations
    setTimeout(() => {
      outputElement.textContent = capturedOutput.join("\n") || "Код виконано успішно (без виводу)"

      outputElement.classList.add("fade-in")
      setTimeout(() => {
        outputElement.classList.remove("fade-in")
      }, 1000)
    }, 200)

    showToast("Код успішно виконано!", "success")
  } catch (error) {
    outputElement.textContent = `Error: ${error.message}`
    showToast("Помилка виконання коду", "error")
  }
}

function setupEventListeners() {
  const lessonModal = document.getElementById("lesson-modal")
  const testModal = document.getElementById("test-modal")
  const resultModal = document.getElementById("result-modal")
  const closeBtns = document.querySelectorAll(".close")
  const startTestBtn = document.getElementById("start-test")
  const submitTestBtn = document.getElementById("submit-test")
  const retryTestBtn = document.getElementById("retry-test")
  const runCodeBtn = document.getElementById("run-code")
  const copyCodeBtn = document.querySelector(".copy-code-btn")
  const continueBtn = document.getElementById("continue-learning")
  const logoutBtn = document.getElementById("logout-btn")
  const prevBtn = document.getElementById("prev-question")
  const nextBtn = document.getElementById("next-question")
  const startJourneyBtn = document.getElementById("start-journey")

  if (startJourneyBtn) {
    startJourneyBtn.addEventListener("click", () => {
      document.getElementById("lessons")?.scrollIntoView({ behavior: "smooth" })
    })
  }

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      lessonModal.style.display = "none"
      testModal.style.display = "none"
      resultModal.style.display = "none"
      document.body.style.overflow = ""
    })
  })

  window.addEventListener("click", (e) => {
    if (e.target === lessonModal || e.target === testModal || e.target === resultModal) {
      lessonModal.style.display = "none"
      testModal.style.display = "none"
      resultModal.style.display = "none"
      document.body.style.overflow = ""
    }
  })

  if (startTestBtn) startTestBtn.addEventListener("click", startTest)
  if (submitTestBtn) submitTestBtn.addEventListener("click", submitTest)
  if (retryTestBtn) retryTestBtn.addEventListener("click", retryTest)
  if (runCodeBtn) runCodeBtn.addEventListener("click", executeCode)
  if (prevBtn) prevBtn.addEventListener("click", previousQuestion)
  if (nextBtn) nextBtn.addEventListener("click", nextQuestion)

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout)
  }

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener("click", () => {
      const codeText = document.getElementById("code-example").textContent
      navigator.clipboard.writeText(codeText).then(() => {
        showToast("Код скопійовано в буфер обміну!", "success")
      })
    })
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      resultModal.style.display = "none"
      document.body.style.overflow = ""
    })
  }
}

function startTest() {
  if (currentLesson && currentLesson.test) {
    // Створюємо глибоку копію тесту
    currentTest = JSON.parse(JSON.stringify(currentLesson.test))
    
    // Зберігаємо оригінальні індекси правильних відповідей ДО будь-яких змін
    originalCorrectAnswers = currentTest.questions.map(q => q.correctAnswer)
    
    // Ініціалізуємо стан тесту
    currentQuestionIndex = 0
    userAnswers = new Array(currentTest.questions.length).fill(-1)

    // Оновлюємо загальну кількість питань
    document.getElementById("total-questions").textContent = currentTest.questions.length

    // Показуємо перше питання
    showCurrentQuestion()
    
    // Переключаємо модальні вікна
    document.getElementById("lesson-modal").style.display = "none"
    document.getElementById("test-modal").style.display = "block"
  }
}

function showCurrentQuestion() {
  if (!currentTest || !currentTest.questions[currentQuestionIndex]) {
    console.error("No current test or question available")
    return
  }

  const question = currentTest.questions[currentQuestionIndex]
  const testContent = document.getElementById("test-content")
  
  // Оновлюємо номер поточного питання
  document.getElementById("current-question").textContent = currentQuestionIndex + 1
  
  // Оновлюємо прогрес-бар
  const progressFill = document.querySelector(".progress-fill")
  const progressPercentage = ((currentQuestionIndex + 1) / currentTest.questions.length) * 100
  progressFill.style.width = `${progressPercentage}%`

  // Відображаємо питання з варіантами відповідей
  testContent.innerHTML = `
    <div class="question-container">
      <div class="question-header">
        <span class="question-number">Питання ${currentQuestionIndex + 1} з ${currentTest.questions.length}</span>
      </div>
      <h3 class="question-text">${question.question}</h3>
      <div class="answers-container">
        ${question.options
          .map(
            (option, index) => `
          <label class="answer-option ${userAnswers[currentQuestionIndex] === index ? "selected" : ""}">
            <input 
              type="radio" 
              name="answer" 
              value="${index}" 
              ${userAnswers[currentQuestionIndex] === index ? "checked" : ""}
            >
            <span class="answer-indicator">
              <span class="answer-number">${String.fromCharCode(65 + index)}</span>
            </span>
            <span class="answer-text">${option}</span>
          </label>
        `,
          )
          .join("")}
      </div>
    </div>
  `

  // Додаємо обробники подій для вибору відповіді
  const answerOptions = testContent.querySelectorAll(".answer-option")
  answerOptions.forEach((option) => {
    option.addEventListener("click", function () {
      answerOptions.forEach((opt) => opt.classList.remove("selected"))
      this.classList.add("selected")
      const radio = this.querySelector('input[type="radio"]')
      radio.checked = true
      userAnswers[currentQuestionIndex] = parseInt(radio.value)
    })
  })

  // Оновлюємо стан кнопок навігації
  updateNavigationButtons()
}

function updateNavigationButtons() {
  const prevButton = document.getElementById("prev-question")
  const nextButton = document.getElementById("next-question")
  const submitButton = document.getElementById("submit-test")

  if (!prevButton || !nextButton || !submitButton) return

  // Кнопка "Попереднє" активна тільки якщо не перше питання
  prevButton.disabled = currentQuestionIndex === 0

  // На останньому питанні показуємо кнопку "Відправити"
  if (currentQuestionIndex === currentTest.questions.length - 1) {
    nextButton.style.display = "none"
    submitButton.style.display = "inline-flex"
  } else {
    nextButton.style.display = "inline-flex"
    submitButton.style.display = "none"
  }
}

function saveCurrentAnswer() {
  const selectedAnswer = document.querySelector('input[name="answer"]:checked')
  if (selectedAnswer) {
    userAnswers[currentQuestionIndex] = parseInt(selectedAnswer.value)
  }
}

function nextQuestion() {
  saveCurrentAnswer()
  if (currentQuestionIndex < currentTest.questions.length - 1) {
    currentQuestionIndex++
    showCurrentQuestion()
  }
}

function previousQuestion() {
  saveCurrentAnswer()
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--
    showCurrentQuestion()
  }
}

function submitTest() {
  saveCurrentAnswer()

  // Перевіряємо відповіді, використовуючи оригінальні індекси
  const results = currentTest.questions.map((question, index) => ({
    question: question.question,
    userAnswer: userAnswers[index] !== -1 ? question.options[userAnswers[index]] : "Не відповіли",
    correctAnswer: question.options[originalCorrectAnswers[index]],
    isCorrect: userAnswers[index] === originalCorrectAnswers[index],
  }))

  displayTestResults(results)
}

function displayTestResults(results) {
  const testResults = document.getElementById("test-results")
  const correctCount = results.filter((r) => r.isCorrect).length
  const totalQuestions = results.length
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100)

  // Оновлюємо відсоток у колі
  document.querySelector(".score-number").textContent = `${scorePercentage}%`

  // Змінюємо колір кола залежно від результату
  const scoreCircle = document.querySelector(".score-circle")
  if (scorePercentage >= 80) {
    scoreCircle.style.borderColor = "#68d391"
  } else if (scorePercentage >= 50) {
    scoreCircle.style.borderColor = "#f6ad55"
  } else {
    scoreCircle.style.borderColor = "#fc8181"
  }

  // Відображаємо детальні результати
  testResults.innerHTML = `
    <div class="results-summary">
      <h3>Ви відповіли правильно на ${correctCount} з ${totalQuestions} питань</h3>
    </div>
    <div class="results-list">
      ${results
        .map(
          (result, index) => `
          <div class="result-item ${result.isCorrect ? "correct" : "incorrect"}">
            <div class="result-icon">
              ${result.isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'}
            </div>
            <div class="result-content">
              <p class="result-question"><strong>Питання ${index + 1}:</strong> ${result.question}</p>
              <p class="result-answer">
                <strong>Ваша відповідь:</strong> ${result.userAnswer}
              </p>
              ${!result.isCorrect ? `<p class="result-correct"><strong>Правильна відповідь:</strong> ${result.correctAnswer}</p>` : ""}
            </div>
          </div>
        `,
        )
        .join("")}
    </div>
  `

  // Якщо результат >= 80%, показуємо посилання на сертифікат
  if (scorePercentage >= 80) {
    const certificateLink = document.createElement('div')
    certificateLink.className = 'certificate-link-container'
    certificateLink.innerHTML = `
      <div class="certificate-success">
        <i class="fas fa-trophy"></i>
        <h4>Вітаємо! Ви успішно пройшли тест!</h4>
        <p>Ви набрали ${scorePercentage}% і можете отримати сертифікат</p>
        <a href="certificates.html" class="cta-button primary">
          <span class="cta-text">Отримати сертифікат</span>
          <span class="cta-icon"><i class="fas fa-certificate"></i></span>
        </a>
      </div>
    `
    testResults.appendChild(certificateLink)
  }

  // Закриваємо модальне вікно тесту і відкриваємо модальне вікно результатів
  document.getElementById("test-modal").style.display = "none"
  document.getElementById("result-modal").style.display = "block"

  // Зберігаємо прогрес (бали з 50)
  const scoreOutOf50 = Math.round((correctCount / totalQuestions) * 50)
  saveTestProgress(scoreOutOf50)

  // Показуємо відповідне повідомлення
  if (correctCount === totalQuestions) {
    showToast("Вітаємо! Ви успішно засвоїли тему!", "success")
  } else if (scorePercentage >= 80) {
    showToast("Чудовий результат!", "success")
  } else if (scorePercentage >= 50) {
    showToast("Непогано, але є над чим працювати!", "warning")
  } else {
    showToast("Рекомендуємо повторити матеріал", "error")
  }
}

function retryTest() {
  document.getElementById("result-modal").style.display = "none"
  startTest()
}

// Contact Form
function setupContactForm() {
  const form = document.getElementById("contact-form")
  if (!form) return

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const submitBtn = form.querySelector(".submit-button")
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Надсилання...'
    submitBtn.disabled = true

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      showToast("Повідомлення надіслано успішно!", "success")
      form.reset()
    } catch (error) {
      showToast("Помилка при відправці повідомлення", "error")
    } finally {
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })
}

// Stats Counter
function setupStatsCounter() {
  const stats = document.querySelectorAll(".stat-number")

  if (stats.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target
          const countTo = Number.parseInt(target.getAttribute("data-count"))

          let count = 0
          const interval = setInterval(() => {
            count += Math.ceil(countTo / 50)
            if (count >= countTo) {
              target.textContent = countTo
              clearInterval(interval)
            } else {
              target.textContent = count
            }
          }, 30)

          observer.unobserve(target)
        }
      })
    },
    { threshold: 0.5 },
  )

  stats.forEach((stat) => {
    observer.observe(stat)
  })
}

// Toast function
function showToast(message, type = "success") {
  const toast = document.getElementById("toast")
  if (!toast) return

  toast.textContent = message

  // Set color based on type
  if (type === "success") {
    toast.style.backgroundColor = "#68d391"
  } else if (type === "error") {
    toast.style.backgroundColor = "#fc8181"
  } else if (type === "warning") {
    toast.style.backgroundColor = "#f6ad55"
    toast.style.color = "#1a202c"
  } else if (type === "info") {
    toast.style.backgroundColor = "#4299e1"
  }

  toast.style.display = "block"
  toast.classList.add("fade-in")

  setTimeout(() => {
    toast.style.display = "none"
    toast.classList.remove("fade-in")
  }, 3000)
}

function setupLessonFilter() {
  const filterButtons = document.querySelectorAll(".filter-button")

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter

      filterButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      const lessonCards = document.querySelectorAll(".lesson-card")

      lessonCards.forEach((card) => {
        if (filter === "all" || card.dataset.category === filter) {
          card.style.display = "block"
        } else {
          card.style.display = "none"
        }
      })
    })
  })
}

function checkAuthStatus() {
  const token = localStorage.getItem("token")
  const authButton = document.querySelector(".auth-button")
  const profileButton = document.querySelector(".profile-button")
  const logoutButton = document.querySelector(".logout-button")

  if (token) {
    if (authButton) authButton.style.display = "none"
    if (profileButton) profileButton.style.display = "inline-block"
    if (logoutButton) logoutButton.style.display = "inline-block"
    verifyToken(token)
  } else {
    if (authButton) authButton.style.display = "inline-block"
    if (profileButton) profileButton.style.display = "none"
    if (logoutButton) logoutButton.style.display = "none"
  }
}

async function verifyToken(token) {
  try {
    const response = await fetch("/api/auth/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      localStorage.removeItem("token")
      localStorage.removeItem("userData")
      checkAuthStatus()
      return
    }

    const data = await response.json()
    localStorage.setItem("userData", JSON.stringify(data.user))

    const profileButton = document.querySelector(".profile-button")
    if (profileButton && data.user.name) {
      profileButton.innerHTML = `<i class="fas fa-user"></i> ${data.user.name}`
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    localStorage.removeItem("token")
    localStorage.removeItem("userData")
    checkAuthStatus()
  }
}

function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("userData")
  checkAuthStatus()
  showToast("Ви успішно вийшли з системи", "info")
  setTimeout(() => {
    window.location.href = "index.html"
  }, 1000)
}

async function saveTestProgress(score) {
  const token = localStorage.getItem("token")
  if (!token || !currentLesson) {
    return
  }

  try {
    const response = await fetch(`/api/lessons/${currentLesson.id}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ score: score }),
    })

    if (response.ok) {
      showToast("Прогрес збережено!", "success")
      // Перезавантажуємо прогрес після збереження
      await loadUserProgress()
    } else {
      showToast("Помилка збереження прогресу", "error")
    }
  } catch (error) {
    console.error("Error saving progress:", error)
    showToast("Помилка збереження прогресу", "error")
  }
}

async function loadUserProgress() {
  const token = localStorage.getItem("token")
  if (!token) {
    return
  }

  try {
    // Додаємо timestamp для запобігання кешуванню
    const timestamp = new Date().getTime()
    const response = await fetch(`/api/user/progress?t=${timestamp}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
    })

    if (response.ok) {
      const progressData = await response.json()

      // Зберігаємо в localStorage
      localStorage.setItem("userProgress", JSON.stringify(progressData.lessons))
      localStorage.setItem(
        "userStats",
        JSON.stringify({
          completedLessons: progressData.completedLessons,
          totalScore: progressData.totalScore,
          achievements: progressData.achievements,
        }),
      )

      // Оновлюємо картки уроків
      updateLessonCards(progressData.lessons)
    }
  } catch (error) {
    console.error("Error loading progress:", error)
  }
}

function updateLessonCards(progressData) {
  const lessonCards = document.querySelectorAll(".lesson-card")

  lessonCards.forEach((card) => {
    const lessonButton = card.querySelector(".lesson-button")
    const lessonId = lessonButton?.dataset.id

    if (lessonId && progressData[lessonId] && progressData[lessonId].completed) {
      card.classList.add("completed")

      const score = progressData[lessonId].score
      const percentage = Math.round((score / 50) * 100)
      
      lessonButton.innerHTML = `
        <span class="cta-text">Завершено (${percentage}%)</span>
        <span class="cta-icon"><i class="fas fa-check-circle"></i></span>
      `
      lessonButton.classList.add("completed")
    }
  })
}

console.log("Node.js Course script loaded successfully!")
