import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchUser, users } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Máscara dinâmica de CPF (000.000.000-00)
  const formatCpfMask = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (errorMessage) setErrorMessage('');

    // Se o usuário estiver digitando números ou formato de CPF, aplica a máscara automaticamente
    const isPureNumbersOrCpf = /^[\d.-]*$/.test(val);
    const onlyDigits = val.replace(/\D/g, '');

    if (isPureNumbersOrCpf && onlyDigits.length > 0) {
      setIdentifier(formatCpfMask(val));
    } else {
      // Caso seja e-mail institucional
      setIdentifier(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Por favor, informe seu e-mail institucional ou CPF.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha de acesso institucional.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(identifier, password);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      } else if (res.success) {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1629] via-[#122443] to-[#1E3A6D] flex flex-col justify-between text-slate-100 relative overflow-hidden font-sans">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#C5B641_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#274578]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#C5B641]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Institucional Superior */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0F1D38] border border-[#C5B641]/50 p-1 flex items-center justify-center shadow-lg shadow-black/30">
            <img
              src="/policia-cientifica-logo.png"
              alt="Polícia Científica de Alagoas"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">PrazoJus</span>
              <span className="text-[10px] font-extrabold bg-[#C5B641] text-[#0F0D02] px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                POLCAL
              </span>
            </div>
            <p className="text-[11px] text-[#C9D7EE] font-medium leading-none">
              Polícia Científica do Estado de Alagoas
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#C9D7EE]/80 bg-[#122443]/60 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-[#C5B641]" />
          <span>Acesso Restrito a Servidores Autorizados</span>
        </div>
      </header>

      {/* Conteúdo Central: Card de Login */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl shadow-black/50 border border-slate-200/80 p-6 sm:p-8 backdrop-blur-md">
          {/* Título do Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 mb-3 shadow-inner">
              <Lock className="w-6 h-6 text-[#122443]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Acesso ao Sistema
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Controle de Prazos Processuais e Requisições Periciais
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Identificação Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  placeholder="E-mail institucional ou CPF"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#274578] focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="text-xs text-blue-700 hover:text-blue-900 hover:underline font-medium cursor-pointer"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#274578] focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#274578] rounded border-slate-300 focus:ring-[#274578]"
                />
                <span className="text-xs text-slate-600 font-medium">Lembrar credenciais</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#122443] hover:bg-[#274578] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé informativo do formulário de autenticação */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5 text-slate-400 text-xs">
            <Building2 className="w-4 h-4 shrink-0 text-[#C5B641]" />
            <p className="text-[11px] leading-tight text-slate-500">
              Acesso exclusivo para servidores cadastrados. Contate a Chefia administrativa da Polícia Científica para primeiro acesso ou redefinição de senha.
            </p>
          </div>
        </div>

        {/* Alerta de Segurança e Termos de Uso */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-300/80 leading-relaxed">
            Ambiente institucional monitorado pela <strong className="text-white">Polícia Científica de Alagoas (POLCAL)</strong>. O acesso indevido é passível de responsabilização administrativa, civil e criminal.
          </p>
        </div>
      </main>

      {/* Footer Institucional */}
      <footer className="relative z-10 w-full py-4 text-center border-t border-white/10 bg-[#0B1629]/80 backdrop-blur-md">
        <p className="text-xs text-[#C9D7EE]/70">
          Governo de Alagoas • Secretaria de Estado da Segurança Pública (SSP/AL) • Polícia Científica
        </p>
      </footer>

      {/* Modal Simples de Ajuda / Recuperação de Senha */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5 text-[#274578]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Recuperação de Credenciais</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Por motivos de sigilo processual e segurança pericial forense, as credenciais de acesso são geridas centralizadamente.
              <br /><br />
              Caso tenha esquecido sua senha ou necessite de desbloqueio, solicite suporte à Chefia administrativa da Polícia Científica.
            </p>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 text-xs font-bold text-white bg-[#122443] hover:bg-[#274578] rounded-xl transition-colors cursor-pointer"
            >
              Compreendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

