import { useState } from 'react'
import ProductList from './components/Inventory/ProductList'
import LoginPage from './components/LoginPage'

function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('inv_user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (userData) => {
    setUser(userData)
    sessionStorage.setItem('inv_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem('inv_user')
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <ProductList user={user} onLogout={handleLogout} />
}

export default App
