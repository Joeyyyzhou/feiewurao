import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from './store/useAppState';
import { Avatar } from './components/Avatar';
import { recordPV } from './lib/api';
import LandingPage from './pages/LandingPage';
import SorryPage from './pages/SorryPage';
import OnboardingPage from './pages/OnboardingPage';
import VerifyPage from './pages/VerifyPage';
import LoginPage from './pages/LoginPage';
import RegisterInfoPage from './pages/RegisterInfoPage';
import RegisterPrefPage from './pages/RegisterPrefPage';
import WelcomePage from './pages/WelcomePage';
import DailyQuestionsPage from './pages/DailyQuestionsPage';
import DailyCompletePage from './pages/DailyCompletePage';
import GuestShowPage from './pages/GuestShowPage';
import MatchSuccessPage from './pages/MatchSuccessPage';
import ProfilePage from './pages/ProfilePage';
import NotificationDetailPage from './pages/NotificationDetailPage';

function App() {
  const {
    state, setPhase, sendCode, verifyCode, registerUser, login, setPreferences,
    submitAnswer, finishAnswering, updateGuestLight, finalizeLight,
    goToProfile, goToNotifications, viewNotification, respondToLight,
    welcomeDone, startNewDay, goToDailyComplete, deleteAccount, logout,
  } = useAppState();

  const [pv, setPv] = useState(0);

  useEffect(() => {
    recordPV().then(setPv).catch(console.error);
  }, []);

  const showProfileBtn = state.user && !['landing', 'sorry', 'onboarding', 'verify', 'verify-sent', 'register-info', 'register-pref', 'welcome', 'login'].includes(state.phase);

  return (
    <div className="relative">
      {/* PV counter */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-1.5 text-[11px] text-text-muted select-none opacity-60">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span>{pv.toLocaleString()} 次访问</span>
      </div>

      {/* Profile button */}
      {showProfileBtn && state.user && state.phase !== 'profile' && state.phase !== 'notification-detail' && (
        <motion.button className="fixed top-5 right-5 z-50" onClick={goToProfile}
          initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Avatar nickname={state.user.nickname} color={state.user.avatarColor} size={44} />
          {state.lightNotifications.filter(n => n.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full border-2 border-bg-start" />
          )}
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={state.phase === 'verify-sent' ? 'verify' : state.phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {state.phase === 'landing' && (
            <LandingPage
              onYes={() => setPhase('onboarding')}
              onNo={() => setPhase('sorry')}
              onLogin={() => setPhase('login')}
            />
          )}
          {state.phase === 'sorry' && <SorryPage onBack={() => setPhase('landing')} />}
          {state.phase === 'onboarding' && <OnboardingPage onComplete={() => setPhase('verify')} />}
          {(state.phase === 'verify' || state.phase === 'verify-sent') && (
            <VerifyPage phase={state.phase} onSendCode={sendCode} onVerifyCode={verifyCode} />
          )}
          {state.phase === 'login' && (
            <LoginPage onLogin={login} onGoRegister={() => setPhase('onboarding')} />
          )}
          {state.phase === 'register-info' && (
            <RegisterInfoPage onComplete={(data) => registerUser(data)} />
          )}
          {state.phase === 'register-pref' && state.user && (
            <RegisterPrefPage gender={state.user.gender} onComplete={setPreferences} />
          )}
          {state.phase === 'welcome' && state.user && (
            <WelcomePage orderNum={state.userOrderNum} nickname={state.user.nickname} onContinue={welcomeDone} />
          )}
          {state.phase === 'daily-questions' && state.todayAnswers.size >= 4 && (
            <div className="min-h-screen flex flex-col items-center justify-center px-6">
              <motion.div className="text-center max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-5xl mb-6 select-none">✍️✨</div>
                <h2 className="text-2xl font-bold text-text mb-3">回答完毕</h2>
                <p className="text-text-secondary mb-10">现在去看看今天的嘉宾们怎么回答的吧</p>
                <motion.button onClick={finishAnswering}
                  className="px-10 py-3.5 rounded-2xl btn-primary text-base"
                  whileTap={{ scale: 0.97 }}>
                  查看嘉宾回答 💡
                </motion.button>
              </motion.div>
            </div>
          )}
          {state.phase === 'daily-questions' && state.todayAnswers.size < 4 && (
            <DailyQuestionsPage questions={state.todayQuestions} onSubmitAnswer={submitAnswer}
              onFinish={finishAnswering} canSkip={(state.user?.dayCount || 0) >= 10} />
          )}
          {state.phase === 'daily-guests' && (
            <GuestShowPage guests={state.guests} questionIds={state.todayQuestions.map(q => q.id)}
              onUpdateLight={updateGuestLight} onFinalizeLight={finalizeLight} onGiveUp={goToDailyComplete} />
          )}
          {state.phase === 'match-success' && (
            <MatchSuccessPage guest={state.lastMatchedGuest} onContinue={goToDailyComplete} onGoHome={goToProfile} />
          )}
          {state.phase === 'daily-complete' && (
            <DailyCompletePage
              onGoProfile={goToProfile}
              hasViewedGuests={true}
              onViewGuests={finishAnswering}
            />
          )}
          {state.phase === 'profile' && state.user && (
            <ProfilePage user={state.user} answers={state.answers} lightNotifications={state.lightNotifications}
              matches={state.matches} onBack={startNewDay} onViewNotification={viewNotification} onDeleteAccount={deleteAccount} onLogout={logout} />
          )}
          {state.phase === 'notification-detail' && state.selectedNotification && (
            <NotificationDetailPage notification={state.selectedNotification}
              onRespond={respondToLight} onBack={goToNotifications} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
