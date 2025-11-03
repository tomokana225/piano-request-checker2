import React, { useState } from 'react';
import { CogIcon, XIcon } from './IconComponents.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listInput: string;
  setListInput: (value: string) => void;
  isLoggedIn: boolean;
  onLogin: (password: string) => boolean;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  listInput,
  setListInput,
  isLoggedIn,
  onLogin,
  onLogout,
}) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleLoginClick = () => {
    if (onLogin(password)) {
      setLoginError(false);
      setPassword('');
    } else {
      setLoginError(true);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    onClose(); // Optionally close modal on logout
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="relative bg-gray-800 border border-cyan-400/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <CogIcon className="h-6 w-6 text-cyan-300"/>
            <h2 className="text-xl font-bold text-white">設定</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoggedIn ? (
          <div>
            <p className="text-sm text-gray-400 mb-2">弾ける曲リストを編集 (形式: 曲名,アーティスト名)</p>
            <textarea
              value={listInput}
              onChange={(e) => setListInput(e.target.value)}
              placeholder="例:&#10;夜に駆ける,YOASOBI&#10;Pretender,Official髭男dism"
              className="w-full h-48 bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300 mb-4"
            />
            <div className="flex justify-end gap-3">
                 <button onClick={handleLogoutClick} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">ログアウト</button>
                 <button onClick={onClose} className="px-5 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors">保存して閉じる</button>
            </div>
          </div>
        ) : (
          <div>
             <p className="text-sm text-gray-400 mb-4">管理者としてログインすると、弾ける曲リストを編集できます。</p>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLoginClick()}
                placeholder="パスワード"
                className={`flex-grow bg-gray-900/70 border ${loginError ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              <button onClick={handleLoginClick} className="px-5 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700">
                ログイン
              </button>
            </div>
            {loginError && <p className="text-red-400 text-sm mt-2">パスワードが違います。</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;