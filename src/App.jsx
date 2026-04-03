import { useState } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import Diet from './components/diet/Diet.jsx';
import Workout from './components/workout/Workout.jsx';
import Diagnose from './components/diagnose/Diagnose.jsx';
import Supplements from './components/supplements/Supplements.jsx';

function isUnlocked() {
  return sessionStorage.getItem('hh_unlocked') === '1';
}

export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [screen, setScreen] = useState('home');
  const [darkMode, setDarkMode] = useState(true);

  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');

  const toggleDark = () => {
    setDarkMode(d => {
      const next = !d;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
      return next;
    });
  };

  if (!unlocked) {
    return <PasswordGate onUnlock={() => { sessionStorage.setItem('hh_unlocked','1'); setUnlocked(true); }} darkMode={darkMode} toggleDark={toggleDark} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'diet': return <Diet onBack={() => setScreen('home')} />;
      case 'workout': return <Workout onBack={() => setScreen('home')} />;
      case 'diagnose': return <Diagnose onBack={() => setScreen('home')} />;
      case 'supplements': return <Supplements onBack={() => setScreen('home')} />;
      default: return <Home onNavigate={setScreen} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar onLogoClick={() => setScreen('home')} darkMode={darkMode} toggleDark={toggleDark} />
      <main key={screen} className="fade-up" style={{ paddingTop: '72px', paddingBottom: '60px' }}>
        {renderScreen()}
      </main>
    </div>
  );
}