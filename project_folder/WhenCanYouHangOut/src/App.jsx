import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Friends from './pages/Friends';
import NavBar from './components/NavBar/NavBar';

function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/friends" element={<Friends />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
