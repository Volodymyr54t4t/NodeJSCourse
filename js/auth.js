// 🔧 Визначаємо, де зараз запущений сайт — локально чи онлайн
let BASE_URL
if (window.location.hostname === "localhost") {
  // 🖥️ Локальний режим
  BASE_URL = "http://localhost:3000"
} else {
  // ☁️ Онлайн-сервер Render
  BASE_URL = "https://nodejscourse-lx2g.onrender.com/"
}
console.log("📡 Підключення до:", BASE_URL)
 class AuthManager {
     constructor() {
         this.apiUrl = "http://localhost:3000/api"
         this.init()
     }

     init() {
         this.bindEvents()
         this.checkAuthStatus()
     }

     bindEvents() {
         // Form switching
         document.getElementById("showRegister").addEventListener("click", (e) => {
             e.preventDefault()
             this.showRegisterForm()
         })

         document.getElementById("showLogin").addEventListener("click", (e) => {
             e.preventDefault()
             this.showLoginForm()
         })

         // Form submissions
         document.getElementById("loginFormElement").addEventListener("submit", (e) => {
             e.preventDefault()
             this.handleLogin(e)
         })

         document.getElementById("registerFormElement").addEventListener("submit", (e) => {
             e.preventDefault()
             this.handleRegister(e)
         })
     }

     showRegisterForm() {
         document.getElementById("loginForm").classList.add("hidden")
         document.getElementById("registerForm").classList.remove("hidden")
     }

     showLoginForm() {
         document.getElementById("registerForm").classList.add("hidden")
         document.getElementById("loginForm").classList.remove("hidden")
     }

     async handleLogin(event) {
         const formData = new FormData(event.target)
         const loginData = {
             email: formData.get("email"),
             password: formData.get("password"),
         }

         try {
             const response = await fetch(`${this.apiUrl}/auth/login`, {
                 method: "POST",
                 headers: {
                     "Content-Type": "application/json",
                 },
                 body: JSON.stringify(loginData),
             })

             const result = await response.json()

             if (response.ok) {
                 localStorage.setItem("token", result.token)
                 localStorage.setItem("user", JSON.stringify(result.user))
                 this.showNotification("Успішний вхід!", "success")

                 setTimeout(() => {
                     window.location.href = "profile.html"
                 }, 1500)
             } else {
                 this.showNotification(result.message || "Помилка входу", "error")
             }
         } catch (error) {
             console.error("Login error:", error)
             this.showNotification("Помилка з'єднання з сервером", "error")
         }
     }

     async handleRegister(event) {
         const formData = new FormData(event.target)
         const password = formData.get("password")
         const confirmPassword = formData.get("confirmPassword")

         if (password !== confirmPassword) {
             this.showNotification("Паролі не співпадають", "error")
             return
         }

         const registerData = {
             name: formData.get("name"),
             email: formData.get("email"),
             password: password,
         }

         try {
             const response = await fetch(`${this.apiUrl}/auth/register`, {
                 method: "POST",
                 headers: {
                     "Content-Type": "application/json",
                 },
                 body: JSON.stringify(registerData),
             })

             const result = await response.json()

             if (response.ok) {
                 this.showNotification("Реєстрація успішна! Тепер увійдіть в акаунт", "success")
                 this.showLoginForm()

                 // Pre-fill login form
                 document.getElementById("loginEmail").value = registerData.email
             } else {
                 this.showNotification(result.message || "Помилка реєстрації", "error")
             }
         } catch (error) {
             console.error("Register error:", error)
             this.showNotification("Помилка з'єднання з сервером", "error")
         }
     }

     checkAuthStatus() {
         const token = localStorage.getItem("token")
         if (token) {
             // Verify token with server
             this.verifyToken(token)
         }
     }

     async verifyToken(token) {
         try {
             const response = await fetch(`${this.apiUrl}/auth/verify`, {
                 method: "GET",
                 headers: {
                     Authorization: `Bearer ${token}`,
                 },
             })

             if (response.ok) {
                 // Token is valid, redirect to profile
                 window.location.href = "profile.html"
             } else {
                 // Token is invalid, remove it
                 localStorage.removeItem("token")
                 localStorage.removeItem("user")
             }
         } catch (error) {
             console.error("Token verification error:", error)
             localStorage.removeItem("token")
             localStorage.removeItem("user")
         }
     }

     showNotification(message, type = "success") {
         const notification = document.getElementById("notification")
         notification.textContent = message
         notification.className = `notification ${type}`
         notification.classList.add("show")

         setTimeout(() => {
             notification.classList.remove("show")
         }, 4000)
     }
 }

 // Initialize auth manager when DOM is loaded
 document.addEventListener("DOMContentLoaded", () => {
     new AuthManager()
 })