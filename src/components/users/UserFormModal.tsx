import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../../types/user';
import { Modal } from '../layout/Modal';
import { Upload, Eye, EyeOff, Save, User as UserIcon } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id'>) => void;
  initialUser?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialUser,
}) => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState<UserRole>('Administrador');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUser) {
      setNome(initialUser.nome || '');
      setCpf(initialUser.cpf || '');
      setEmail(initialUser.email || '');
      setCargo(initialUser.cargo || '');
      setDepartamento(initialUser.departamento || '');
      setMatricula(initialUser.matricula || '');
      setRole(initialUser.role || 'Administrador');
      setStatus(initialUser.status || 'Ativo');
      setSenha(initialUser.senha || '');
      setAvatarUrl(initialUser.avatarUrl);
    } else {
      setNome('');
      setCpf('');
      setEmail('');
      setCargo('');
      setDepartamento('');
      setMatricula('');
      setRole('Administrador');
      setStatus('Ativo');
      setSenha('');
      setAvatarUrl(undefined);
    }
  }, [initialUser, isOpen]);

  // Máscara de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    } else if (v.length > 6) {
      v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    } else if (v.length > 3) {
      v = `${v.slice(0, 3)}.${v.slice(3)}`;
    }
    setCpf(v);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo selecionado excede o limite máximo de 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !cargo.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    onSave({
      nome: nome.trim(),
      cpf: cpf.trim() || undefined,
      email: email.trim(),
      cargo: cargo.trim(),
      departamento: departamento.trim() || undefined,
      matricula: matricula.trim() || undefined,
      role,
      status,
      senha: senha || undefined,
      avatarUrl,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialUser ? 'Editar Usuário do Sistema' : 'Cadastrar Novo Usuário'}
      subtitle={initialUser ? 'Atualize as credenciais e permissões' : 'Preencha os dados e perfil de acesso do colaborador'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto de Avatar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Foto de Perfil / Avatar
          </label>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0 flex items-center justify-center text-slate-400">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <p className="text-xs text-slate-500">
                Formatos aceitos: JPG, PNG, WebP (Máx. 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                Selecionar Imagem
              </button>
            </div>
          </div>
        </div>

        {/* Grade de 2 Colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do colaborador"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              CPF <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* E-mail Institucional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail Institucional <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@pcal.al.gov.br"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* Cargo / Função */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cargo / Função <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Perito Criminal, Médico Legista, Assistente"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* Perfil de Acesso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perfil de Acesso <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
            >
              <option value="Administrador">Administrador (Acesso Total)</option>
              <option value="Supervisor">Gestor (Edição/Operação/Relatórios)</option>
              <option value="Operador">Operacional (Cadastro/Movimentações)</option>
              <option value="Visualizador">Visualizador (Apenas Leitura)</option>
            </select>
          </div>

          {/* Status da Conta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status da Conta <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* Senha de Acesso */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Senha de Acesso {initialUser ? '(deixe em branco para manter)' : <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              required={!initialUser}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha inicial de login"
              className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Rodapé com Botões */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Usuário
          </button>
        </div>
      </form>
    </Modal>
  );
};
