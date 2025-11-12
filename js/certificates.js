 // 🔧 Визначаємо, де зараз запущений сайт — локально чи онлайн
 const BASE_URL =
     window.location.hostname === "localhost" ?
     "http://localhost:3000" // 🖥 Локальний сервер
     :
     "https://nodejscourse-lx2g.onrender.com/"; // ☁️ Онлайн-сервер Render

 // 🔁 Використання в будь-якому запиті
 async function loadCompetitions() {
     try {
         const response = await fetch(`${BASE_URL}/api/competitions`);
         const data = await response.json();
         console.log("✅ Дані отримані:", data);
     } catch (error) {
         console.error("❌ Помилка під час запиту:", error);
     }
 }

 loadCompetitions();

 class CertificateGenerator {
     constructor() {
         this.canvas = document.getElementById("certificateCanvas")
         this.ctx = this.canvas.getContext("2d")
         this.form = document.getElementById("certificateForm")
         this.generateBtn = document.getElementById("generateBtn")
         this.downloadBtn = document.getElementById("downloadBtn")
         this.canvasContainer = document.getElementById("canvasContainer")
         this.notification = document.getElementById("notification")

         this.init()
     }

     init() {
         this.form.addEventListener("submit", (e) => this.handleSubmit(e))
         this.downloadBtn.addEventListener("click", () => this.downloadCertificate())
     }

     async handleSubmit(e) {
         e.preventDefault()

         const fullName = document.getElementById("fullName").value.trim()
         const module = document.getElementById("module").value

         if (!fullName || !module) {
             this.showNotification("Будь ласка, заповніть всі поля", "error")
             return
         }

         this.showLoading(true)

         try {
             await this.generateCertificate(fullName, module)
             this.showNotification("Сертифікат успішно згенеровано!", "success")
             this.canvasContainer.style.display = "block"
             this.canvasContainer.scrollIntoView({
                 behavior: "smooth"
             })
         } catch (error) {
             console.error("Помилка генерації сертифіката:", error)
             this.showNotification("Помилка при генерації сертифіката", "error")
         } finally {
             this.showLoading(false)
         }
     }

     async generateCertificate(fullName, module) {
         return new Promise((resolve, reject) => {
             const img = new Image()
             img.crossOrigin = "anonymous"

             img.onload = () => {
                 try {
                     // Встановлюємо розмір canvas відповідно до зображення
                     this.canvas.width = img.width
                     this.canvas.height = img.height

                     // Очищуємо canvas
                     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

                     // Малюємо фонове зображення
                     this.ctx.drawImage(img, 0, 0)

                     // Налаштування для тексту модуля
                     this.ctx.font = "bold 48px Arial, sans-serif"
                     this.ctx.fillStyle = "#1e3a8a" // Синій колір
                     this.ctx.textAlign = "center"
                     this.ctx.textBaseline = "middle"

                     // Додаємо тінь для тексту
                     this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
                     this.ctx.shadowBlur = 4
                     this.ctx.shadowOffsetX = 2
                     this.ctx.shadowOffsetY = 2

                     // Розміщуємо назву модуля у координатах 975, 552
                     this.ctx.fillText(module, 975, 552)

                     // Налаштування для тексту ПІБ
                     this.ctx.font = "bold 52px Arial, sans-serif"
                     this.ctx.fillStyle = "#1e3a8a" // Синій колір

                     // Розміщуємо ПІБ у координатах 961, 835
                     this.ctx.fillText(fullName, 961, 835)

                     // Очищуємо тінь
                     this.ctx.shadowColor = "transparent"
                     this.ctx.shadowBlur = 0
                     this.ctx.shadowOffsetX = 0
                     this.ctx.shadowOffsetY = 0

                     // Анімація появи canvas
                     setTimeout(() => {
                         this.canvas.classList.add("show")
                     }, 100)

                     resolve()
                 } catch (error) {
                     reject(error)
                 }
             }

             img.onerror = () => {
                 reject(new Error("Не вдалося завантажити шаблон сертифіката"))
             }

             // Завантажуємо зображення з папки public/image/
             img.src = "public/image/certificate.png"
         })
     }

     downloadCertificate() {
         try {
             const fullName = document.getElementById("fullName").value.trim()
             const module = document.getElementById("module").value

             // Створюємо назву файлу
             const fileName = `Certificate_${fullName.replace(/\s+/g, "_")}_${module.replace(/\s+/g, "_")}.png`

             // Створюємо посилання для завантаження
             const link = document.createElement("a")
             link.download = fileName
             link.href = this.canvas.toDataURL("image/png", 1.0)

             // Симулюємо клік для завантаження
             document.body.appendChild(link)
             link.click()
             document.body.removeChild(link)

             this.showNotification("Сертифікат завантажено!", "success")

             // Відправляємо на сервер для збереження в папку uploads
             this.saveCertificateToServer(link.href, fileName)
         } catch (error) {
             console.error("Помилка завантаження:", error)
             this.showNotification("Помилка при завантаженні сертифіката", "error")
         }
     }

     async saveCertificateToServer(dataUrl, fileName) {
         try {
             const response = await fetch("/api/save-certificate", {
                 method: "POST",
                 headers: {
                     "Content-Type": "application/json",
                 },
                 body: JSON.stringify({
                     imageData: dataUrl,
                     fileName: fileName,
                 }),
             })

             if (response.ok) {
                 console.log("Сертифікат збережено на сервері")
             }
         } catch (error) {
             console.error("Помилка збереження на сервері:", error)
         }
     }

     showLoading(show) {
         if (show) {
             this.generateBtn.classList.add("loading")
             this.generateBtn.disabled = true
         } else {
             this.generateBtn.classList.remove("loading")
             this.generateBtn.disabled = false
         }
     }

     showNotification(message, type) {
         this.notification.textContent = message
         this.notification.className = `notification ${type}`
         this.notification.classList.add("show")

         setTimeout(() => {
             this.notification.classList.remove("show")
         }, 4000)
     }
 }

 // Ініціалізуємо генератор після завантаження сторінки
 document.addEventListener("DOMContentLoaded", () => {
     new CertificateGenerator()
 })