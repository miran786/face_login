import { useState, useEffect } from 'react';
import { API_BASE } from './config';
import { FaceAuth } from './components/FaceAuth';
import { Dashboard } from './components/Dashboard';
import { RegistrationStart } from './components/RegistrationStart';
import { FaceRegistration } from './components/FaceRegistration';
import { FaceRegistrationInfo, FaceUserData } from './components/FaceRegistrationInfo';
import { TraditionalRegistration, TraditionalUserData } from './components/TraditionalRegistration';
import { TraditionalLogin } from './components/TraditionalLogin';
import { ForgotPassword } from './components/ForgotPassword';

type AppState =
  | 'start'
  | 'faceRegistration'
  | 'faceRegistrationInfo'
  | 'traditionalRegistration'
  | 'traditionalLogin'
  | 'forgotPassword'
  | 'login'
  | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('start');
  const [userData, setUserData] = useState<FaceUserData | TraditionalUserData | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserData({
            fullName: data.user.name,
            username: data.user.username,
            email: data.user.email || '',
            phone: data.user.phone || ''
          });
          setAppState('dashboard');
        }
      } catch (err) {
        console.error('Session check failed', err);
      }
    };
    checkSession();
  }, []);

  // Face ID Registration Flow
  const handleStartFaceID = () => {
    setAppState('faceRegistration');
  };

  const handleFaceRegistrationComplete = (descriptor: number[]) => {
    setCapturedDescriptor(descriptor);
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

  const handleLoginSuccess = (user?: any) => {
    if (user) {
      setUserData({
        fullName: user.name || user.fullName,
        username: user.username,
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUserData(null);
    setAppState('start');
  };

  if (appState === 'start') {
    return (
      <RegistrationStart
        onStartFaceID={handleStartFaceID}
        onUseTraditional={handleUseTraditional}
        onFaceLogin={() => setAppState('login')}
        onLogin={() => setAppState('traditionalLogin')}
      />
    );
  }

  if (appState === 'faceRegistration') {
    const tempUserData: FaceUserData = {
      fullName: 'New User',
      username: 'temp_user',
      email: '',
      phone: ''
    };
    return (
      <FaceRegistration
        userData={tempUserData}
        onComplete={handleFaceRegistrationComplete}
        onBack={handleBackToStart}
      />
    );
  }

  if (appState === 'faceRegistrationInfo') {
    return (
      <FaceRegistrationInfo
        faceDescriptor={capturedDescriptor}
        onComplete={handleFaceRegistrationInfoComplete}
        onBack={handleBackToStart}
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

  if (appState === 'traditionalLogin') {
    return (
      <TraditionalLogin
        onLoginSuccess={handleTraditionalRegistrationComplete}
        onBack={handleBackToStart}
        onForgotPassword={() => setAppState('forgotPassword')}
      />
    );
  }

  if (appState === 'forgotPassword') {
    return (
      <ForgotPassword
        onBack={() => setAppState('traditionalLogin')}
        onSuccess={() => setAppState('traditionalLogin')}
      />
    );
  }

  if (appState === 'login') {
    return (
      <FaceAuth
        onAuthSuccess={handleLoginSuccess}
        onFallback={() => setAppState('traditionalLogin')}
      />
    );
  }

  return (
    <Dashboard
      userName={userData?.fullName}
      onLogout={handleLogout}
    />
  );
}

export default App;
