class ProfileManager {
  constructor() {
    this.apiUrl = "http://localhost:3000/api"
    this.user = null
    this.init()
  }

  init() {
    this.checkAuth()
    this.bindEvents()
    this.loadUserData()
    this.loadProgress()
  }

  async loadProgress() {
    try {
      const token = localStorage.getItem("token")
      const timestamp = new Date().getTime()
      const response = await fetch(`${this.apiUrl}/user/progress?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const progress = await response.json()
        console.log("[v0] Progress loaded:", progress)
        this.displayProgress(progress)
        this.displayAchievements(progress)
        this.displayLessonsProgress(progress)
      } else {
        console.warn("Could not load progress data:", response.status)
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    }
  }

  displayProgress(progress) {
    const completedLessons = progress.completedLessons || 0
    const totalLessons = 10
    const totalScore = progress.totalScore || 0
    const progressPercent = Math.round((completedLessons / totalLessons) * 100)

    console.log("[v0] Displaying progress:", { completedLessons, totalScore, progressPercent })

    const completedLessonsEl = document.getElementById("completedLessons")
    const totalScoreEl = document.getElementById("totalScore")
    const progressPercentEl = document.getElementById("progressPercent")
    const progressFillEl = document.getElementById("progressFill")

    if (completedLessonsEl) completedLessonsEl.textContent = completedLessons
    if (totalScoreEl) totalScoreEl.textContent = totalScore
    if (progressPercentEl) progressPercentEl.textContent = progressPercent
    if (progressFillEl) progressFillEl.style.width = `${progressPercent}%`
  }

  displayAchievements(progress) {
    const achievements = [
      {
        id: "first_lesson",
        title: "Перші кроки",
        description: "Завершіть перший урок",
        icon: "🎯",
        earned: progress.completedLessons >= 1,
      },
      {
        id: "half_course",
        title: "На половині шляху",
        description: "Завершіть 5 уроків",
        icon: "🏃‍♂️",
        earned: progress.completedLessons >= 5,
      },
      {
        id: "course_complete",
        title: "Майстер Node.js",
        description: "Завершіть всі уроки",
        icon: "🏆",
        earned: progress.completedLessons >= 10,
      },
      {
        id: "high_score",
        title: "Відмінник",
        description: "Наберіть 400+ балів",
        icon: "⭐",
        earned: progress.totalScore >= 400,
      },
      {
        id: "perfect_score",
        title: "Ідеальний результат",
        description: "Наберіть максимальний бал",
        icon: "💎",
        earned: progress.totalScore >= 500,
      },
      {
        id: "quick_learner",
        title: "Швидке навчання",
        description: "Завершіть 3 уроки за день",
        icon: "⚡",
        earned: progress.quickLearner || false,
      },
    ]

    const achievementsGrid = document.getElementById("achievementsGrid")
    if (achievementsGrid) {
      achievementsGrid.innerHTML = achievements
        .map(
          (achievement) => `
              <div class="achievement-item ${achievement.earned ? "earned" : ""}">
                  <div class="achievement-icon">${achievement.icon}</div>
                  <h4>${achievement.title}</h4>
                  <p>${achievement.description}</p>
              </div>
          `,
        )
        .join("")
    }
  }

  displayLessonsProgress(progress) {
    const lessons = [
      "Основи Node.js",
      "Модулі та NPM",
      "HTTP сервери",
      "Асинхронність",
      "Файлова система",
      "Express.js Framework",
      "Робота з MongoDB",
      "Аутентифікація та безпека",
      "Тестування в Node.js",
      "Деплой та продакшн",
    ]

    const lessonsProgress = document.getElementById("lessonsProgress")
    if (!lessonsProgress) return

    const userProgress = progress.lessons || {}
    console.log("[v0] User lessons progress:", userProgress)

    lessonsProgress.innerHTML = lessons
      .map((lesson, index) => {
        const lessonId = index + 1
        const isCompleted = userProgress[lessonId]?.completed || false
        const score = userProgress[lessonId]?.score || 0
        const percentage = Math.round((score / 50) * 100)

        console.log(`[v0] Lesson ${lessonId}: completed=${isCompleted}, score=${score}, percentage=${percentage}%`)

        return `
                <div class="lesson-item ${isCompleted ? "completed" : ""}">
                    <div class="lesson-status">
                        ${isCompleted ? "✓" : lessonId}
                    </div>
                    <div class="lesson-info">
                        <h4>Урок ${lessonId}: ${lesson}</h4>
                        <p>${isCompleted ? "Завершено" : "Не розпочато"}</p>
                    </div>
                    <div class="lesson-actions">
                        ${isCompleted ? `<span class="lesson-score">${score}/50 балів (${percentage}%)</span>` : ""}
                        ${percentage >= 80 ? `<a href="certificates.html" class="btn-certificate"><i class="fas fa-certificate"></i> Сертифікат</a>` : ""}
                    </div>
                </div>
            `
      })
      .join("")
  }

  switchTab(tabName) {
    if (!tabName) return

    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })

    const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`)
    if (activeTabBtn) {
      activeTabBtn.classList.add("active")
    }

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })

    const activeTabContent = document.getElementById(tabName)
    if (activeTabContent) {
      activeTabContent.classList.add("active")
    }

    if (tabName === "progress") {
      console.log("[v0] Switched to progress tab, reloading data...")
      this.loadProgress()
    }
  }

  async updateProfile(event) {
    const formData = new FormData(event.target)
    const profileData = {
      name: formData.get("name"),
      email: formData.get("email"),
    }

    if (!profileData.name || !profileData.email) {
      this.showNotification("Будь ласка, заповніть всі поля", "error")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${this.apiUrl}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      const result = await response.json()

      if (response.ok) {
        this.user = { ...this.user, ...profileData }
        this.displayUserData()
        this.showNotification("Профіль оновлено успішно", "success")
      } else {
        this.showNotification(result.message || "Помилка оновлення профілю", "error")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      this.showNotification("Помилка з'єднання з сервером", "error")
    }
  }

  async changePassword(event) {
    const formData = new FormData(event.target)
    const currentPassword = formData.get("currentPassword")
    const newPassword = formData.get("newPassword")
    const confirmNewPassword = formData.get("confirmNewPassword")

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.showNotification("Будь ласка, заповніть всі поля", "error")
      return
    }

    if (newPassword.length < 6) {
      this.showNotification("Новий пароль повинен містити мінімум 6 символів", "error")
      return
    }

    if (newPassword !== confirmNewPassword) {
      this.showNotification("Нові паролі не співпадають", "error")
      return
    }

    const passwordData = {
      currentPassword: currentPassword,
      newPassword: newPassword,
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${this.apiUrl}/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      })

      const result = await response.json()

      if (response.ok) {
        event.target.reset()
        this.showNotification("Пароль змінено успішно", "success")
      } else {
        this.showNotification(result.message || "Помилка зміни пароля", "error")
      }
    } catch (error) {
      console.error("Password change error:", error)
      this.showNotification("Помилка з'єднання з сервером", "error")
    }
  }

  logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "auth.html"
  }

  showNotification(message, type = "success") {
    const notification = document.getElementById("notification")
    if (!notification) {
      console.warn("Notification element not found")
      return
    }

    notification.textContent = message
    notification.className = `notification ${type}`
    notification.classList.add("show")

    setTimeout(() => {
      notification.classList.remove("show")
    }, 4000)
  }
  
  checkAuth() {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "auth.html"
      return
    }
  }

  bindEvents() {
    const backToCourseBtn = document.getElementById("backToCourse")
    if (backToCourseBtn) {
      backToCourseBtn.addEventListener("click", () => {
        window.location.href = "index.html"
      })
    }

    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.logout()
      })
    }

    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Forms
    const profileForm = document.getElementById("profileForm")
    if (profileForm) {
      profileForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.updateProfile(e)
      })
    }

    const passwordForm = document.getElementById("passwordForm")
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.changePassword(e)
      })
    }
  }

  async loadUserData() {
    try {
      console.log("[v0] Loading user data...")
      const token = localStorage.getItem("token")
      console.log("[v0] Token exists:", !!token)

      const response = await fetch(`${this.apiUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] API response status:", response.status)

      if (response.ok) {
        this.user = await response.json()
        console.log("[v0] User data loaded:", this.user)
        this.displayUserData()
      } else {
        console.log("[v0] API error response:", response.status)
        if (response.status === 401) {
          console.log("[v0] Unauthorized - redirecting to auth")
          this.logout()
        } else {
          this.showNotification("Помилка завантаження профілю", "error")
        }
      }
    } catch (error) {
      console.error("[v0] Error loading user data:", error)
      this.showNotification("Помилка з'єднання з сервером", "error")
    }
  }

  displayUserData() {
    console.log("[v0] Displaying user data:", this.user)
    if (!this.user) {
      console.log("[v0] No user data to display")
      return
    }

    const userNameEl = document.getElementById("userName")
    const userEmailEl = document.getElementById("userEmail")
    const userInitialsEl = document.getElementById("userInitials")
    const profileNameEl = document.getElementById("profileName")
    const profileEmailEl = document.getElementById("profileEmail")

    console.log("[v0] DOM elements found:", {
      userNameEl: !!userNameEl,
      userEmailEl: !!userEmailEl,
      userInitialsEl: !!userInitialsEl,
    })

    if (userNameEl) userNameEl.textContent = this.user.name || "Невідомий користувач"
    if (userEmailEl) userEmailEl.textContent = this.user.email || ""

    // Update initials with safety check
    if (userInitialsEl && this.user.name) {
      const initials = this.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
      userInitialsEl.textContent = initials
      console.log("[v0] Updated initials:", initials)
    }

    // Fill profile form
    if (profileNameEl) profileNameEl.value = this.user.name || ""
    if (profileEmailEl) profileEmailEl.value = this.user.email || ""
  }
}

// Initialize profile manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager()
})
