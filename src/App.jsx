import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ModeSelectorPage from './pages/ModeSelectorPage'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import CartPage from './pages/CartPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModeSelectorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/service" element={<Navigate to="/order" replace />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
