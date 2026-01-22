import { useState, useEffect } from 'react';
import { FaceAuth } from './components/FaceAuth';
import { Dashboard } from './components/Dashboard';
import { RegistrationStart } from './components/RegistrationStart';
import { FaceRegistration } from './components/FaceRegistration';
import { FaceRegistrationInfo } from './components/FaceRegistrationInfo';
import type { FaceUserData } from './components/FaceRegistrationInfo';
import { TraditionalRegistration } from './components/TraditionalRegistration';
import type { TraditionalUserData } from './components/TraditionalRegistration';
import { PasswordLogin } from './components/PasswordLogin';
import { ForgotPassword } from './components/ForgotPassword';
import { OTPVerification } from './components/OTPVerification';
import { emailService } from '../services/emailService';

type AppState =
  | 'start'
  | 'faceRegistration'
  | 'faceRegistrationInfo'
  | 'traditionalRegistration'
  | 'login'
  | 'passwordLogin'
  | 'forgotPassword'
  | 'otpVerification'
  | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userData, setUserData] = useState<FaceUserData | TraditionalUserData | null>(null);

  // 2FA State
  const [tempUserForTwoFactor, setTempUserForTwoFactor] = useState<any>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  // Face ID Registration Flow
  const [tempFaceDescriptor, setTempFaceDescriptor] = useState<Float32Array | null>(null);
  const [tempFaceImage, setTempFaceImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    emailService.init();
  }, []);

  const handleStartFaceID = () => {
    setAppState('faceRegistration');
  };

  const handleFaceRegistrationComplete = (descriptor: Float32Array, faceImage?: string) => {
    setTempFaceDescriptor(descriptor);
    setTempFaceImage(faceImage);
    setAppState('faceRegistrationInfo');
  };

  const handleFaceRegistrationInfoComplete = (data: FaceUserData) => {
    // For new registration, maybe skip 2FA or do it? Let's skip for simplicity of onboarding
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

  const handleLoginSuccess = async (user: any) => {
    // Trigger 2FA
    setTempUserForTwoFactor(user);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    // Send OTP
    const res = await emailService.sendOTP(user.email, code, 'Login');
    if (res.success) {
      setAppState('otpVerification');
    } else {
      alert('Failed to send OTP. Please try again.');
    }
  };

  const handleTwoFactorVerify = (otp: string) => {
    if (otp === generatedOtp) {
      setUserData(tempUserForTwoFactor);
      setAppState('dashboard');
      setTempUserForTwoFactor(null);
      setGeneratedOtp('');
    } else {
      alert('Incorrect OTP');
    }
  }

  const handleResendTwoFactor = async () => {
    if (!tempUserForTwoFactor) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    await emailService.sendOTP(tempUserForTwoFactor.email, code, 'Login');
  }

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
        onBack={() => setAppState('start')}
      />
    );
  }

  if (appState === 'faceRegistrationInfo') {
    return (
      <FaceRegistrationInfo
        faceDescriptor={tempFaceDescriptor}
        faceImage={tempFaceImage}
        onComplete={handleFaceRegistrationInfoComplete}
        onBack={() => setAppState('faceRegistration')}
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
    return (
      <FaceAuth
        onAuthSuccess={handleLoginSuccess}
        onRegister={handleRegister}
        onUsePassword={() => setAppState('passwordLogin')}
      />
    );
  }

  if (appState === 'passwordLogin') {
    return (
      <PasswordLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToFace={() => setAppState('login')}
        onForgotPassword={() => setAppState('forgotPassword')}
      />
    )
  }

  if (appState === 'forgotPassword') {
    return (
      <ForgotPassword
        onBack={() => setAppState('passwordLogin')}
        onSuccess={() => setAppState('passwordLogin')}
      />
    )
  }

  if (appState === 'otpVerification') {
    return (
      <OTPVerification
        email={tempUserForTwoFactor?.email || ''}
        onVerify={handleTwoFactorVerify}
        onResend={handleResendTwoFactor}
        onBack={() => setAppState('login')}
      />
    )
  }

  // Ensure userData is present before rendering Dashboard
  if (!userData) {
    return <div>Loading...</div>; // Or redirect to login
  }

  return <Dashboard user={userData as any} onLogout={handleLogout} />;
}

export default App;
