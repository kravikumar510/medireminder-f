import React, { useState, useEffect, useRef } from 'react';
import { User, Medicine, MedicineType } from './types';
import * as api from './services/api';
import InputField from './components/InputField';
import Button from './components/Button';
import MedicineCard from './components/MedicineCard';

enum View {
  LOGIN,
  REGISTER,
  FORGOT_PASSWORD,
  DASHBOARD,
  PROFILE
}

const AVATARS = [
  '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '💊', '🏥', '❤️', '🩺', '🧬'
];

const MEDICINE_TYPES: MedicineType[] = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Inhaler', 'Cream', 'Other'];

const HEALTH_QUOTES = [
  "The greatest wealth is health.",
  "Take care of your body. It's the only place you have to live.",
  "To keep the body in good health is a duty.",
  "Health is a state of complete harmony of the body, mind and spirit.",
  "A healthy outside starts from the inside.",
  "Your health is an investment, not an expense.",
  "Happiness is the highest form of health."
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  
  // Auth State
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone for login
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regContact, setRegContact] = useState(''); // Single field for Email OR Phone
  const [regPassword, setRegPassword] = useState('');
  const [fpEmail, setFpEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');

  // Dashboard State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medType, setMedType] = useState<MedicineType>('Tablet');
  const [editingId, setEditingId] = useState<string | null>(null); // For update logic
  const [isMedLoading, setIsMedLoading] = useState(false);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile State
  const [avatar, setAvatar] = useState(AVATARS[0]);

  // Dark Mode Init
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    setDailyQuote(HEALTH_QUOTES[Math.floor(Math.random() * HEALTH_QUOTES.length)]);

    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        const savedAvatar = localStorage.getItem(`avatar_${parsedUser._id || parsedUser.id}`);
        if (savedAvatar) setAvatar(savedAvatar);
        
        setCurrentView(View.DASHBOARD);
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  useEffect(() => {
    if (user && currentView === View.DASHBOARD) {
      loadMedicines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentView]);

  const playNotificationSound = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      
      const ctx = new Ctx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

      const now = ctx.currentTime;
      for (let i = 0; i < 10; i++) { // 10 beeps = approx 5 seconds
        const startTime = now + i * 0.5;
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      }

      osc.start(now);
      osc.stop(now + 5); 

    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const loadMedicines = async () => {
    if (!user) return;
    
    setLoadingMeds(true);
    try {
      const data = await api.getMedicines();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load medicines:", err);
    } finally {
      setLoadingMeds(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const response = await api.loginUser({ 
        email: loginIdentifier.trim(), 
        password: loginPassword 
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      const userId = response.user._id || response.user.id;
      const savedAvatar = localStorage.getItem(`avatar_${userId}`);
      if (savedAvatar) setAvatar(savedAvatar);

      setCurrentView(View.DASHBOARD);
      setLoginIdentifier('');
      setLoginPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const contact = regContact.trim();
    let email: string | undefined = undefined;
    let phone: string | undefined = undefined;

    if (contact) {
      if (contact.includes('@')) {
        email = contact;
      } else {
        phone = contact;
      }
    }

    setIsAuthLoading(true);
    try {
      const response = await api.registerUser({ 
        username: regUsername.trim(), 
        email: email,
        phone: phone,
        password: regPassword
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setCurrentView(View.DASHBOARD);
      setRegUsername('');
      setRegContact('');
      setRegPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);
    try {
        const res = await api.forgotPassword(fpEmail);
        setAuthSuccess(res.message || "If an account matches, a reset link has been sent.");
        setFpEmail('');
    } catch (err: any) {
        setAuthError(err.message || "Failed to process request.");
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView(View.LOGIN);
    setMedicines([]);
  };

  // Edit logic
  const handleEditClick = (medicine: Medicine) => {
    setMedName(medicine.name);
    setMedDosage(medicine.dosage);
    setMedFrequency(medicine.frequency);
    setMedType(medicine.type || 'Tablet');
    setEditingId(medicine._id);
  };

  const handleCancelEdit = () => {
    setMedName('');
    setMedDosage('');
    setMedFrequency('');
    setMedType('Tablet');
    setEditingId(null);
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const userId = user._id || user.id;
    
    setIsMedLoading(true);
    try {
      if (editingId) {
        // Update
        const updatedMed = await api.updateMedicine(editingId, {
          name: medName,
          dosage: medDosage,
          frequency: medFrequency,
          type: medType,
          user: userId
        });
        
        setMedicines(prev => prev.map(m => m._id === editingId ? updatedMed : m));
        handleCancelEdit();
      } else {
        // Create
        const newMed = await api.addMedicine({
          name: medName,
          dosage: medDosage,
          frequency: medFrequency,
          type: medType,
          user: userId
        });
        
        if (Array.isArray(newMed)) {
           loadMedicines(); 
        } else if (newMed) {
           setMedicines(prev => [...prev, newMed]);
        }
        handleCancelEdit();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save medicine');
    } finally {
      setIsMedLoading(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    setDeletingId(id);
    try {
      await api.deleteMedicine(id);
      setMedicines(prev => prev.filter(m => m._id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err: any) {
      alert(err.message || 'Failed to delete medicine');
    } finally {
      setDeletingId(null);
    }
  };

  const saveProfile = () => {
      const userId = user?._id || user?.id;
      if (userId) {
          localStorage.setItem(`avatar_${userId}`, avatar);
          alert("Profile updated successfully!");
      }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return { text: "Good Night", icon: "fa-moon" };
    if (hour < 12) return { text: "Good Morning", icon: "fa-cloud-sun" };
    if (hour < 17) return { text: "Good Afternoon", icon: "fa-sun" };
    return { text: "Good Evening", icon: "fa-moon" };
  };

  const handleExportReport = () => {
    const date = new Date().toISOString().split('T')[0];
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Medicine Name,Type,Dosage,Frequency\n"
      + medicines.map(m => `"${m.name}","${m.type || 'Tablet'}","${m.dosage}","${m.frequency}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mediminder_monthly_report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const DarkModeToggle = ({ className }: { className?: string }) => (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-colors ${className ?? 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-yellow-300'}`}
      title="Toggle Dark Mode"
    >
      <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
    </button>
  );

  if (currentView === View.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors border border-slate-100 dark:border-slate-700">
          <div className="bg-primary p-8 text-center">
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <i className="fa-solid fa-notes-medical text-white text-3xl"></i>
             </div>
             <h1 className="text-3xl font-bold text-white mb-2">MediMinder</h1>
             <p className="text-purple-100">Your health, your schedule</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Sign In</h2>
            <form onSubmit={handleLogin}>
              <InputField 
                label="Email or Phone" 
                type="text" 
                placeholder="you@example.com or number"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                icon={<i className="fa-regular fa-user"></i>}
                required
              />
              <InputField 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                icon={<i className="fa-solid fa-lock"></i>}
                required
              />
              
              <div className="flex justify-end mb-4">
                  <button type="button" onClick={() => {setAuthError(''); setCurrentView(View.FORGOT_PASSWORD)}} className="text-sm text-primary hover:underline dark:text-purple-400">Forgot password?</button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i>
                  {authError}
                </div>
              )}
              
              <Button type="submit" isLoading={isAuthLoading} className="w-full">
                Sign In
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <button onClick={() => {setAuthError(''); setCurrentView(View.REGISTER)}} className="text-primary dark:text-purple-400 font-medium hover:underline">
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === View.REGISTER) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors border border-slate-100 dark:border-slate-700">
          <div className="bg-primary p-6 text-center">
             <h1 className="text-2xl font-bold text-white">Create Account</h1>
             <p className="text-purple-100 text-sm">Join MediMinder today</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleRegister}>
              <InputField 
                label="Full Name" 
                type="text" 
                placeholder="John Doe"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                icon={<i className="fa-regular fa-user"></i>}
                required
              />
              
              <InputField 
                label="Email or Phone (Optional)" 
                type="text" 
                placeholder="you@example.com or number"
                value={regContact}
                onChange={e => setRegContact(e.target.value)}
                icon={<i className="fa-solid fa-address-card"></i>}
              />

              <InputField 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                icon={<i className="fa-solid fa-lock"></i>}
                required
              />
              
              {authError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i>
                  {authError}
                </div>
              )}
              
              <Button type="submit" isLoading={isAuthLoading} className="w-full">
                Register
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button onClick={() => {setAuthError(''); setCurrentView(View.LOGIN)}} className="text-primary dark:text-purple-400 font-medium hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === View.FORGOT_PASSWORD) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
          <div className="absolute top-4 right-4">
            <DarkModeToggle />
          </div>
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors border border-slate-100 dark:border-slate-700">
            <div className="bg-primary p-6 text-center">
               <h1 className="text-2xl font-bold text-white">Reset Password</h1>
               <p className="text-purple-100 text-sm">We'll send you a link</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleForgotPassword}>
                <InputField 
                  label="Email Address" 
                  type="email" 
                  placeholder="you@example.com"
                  value={fpEmail}
                  onChange={e => setFpEmail(e.target.value)}
                  icon={<i className="fa-regular fa-envelope"></i>}
                  required
                />
                
                {authError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i>
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center">
                    <i className="fa-regular fa-circle-check mr-2"></i>
                    {authSuccess}
                  </div>
                )}
                
                <Button type="submit" isLoading={isAuthLoading} className="w-full">
                  Send Reset Link
                </Button>
              </form>
              
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                <button onClick={() => {setAuthError(''); setCurrentView(View.LOGIN)}} className="text-primary dark:text-purple-400 font-medium hover:underline">
                  <i className="fa-solid fa-arrow-left mr-1"></i> Back to Login
                </button>
              </p>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <nav className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50 border-b dark:border-slate-700 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(View.DASHBOARD)}>
              <div className="text-primary text-2xl mr-2">
                 <i className="fa-solid fa-notes-medical"></i>
              </div>
              <span className="font-bold text-xl text-slate-800 dark:text-white">MediMinder</span>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
                onClick={() => setCurrentView(View.PROFILE)}
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xl border border-purple-200 dark:border-purple-800">
                    {avatar}
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium hidden sm:block">{user?.name || user?.username}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors p-2"
                title="Logout"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === View.DASHBOARD && (
          <>
            {(() => {
              const greeting = getGreeting();
              return (
                <div className="mb-8 bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-16"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <i className={`fa-solid ${greeting.icon} mr-3 opacity-90`}></i>
                            {greeting.text}, {user?.name || user?.username?.split(' ')[0]}!
                        </h1>
                        <p className="text-purple-100 text-lg italic opacity-90 mb-6">"{dailyQuote}"</p>
                        
                        <button 
                            onClick={handleExportReport}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center backdrop-blur-sm"
                        >
                            <i className="fa-solid fa-file-export mr-2"></i>
                            Export Monthly Report
                        </button>
                    </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                        <i className="fa-solid fa-chart-pie text-primary mr-2"></i> Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg text-center">
                            <span className="block text-2xl font-bold text-primary dark:text-purple-400">{medicines.length}</span>
                            <span className="text-xs text-purple-600 dark:text-purple-300 font-medium">Total Meds</span>
                        </div>
                        <div className="bg-pink-50 dark:bg-pink-900/30 p-4 rounded-lg text-center">
                            <span className="block text-2xl font-bold text-pink-500 dark:text-pink-400">{medicines.filter(m => m.type === 'Tablet' || !m.type).length}</span>
                            <span className="text-xs text-pink-600 dark:text-pink-300 font-medium">Tablets</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-24 transition-colors">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
                            <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary dark:text-purple-300 text-sm`}></i>
                        </div>
                        {editingId ? 'Edit Medicine' : 'Add Medicine'}
                      </div>
                      {editingId && (
                        <button onClick={handleCancelEdit} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
                      )}
                    </h2>
                    <form onSubmit={handleSaveMedicine}>
                    <InputField 
                        label="Medicine Name" 
                        placeholder="e.g. Amoxicillin"
                        value={medName}
                        onChange={e => setMedName(e.target.value)}
                        required
                    />
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <i className="fa-solid fa-pills"></i>
                            </div>
                            <select 
                                className="w-full px-4 py-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                value={medType}
                                onChange={(e) => setMedType(e.target.value as MedicineType)}
                            >
                                {MEDICINE_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField 
                        label="Dosage" 
                        placeholder="500mg"
                        value={medDosage}
                        onChange={e => setMedDosage(e.target.value)}
                        required
                        />
                        <InputField 
                        label="Frequency" 
                        placeholder="2x daily"
                        value={medFrequency}
                        onChange={e => setMedFrequency(e.target.value)}
                        required
                        />
                    </div>
                    
                    <Button type="submit" isLoading={isMedLoading} className="w-full mt-2">
                        {editingId ? 'Update Medicine' : 'Add to Schedule'}
                    </Button>
                    </form>
                </div>
                </div>

                <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Medicines</h2>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-primary dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                    {medicines.length} Active
                    </span>
                </div>

                {loadingMeds ? (
                    <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center transition-colors">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-prescription-bottle-medical text-slate-300 dark:text-slate-500 text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No medicines yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Add your first medicine to start tracking your schedule.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medicines.map((med) => (
                        <MedicineCard 
                        key={med._id} 
                        medicine={med} 
                        onDelete={handleDeleteMedicine}
                        onEdit={handleEditClick}
                        isDeleting={deletingId === med._id}
                        onPlayAlarm={playNotificationSound}
                        />
                    ))}
                    </div>
                )}
                </div>
            </div>
          </>
        )}

        {currentView === View.PROFILE && (
             <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
                     <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h2>
                         <button onClick={() => setCurrentView(View.DASHBOARD)} className="text-sm text-primary hover:underline dark:text-purple-400">
                            Back to Dashboard
                         </button>
                     </div>

                     <div className="flex flex-col items-center mb-8">
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Choose your Avatar</label>
                         <div className="flex flex-wrap justify-center gap-4 mb-6">
                            {AVATARS.map((char) => (
                                <button 
                                    key={char}
                                    onClick={() => setAvatar(char)}
                                    className={`text-4xl w-16 h-16 rounded-full flex items-center justify-center transition-all ${avatar === char ? 'bg-purple-100 dark:bg-purple-900 border-2 border-primary scale-110' : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-transparent'}`}
                                >
                                    {char}
                                </button>
                            ))}
                         </div>
                     </div>

                     <div className="space-y-4">
                         <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center transition-colors">
                             <div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Username</p>
                                 <p className="text-lg font-medium text-slate-800 dark:text-white">{user?.username || user?.name}</p>
                             </div>
                             <i className="fa-regular fa-user text-slate-300 dark:text-slate-500 text-xl"></i>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center transition-colors">
                             <div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Email</p>
                                 <p className="text-lg font-medium text-slate-800 dark:text-white">{user?.email || 'N/A'}</p>
                             </div>
                             <i className="fa-regular fa-envelope text-slate-300 dark:text-slate-500 text-xl"></i>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center transition-colors">
                             <div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Member ID</p>
                                 <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{user?._id || user?.id}</p>
                             </div>
                             <i className="fa-solid fa-fingerprint text-slate-300 dark:text-slate-500 text-xl"></i>
                         </div>
                     </div>
                     
                     <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                         <Button onClick={saveProfile}>
                             Save Changes
                         </Button>
                     </div>
                </div>
             </div>
        )}
      </main>
    </div>
  );
};

export default App;