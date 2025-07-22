import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './css/App.css'
import { Routes , Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Friends from './pages/Friends.jsx'

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/friends" element={<Friends/>} />
      </Routes>
    </main>
  );
}

export default App
