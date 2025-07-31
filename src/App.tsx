"use client"

import { useEffect, useState } from "react"
import { LoginForm } from "./components/LoginForm"
import { KanbanBoard } from "./components/KanbanBoard"

interface User {
  idUsuario: number
  Nombre: string
  Apellido1: string
  Apellido2: string
  Correo: string
  Access_token: string
  Tipo_Usuario: number
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <KanbanBoard user={user} onLogout={handleLogout} />
}

export default App
