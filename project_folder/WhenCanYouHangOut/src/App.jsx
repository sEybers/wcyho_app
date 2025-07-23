import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Friends from './pages/Friends';
import WeeklyView from './pages/WeeklyView';
import NavBar from './components/NavBar/NavBar';

function App() {
  // Initialize with empty schedules object
  const [schedules, setSchedules] = useState({});
  const [activeScheduleId, setActiveScheduleId] = useState(null);

  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={
            <Home 
              schedules={schedules}
              setSchedules={setSchedules}
              activeScheduleId={activeScheduleId}
              setActiveScheduleId={setActiveScheduleId}
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
          <Route path="/friends" element={<Friends />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
