import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { isDisplayNameAvailable } from '../services/userService';

type AuthMode = 'login' | 'register';

const firebaseErrorToMessage = (code?: string) => {
  switch (code) {
    case 'auth/invalid-email':
      return '이메일 형식을 확인해주세요.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/weak-password':
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    case 'auth/popup-closed-by-user':
      return '인증 창이 닫혔습니다. 다시 시도해주세요.';
    default:
      return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';
  }
};

export const AuthScreen: React.FC = () => {
  const { signInWithEmail, registerWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);

  useEffect(() => {
    setNicknameStatus('idle');
    setNicknameMessage(null);
  }, [displayName, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          return;
        }
        if (nicknameStatus !== 'available') {
          setError('닉네임 중복 확인을 완료해주세요.');
          return;
        }
        await registerWithEmail(email, password, displayName);
      }
    } catch (err: any) {
      setError(firebaseErrorToMessage(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckNickname = async () => {
    if (!displayName.trim()) {
      setNicknameStatus('unavailable');
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }
    setNicknameStatus('checking');
    setNicknameMessage(null);
    try {
      const available = await isDisplayNameAvailable(displayName);
      if (available) {
        setNicknameStatus('available');
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setNicknameStatus('unavailable');
        setNicknameMessage('이미 사용 중인 닉네임입니다.');
      }
    } catch {
      setNicknameStatus('unavailable');
      setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(firebaseErrorToMessage(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('비밀번호 재설정을 위해 이메일을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await resetPassword(email);
      setInfo('비밀번호 재설정 메일을 전송했습니다.');
    } catch (err: any) {
      setError(firebaseErrorToMessage(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-ocean-100">
          <div className="mb-6">
            <p className="text-sm text-gray-500 text-center">{mode === 'login' ? '환영합니다! 먼저 로그인해주세요.' : '새 계정을 만들고 로그를 시작하세요.'}</p>
            <h2 className="text-2xl font-bold text-ocean-900 mt-1 text-center">
              {mode === 'login' ? '로그인' : '회원가입'}
            </h2>
            <p className="text-center text-xs text-gray-400">OceanLog AI • 스마트 다이브 로그</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-gray-500 block mb-1">닉네임</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 outline-none transition"
                    placeholder="예: Ocean Explorer"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCheckNickname}
                    isLoading={nicknameStatus === 'checking'}
                    disabled={nicknameStatus === 'checking'}
                  >
                    중복 확인
                  </Button>
                </div>
                {nicknameMessage && (
                  <p
                    className={`text-xs mt-1 ${
                      nicknameStatus === 'available' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {nicknameMessage}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-gray-500 block mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 outline-none transition"
                placeholder="diver@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 outline-none transition"
                placeholder={mode === 'login' ? '비밀번호를 입력하세요' : '최소 6자 이상'}
                required
                minLength={6}
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-sm text-gray-500 block mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 outline-none transition"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}

            <Button type="submit" isLoading={submitting} className="w-full">
              {mode === 'login' ? '로그인' : '회원가입'}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <button
              className="text-ocean-600 hover:text-ocean-800 underline-offset-4 hover:underline"
              onClick={handleResetPassword}
              type="button"
              disabled={submitting}
            >
              비밀번호를 잊으셨나요?
            </button>
            <button
              className="text-ocean-600 hover:text-ocean-800 underline-offset-4 hover:underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              type="button"
              disabled={submitting}
            >
              {mode === 'login' ? '계정이 없어요' : '이미 계정이 있어요'}
            </button>
          </div>

          <div className="relative mt-6 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-gray-400 bg-white">또는</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleLogin}
            isLoading={submitting}
            className="w-full"
            icon={<span className="text-lg">🌐</span>}
          >
            Google 계정으로 계속하기
          </Button>
        </div>
      </div>
    </div>
  );
};

