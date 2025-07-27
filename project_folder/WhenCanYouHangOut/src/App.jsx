import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Friends from './pages/Friends';
import WeeklyView from './pages/WeeklyView';
import NavBar from './components/NavBar/NavBar';
import Auth from './components/Auth/Auth';
import ScheduleComparison from './components/ScheduleComparison/ScheduleComparison';
import { testSchedules } from './utils/testData';
import './css/global.css';

function App() {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState(
    import.meta.env.DEV ? testSchedules : {}
  );
  const [activeScheduleId, setActiveScheduleId] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setSchedules(userData.schedules || {});
  };

  const handleLogout = () => {
    setUser(null);
    setSchedules({});
    setActiveScheduleId(null);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <NavBar onLogout={handleLogout} username={user.username} />
      <main>
        <Routes>
          <Route path="/" element={
            <Home 
              schedules={schedules}
              setSchedules={setSchedules}
              activeScheduleId={activeScheduleId}
              setActiveScheduleId={setActiveScheduleId}
              userId={user.userId}
            />
          } />
          <Route path="/weekly" element={
            <WeeklyView 
              schedule={schedules[activeScheduleId]?.schedule}
              scheduleName={schedules[activeScheduleId]?.name}
              schedules={schedules}
              activeScheduleId={activeScheduleId}
              setActiveScheduleId={setActiveScheduleId}
            />
          } />
          <Route path="/friends" element={<Friends userId={user.userId} />} />
          <Route 
            path="/compare" 
            element={<ScheduleComparison schedules={schedules} />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
