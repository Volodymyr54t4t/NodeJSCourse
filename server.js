const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const {
    Pool
} = require("pg")
const path = require("path") // Added path module for proper file path handling
require("dotenv").config()

const app = express()
const PORT = process.env.SERVER_PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname))) // Use path.join for static files
app.use("/css", express.static(path.join(__dirname, "public"))) // Use path.join for CSS files
app.use("/js", express.static(path.join(__dirname, "js"))) // Use path.join for JS files

// Database connection
const pool = new Pool({
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    ssl: {
        rejectUnauthorized: false,
    },
})

// Initialize database tables
async function initDatabase() {
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // User progress table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lesson_id INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                score INTEGER DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, lesson_id)
            )
        `)

        // User achievements table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                achievement_id VARCHAR(100) NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            )
        `)

        console.log("Database tables initialized successfully")
    } catch (error) {
        console.error("Database initialization error:", error)
    }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Access token required"
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token"
            })
        }
        req.user = user
        next()
    })
}

// Root route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html")) // Use path.join instead of string concatenation
})

// Routes for auth and profile pages
app.get("/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "auth.html")) // Use path.join instead of string concatenation
})

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "profile.html")) // Use path.join instead of string concatenation
})

// Auth routes
app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body

        // Check if user exists
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Користувач з таким email вже існує"
            })
        }

        // Hash password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        // Create user
        const result = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
            [name, email, hashedPassword],
        )

        const user = result.rows[0]
        res.status(201).json({
            message: "Користувач створений успішно",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        })
    } catch (error) {
        console.error("Registration error:", error)
        res.status(500).json({
            message: "Помилка сервера при реєстрації"
        })
    }
})

app.post("/api/auth/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body

        // Find user
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Неправильний email або пароль"
            })
        }

        const user = result.rows[0]

        // Check password
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(400).json({
                message: "Неправильний email або пароль"
            })
        }

        // Generate JWT token
        const token = jwt.sign({
            userId: user.id,
            email: user.email
        }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })

        res.json({
            message: "Успішний вхід",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        })
    } catch (error) {
        console.error("Login error:", error)
        res.status(500).json({
            message: "Помилка сервера при вході"
        })
    }
})

app.get("/api/auth/verify", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [req.user.userId])

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Користувач не знайдений"
            })
        }

        res.json({
            user: result.rows[0]
        })
    } catch (error) {
        console.error("Token verification error:", error)
        res.status(500).json({
            message: "Помилка верифікації токена"
        })
    }
})

// User routes
app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
        console.log("[v0] Profile request for user ID:", req.user.userId)

        const result = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.user.userId])

        if (result.rows.length === 0) {
            console.log("[v0] User not found in database:", req.user.userId)
            return res.status(404).json({
                message: "Користувач не знайдений"
            })
        }

        console.log("[v0] User profile loaded successfully:", result.rows[0])
        res.json(result.rows[0])
    } catch (error) {
        console.error("Profile fetch error:", error)
        res.status(500).json({
            message: "Помилка завантаження профілю"
        })
    }
})

app.put("/api/user/profile", authenticateToken, async (req, res) => {
    try {
        const {
            name,
            email
        } = req.body

        // Check if email is already taken by another user
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1 AND id != $2", [email, req.user.userId])

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email вже використовується іншим користувачем"
            })
        }

        const result = await pool.query(
            "UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, email",
            [name, email, req.user.userId],
        )

        res.json({
            message: "Профіль оновлено успішно",
            user: result.rows[0],
        })
    } catch (error) {
        console.error("Profile update error:", error)
        res.status(500).json({
            message: "Помилка оновлення профілю"
        })
    }
})

app.put("/api/user/change-password", authenticateToken, async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body

        // Get current user
        const userResult = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.userId])
        const user = userResult.rows[0]

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password)
        if (!validPassword) {
            return res.status(400).json({
                message: "Поточний пароль неправильний"
            })
        }

        // Hash new password
        const saltRounds = 10
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

        // Update password
        await pool.query("UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
            hashedNewPassword,
            req.user.userId,
        ])

        res.json({
            message: "Пароль змінено успішно"
        })
    } catch (error) {
        console.error("Password change error:", error)
        res.status(500).json({
            message: "Помилка зміни пароля"
        })
    }
})

app.get("/api/user/progress", authenticateToken, async (req, res) => {
    try {
        console.log("[v0] Loading progress for user:", req.user.userId)

        // Get user progress
        const progressResult = await pool.query(
            "SELECT lesson_id, completed, score, completed_at FROM user_progress WHERE user_id = $1",
            [req.user.userId],
        )

        console.log("[v0] Progress query result:", progressResult.rows)

        // Get user achievements
        const achievementsResult = await pool.query(
            "SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = $1",
            [req.user.userId],
        )

        console.log("[v0] Achievements query result:", achievementsResult.rows)

        // Process progress data
        const lessons = {}
        let completedLessons = 0
        let totalScore = 0

        progressResult.rows.forEach((row) => {
            lessons[row.lesson_id] = {
                completed: row.completed,
                score: row.score,
                completedAt: row.completed_at,
            }
            if (row.completed) {
                completedLessons++
                totalScore += row.score
            }
        })

        // Process achievements
        const achievements = {}
        achievementsResult.rows.forEach((row) => {
            achievements[row.achievement_id] = row.earned_at
        })

        const progressData = {
            lessons,
            completedLessons,
            totalScore,
            achievements,
            quickLearner: achievements.quick_learner ? true : false,
        }

        console.log("[v0] Sending progress data:", progressData)
        res.json(progressData)
    } catch (error) {
        console.error("[v0] Progress fetch error:", error)
        res.status(500).json({
            message: "Помилка завантаження прогресу"
        })
    }
})

// Lesson progress routes
app.post("/api/lessons/:lessonId/complete", authenticateToken, async (req, res) => {
    try {
        const {
            lessonId
        } = req.params
        const {
            score
        } = req.body

        // Update or insert lesson progress
        await pool.query(
            `
            INSERT INTO user_progress (user_id, lesson_id, completed, score, completed_at)
            VALUES ($1, $2, true, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET completed = true, score = $3, completed_at = CURRENT_TIMESTAMP
        `,
            [req.user.userId, lessonId, score],
        )

        // Check for achievements
        await checkAchievements(req.user.userId)

        res.json({
            message: "Урок завершено успішно"
        })
    } catch (error) {
        console.error("Lesson completion error:", error)
        res.status(500).json({
            message: "Помилка завершення уроку"
        })
    }
})

// Achievement checking function
async function checkAchievements(userId) {
    try {
        // Get user progress
        const progressResult = await pool.query(
            "SELECT COUNT(*) as completed_count, SUM(score) as total_score FROM user_progress WHERE user_id = $1 AND completed = true",
            [userId],
        )

        const {
            completed_count,
            total_score
        } = progressResult.rows[0]

        // Define achievements to check
        const achievementsToCheck = [{
                id: "first_lesson",
                condition: completed_count >= 1
            },
            {
                id: "half_course",
                condition: completed_count >= 5
            },
            {
                id: "course_complete",
                condition: completed_count >= 10
            },
            {
                id: "high_score",
                condition: total_score >= 400
            },
            {
                id: "perfect_score",
                condition: total_score >= 500
            },
        ]

        // Award achievements
        for (const achievement of achievementsToCheck) {
            if (achievement.condition) {
                await pool.query(
                    `
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES ($1, $2)
                    ON CONFLICT (user_id, achievement_id) DO NOTHING
                `,
                    [userId, achievement.id],
                )
            }
        }
    } catch (error) {
        console.error("Achievement check error:", error)
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`)
    await initDatabase()
})

// Handle graceful shutdown
process.on("SIGINT", async () => {
    console.log("Shutting down server...")
    await pool.end()
    process.exit(0)
})