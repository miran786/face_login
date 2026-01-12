import { useState } from 'react';
import { FaceAuth } from './components/FaceAuth';
import { Dashboard } from './components/Dashboard';
import { RegistrationStart } from './components/RegistrationStart';
import { FaceRegistration } from './components/FaceRegistration';
import { FaceRegistrationInfo } from './components/FaceRegistrationInfo';
import type { FaceUserData } from './components/FaceRegistrationInfo';
import { TraditionalRegistration } from './components/TraditionalRegistration';
import type { TraditionalUserData } from './components/TraditionalRegistration';

type AppState =
  | 'start'
  | 'faceRegistration'
  | 'faceRegistrationInfo'
  | 'traditionalRegistration'
  | 'login'
  | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userData, setUserData] = useState<FaceUserData | TraditionalUserData | null>(null);

  // Face ID Registration Flow
  const [tempFaceDescriptor, setTempFaceDescriptor] = useState<Float32Array | null>(null);

  const handleStartFaceID = () => {
    setAppState('faceRegistration');
  };

  const handleFaceRegistrationComplete = (descriptor: Float32Array) => {
    setTempFaceDescriptor(descriptor);
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

  const handleLoginSuccess = (user: any) => {
    setUserData(user);
    setAppState('dashboard');
  };

  const handleRegister = () => {
    setAppState('start');
  };

  const handleLogout = () => {
    setUserData(null);
    setAppState('login');
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
        faceDescriptor={tempFaceDescriptor}
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
    return <FaceAuth onAuthSuccess={handleLoginSuccess} onRegister={handleRegister} />;
  }

  // Ensure userData is present before rendering Dashboard
  if (!userData) {
    return <div>Loading...</div>; // Or redirect to login
  }

  return <Dashboard user={userData as any} onLogout={handleLogout} />;
}

export default App;
