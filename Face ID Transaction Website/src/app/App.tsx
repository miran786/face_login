import { useState } from 'react';
import { FaceAuth } from './components/FaceAuth';
import { Dashboard } from './components/Dashboard';
import { RegistrationStart } from './components/RegistrationStart';
import { FaceRegistration } from './components/FaceRegistration';
import { FaceRegistrationInfo, FaceUserData } from './components/FaceRegistrationInfo';
import { TraditionalRegistration, TraditionalUserData } from './components/TraditionalRegistration';

type AppState = 
  | 'start' 
  | 'faceRegistration' 
  | 'faceRegistrationInfo'
  | 'traditionalRegistration'
  | 'login' 
  | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('start');
  const [userData, setUserData] = useState<FaceUserData | TraditionalUserData | null>(null);

  // Face ID Registration Flow
  const handleStartFaceID = () => {
    setAppState('faceRegistration');
  };

  const handleFaceRegistrationComplete = () => {
    setAppState('faceRegistrationInfo');
  };

  const handleFaceRegistrationInfoComplete = (data: FaceUserData) => {
    setUserData(data);
    setAppState('dashboard');
  };

  // Traditional Registration Flow
  const handleUseTraditional = () => {
    setAppState('traditionalRegistration');
  };

  const handleTraditionalRegistrationComplete = (data: TraditionalUserData) => {
    setUserData(data);
    setAppState('dashboard');
  };

  const handleBackToStart = () => {
    setAppState('start');
  };

  const handleLoginSuccess = () => {
    setAppState('dashboard');
  };

  if (appState === 'start') {
    return (
      <RegistrationStart
        onStartFaceID={handleStartFaceID}
        onUseTraditional={handleUseTraditional}
      />
    );
  }

  if (appState === 'faceRegistration') {
    // Create temporary user data for face registration
    const tempUserData: FaceUserData = {
      fullName: 'New User',
      email: '',
      phone: ''
    };
    return (
      <FaceRegistration
        userData={tempUserData}
        onComplete={handleFaceRegistrationComplete}
      />
    );
  }

  if (appState === 'faceRegistrationInfo') {
    return (
      <FaceRegistrationInfo
        onComplete={handleFaceRegistrationInfoComplete}
      />
    );
  }

  if (appState === 'traditionalRegistration') {
    return (
      <TraditionalRegistration
        onComplete={handleTraditionalRegistrationComplete}
        onBack={handleBackToStart}
      />
    );
  }

  if (appState === 'login') {
    return <FaceAuth onAuthSuccess={handleLoginSuccess} />;
  }

  return <Dashboard />;
}

export default App;
