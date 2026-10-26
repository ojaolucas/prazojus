import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole } from '../../types/user';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../layout/Modal';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import {
  Upload,
  Eye,
  EyeOff,
  Save,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  Building2,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import { SETORES_SOLICITANTES } from '../../data/constants';
import { MultiSearchableSelect } from '../common/SearchableSelect';

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
  const { users } = useAuth();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [setores, setSetores] = useState<string[]>([]);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialSnapshotRef = useRef<string>('');

  const buildSnapshot = (values: {
    nome: string;
    cpf: string;
    email: string;
    cargo: string;
    departamento: string;
    matricula: string;
    role: string;
    status: string;
    senha: string;
    avatarUrl: string;
    setores: string;
  }) => JSON.stringify(values);

  useEffect(() => {
    if (!isOpen) {
      initialSnapshotRef.current = '';
      return;
    }

    if (initialUser) {
      const n = initialUser.nome || '';
      const c = initialUser.cpf || '';
      const e = initialUser.email || '';
      const cg = initialUser.cargo || '';
      const dp = initialUser.departamento || '';
      const mt = initialUser.matricula || '';
      const rl = initialUser.role || 'Administrador';
      const st = initialUser.status || 'Ativo';
      const av = initialUser.avatarUrl || '';
      const sts = initialUser.setores || [];

      setNome(n);
      setCpf(c);
      setEmail(e);
      setCargo(cg);
      setDepartamento(dp);
      setMatricula(mt);
      setRole(rl);
      setStatus(st);
      setSetores(sts);
      setSenha('');
      setConfirmarSenha('');
      setAvatarUrl(initialUser.avatarUrl);

      initialSnapshotRef.current = buildSnapshot({
        nome: n,
        cpf: c,
        email: e,
        cargo: cg,
        departamento: dp,
        matricula: mt,
        role: rl,
        status: st,
        senha: '',
        avatarUrl: av,
        setores: [...sts].sort().join(','),
      });
    } else {
      setNome('');
      setCpf('');
      setEmail('');
      setCargo('');
      setDepartamento('');
      setMatricula('');
      setRole('');
      setStatus('Ativo');
      setSetores([]);
      setSenha('');
      setConfirmarSenha('');
      setAvatarUrl(undefined);

      initialSnapshotRef.current = buildSnapshot({
        nome: '',
        cpf: '',
        email: '',
        cargo: '',
        departamento: '',
        matricula: '',
        role: '',
        status: 'Ativo',
        senha: '',
        avatarUrl: '',
        setores: '',
      });
    }
    setFormError(null);
    setIsSubmitting(false);
  }, [initialUser, isOpen]);

  const currentSnapshot = buildSnapshot({
    nome,
    cpf,
    email,
    cargo,
    departamento,
    matricula,
    role,
    status,
    senha,
    avatarUrl: avatarUrl || '',
    setores: [...setores].sort().join(','),
  });

  // Verificar se há alterações não salvas comparado ao snapshot inicial carregado
  const hasUnsavedChanges = Boolean(
    initialSnapshotRef.current && currentSnapshot !== initialSnapshotRef.current
  );

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
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('O arquivo selecionado excede o limite máximo de 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    // Regra 1: Confirmar antes de descartar se houver alterações usando o diálogo do sistema
    if (hasUnsavedChanges) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Regra 2: Bloquear múltiplos cliques
    if (isSubmitting) return;

    setFormError(null);

    // Validações básicas de campos obrigatórios
    if (!nome.trim() || !email.trim() || !cargo.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios marcados com (*).');
      return;
    }

    if (!role) {
      setFormError('Por favor, selecione o perfil de acesso do colaborador.');
      return;
    }

    // Regra 3: Impedir cadastros duplicados (E-mail e CPF)
    const normalizedEmail = email.trim().toLowerCase();
    const isEmailDuplicate = users.some(
      (u) => u.email.toLowerCase() === normalizedEmail && u.id !== initialUser?.id
    );
    if (isEmailDuplicate) {
      setFormError('Já existe um usuário cadastrado com este e-mail institucional.');
      return;
    }

    const cleanCpf = cpf.trim();
    if (cleanCpf) {
      const isCpfDuplicate = users.some(
        (u) => u.cpf && u.cpf.trim() === cleanCpf && u.id !== initialUser?.id
      );
      if (isCpfDuplicate) {
        setFormError('Já existe um usuário cadastrado com este CPF.');
        return;
      }
    }

    // Regra 3: Confirmar senha quando necessário
    if (!initialUser && !senha) {
      setFormError('A senha inicial de acesso é obrigatória para novos usuários.');
      return;
    }

    if (senha) {
      if (senha.length < 4) {
        setFormError('A senha deve conter no mínimo 4 caracteres.');
        return;
      }
      if (senha !== confirmarSenha) {
        setFormError('A confirmação da senha não confere com a senha informada. Verifique os campos.');
        return;
      }
    }

    // Regra 2: Exibir estado de processamento e bloquear cliques repetidos
    setIsSubmitting(true);

    try {
      onSave({
        nome: nome.trim(),
        cpf: cleanCpf || undefined,
        email: normalizedEmail,
        cargo: cargo.trim(),
        departamento: departamento.trim() || undefined,
        matricula: matricula.trim() || undefined,
        role: role as UserRole,
        status,
        senha: senha || undefined,
        avatarUrl,
        setores,
      });
      onClose();
    } catch {
      // Regra 2: Restaurar o botão em caso de erro e preservar os dados preenchidos
      setFormError('Ocorreu um erro ao salvar o usuário. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialUser ? 'Editar Usuário do Sistema' : 'Cadastrar Novo Usuário'}
      subtitle={initialUser ? 'Atualize as credenciais e permissões' : 'Preencha os dados e perfil de acesso do colaborador'}
      maxWidth="lg"
      hasUnsavedChanges={hasUnsavedChanges}
      confirmCloseMessage="Você possui alterações não salvas no usuário. Deseja realmente descartar os dados e sair?"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Alerta de Erro com Dados Preservados */}
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Atenção: </span>
              {formError}
            </div>
          </div>
        )}

        {/* Foto de Avatar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Foto de Perfil / Avatar
          </label>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs flex items-center justify-center text-slate-400">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8" />
                )}
              </div>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs hover:bg-rose-700 transition-colors"
                  title="Remover foto de perfil"
                  aria-label="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
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
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  {avatarUrl ? 'Alterar Imagem' : 'Selecionar Imagem'}
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg shadow-2xs hover:bg-rose-100 hover:text-rose-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Remover Foto
                  </button>
                )}
              </div>
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
              onChange={(e) => {
                setNome(e.target.value);
                setFormError(null);
              }}
              placeholder="Nome do colaborador"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              CPF
            </label>
            <input
              type="text"
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
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError(null);
              }}
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
              onChange={(e) => {
                setCargo(e.target.value);
                setFormError(null);
              }}
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
              required
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole);
                setFormError(null);
              }}
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                !role ? 'text-slate-400 border-slate-300' : 'text-slate-800 border-slate-300'
              }`}
            >
              <option value="" disabled className="text-slate-400">
                Selecione...
              </option>
              <option value="Administrador" className="text-slate-800">Administrador (Acesso Total)</option>
              <option value="Supervisor" className="text-slate-800">Gestor (Edição/Operação/Relatórios)</option>
              <option value="Operador" className="text-slate-800">Operacional (Cadastro/Movimentações)</option>
              <option value="Visualizador" className="text-slate-800">Visualizador (Apenas Leitura)</option>
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

        {/* Setores Responsáveis (Múltipla Seleção Dinâmica com Pesquisa) */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Setores Responsáveis
            </label>
          </div>
          <p className="text-[11px] text-slate-500">
            {role === 'Administrador'
              ? 'Como Administrador, o usuário tem acesso irrestrito a todos os setores cadastrados. Os vínculos abaixo indicam lotação referencial.'
              : 'Vincule um ou mais setores. As permissões de cadastro, edição e consulta serão restritas exclusivamente a esses setores.'}
          </p>

          <MultiSearchableSelect
            options={SETORES_SOLICITANTES}
            value={setores}
            onChange={(newSectors) => {
              setSetores(newSectors);
              setFormError(null);
            }}
            placeholder="Clique para selecionar ou digite para pesquisar setores..."
            searchPlaceholder="Pesquisar setor pericial..."
            selectAllOption={true}
          />

          {role !== '' && role !== 'Administrador' && setores.length === 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Sem setor atribuído, este colaborador ficará sem acesso operacional às requisições do sistema.
              </span>
            </div>
          )}
        </div>

        {/* Senha de Acesso e Confirmação de Senha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Senha */}
          <div>
            <div className="flex items-center justify-between h-5 mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {initialUser ? 'Nova Senha' : 'Senha de Acesso'} {!initialUser ? <span className="text-rose-500">*</span> : <span className="text-[10px] font-normal text-slate-400">(opcional)</span>}
              </label>
            </div>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                required={!initialUser}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setFormError(null);
                }}
                placeholder={initialUser ? 'Deixe em branco para manter' : 'Senha inicial de login'}
                className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <div className="flex items-center justify-between h-5 mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Confirmar Senha {(!initialUser || senha) ? <span className="text-rose-500">*</span> : ''}
              </label>
            </div>
            <div className="relative">
              <input
                type={showConfirmarSenha ? 'text' : 'password'}
                required={Boolean(!initialUser || senha)}
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  setFormError(null);
                }}
                placeholder={initialUser ? 'Repita a nova senha digitada' : 'Repita a senha digitada'}
                className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showConfirmarSenha ? 'Ocultar confirmação' : 'Ver confirmação'}
              >
                {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Usuário</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmação personalizada do sistema para descartar alterações não salvas */}
      <ConfirmDialog
        isOpen={isConfirmDiscardOpen}
        onClose={() => setIsConfirmDiscardOpen(false)}
        onConfirm={() => {
          setIsConfirmDiscardOpen(false);
          onClose();
        }}
        title="Descartar Alterações?"
        message="Você possui alterações não salvas no usuário. Deseja realmente descartar os dados e sair?"
        confirmLabel="Descartar e Sair"
        cancelLabel="Continuar Editando"
        isDestructive
        iconType="warning"
        zIndex="z-[70]"
      />
    </Modal>
  );
};
