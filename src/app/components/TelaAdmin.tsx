import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { UserPlus, Trash2, Edit, Search, Shield, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'escalante' | 'recursos-humanos';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
}

interface TelaAdminProps {
  onVoltar: () => void;
}

const roleLabels: Record<UserRole, string> = {
  'admin': 'Administrador',
  'escalante': 'Escalante',
  'recursos-humanos': 'Recursos Humanos'
};

const roleDescriptions: Record<UserRole, string> = {
  'admin': 'Acesso total a todas funcionalidades',
  'escalante': 'Pode criar, apagar, editar e duplicar escalas',
  'recursos-humanos': 'Acesso somente para visualização de escalas'
};

export function TelaAdmin({ onVoltar }: TelaAdminProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      nome: 'Admin Sistema',
      email: 'admin@maxtour.com',
      role: 'admin',
      ativo: true
    },
    {
      id: '2',
      nome: 'João Escalante',
      email: 'joao@maxtour.com',
      role: 'escalante',
      ativo: true
    },
    {
      id: '3',
      nome: 'Maria RH',
      email: 'maria@maxtour.com',
      role: 'recursos-humanos',
      ativo: true
    }
  ]);

  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<string | null>(null);

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('recursos-humanos');
  const [formSenha, setFormSenha] = useState('');

  const handleCriarUsuario = () => {
    if (!formNome || !formEmail || !formRole || !formSenha) {
      toast.error('Preencha todos os campos');
      return;
    }

    const novoUsuario: Usuario = {
      id: Date.now().toString(),
      nome: formNome,
      email: formEmail,
      role: formRole,
      ativo: true
    };

    setUsuarios([...usuarios, novoUsuario]);
    toast.success('Usuário criado com sucesso!');
    resetForm();
  };

  const handleEditarUsuario = () => {
    if (!formNome || !formEmail || !formRole || !usuarioEditando) {
      toast.error('Preencha todos os campos');
      return;
    }

    setUsuarios(usuarios.map(u => 
      u.id === usuarioEditando 
        ? { ...u, nome: formNome, email: formEmail, role: formRole }
        : u
    ));
    toast.success('Usuário atualizado com sucesso!');
    resetForm();
  };

  const handleDeletarUsuario = (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario?.role === 'admin' && usuarios.filter(u => u.role === 'admin').length === 1) {
      toast.error('Não é possível deletar o último administrador');
      return;
    }

    setUsuarios(usuarios.filter(u => u.id !== id));
    toast.success('Usuário deletado com sucesso!');
  };

  const handleToggleStatus = (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario?.role === 'admin' && usuario.ativo && usuarios.filter(u => u.role === 'admin' && u.ativo).length === 1) {
      toast.error('Não é possível desativar o último administrador ativo');
      return;
    }

    setUsuarios(usuarios.map(u => 
      u.id === id ? { ...u, ativo: !u.ativo } : u
    ));
    toast.success('Status atualizado com sucesso!');
  };

  const startEdit = (usuario: Usuario) => {
    setUsuarioEditando(usuario.id);
    setFormNome(usuario.nome);
    setFormEmail(usuario.email);
    setFormRole(usuario.role);
    setFormSenha('');
    setMostrarFormulario(true);
  };

  const resetForm = () => {
    setFormNome('');
    setFormEmail('');
    setFormRole('recursos-humanos');
    setFormSenha('');
    setMostrarFormulario(false);
    setUsuarioEditando(null);
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    usuario.email.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    roleLabels[usuario.role].toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl mb-1">Administração de Usuários</h1>
            <p className="text-sm text-gray-600">Gerencie usuários e permissões do sistema</p>
          </div>
          <Button variant="outline" onClick={onVoltar}>
            Voltar
          </Button>
        </div>

        {/* Legenda de Permissões */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              Níveis de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Shield className="size-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900">Administrador</p>
                  <p className="text-sm text-purple-700">{roleDescriptions.admin}</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Users className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Escalante</p>
                  <p className="text-sm text-blue-700">{roleDescriptions.escalante}</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Eye className="size-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Recursos Humanos</p>
                  <p className="text-sm text-green-700">{roleDescriptions['recursos-humanos']}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Criar/Editar */}
        {mostrarFormulario && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{usuarioEditando ? 'Editar Usuário' : 'Criar Novo Usuário'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="usuario@maxtour.com"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Select value={formRole} onValueChange={(value) => setFormRole(value as UserRole)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="escalante">Escalante</SelectItem>
                      <SelectItem value="recursos-humanos">Recursos Humanos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="senha">{usuarioEditando ? 'Nova Senha (opcional)' : 'Senha'}</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={usuarioEditando ? handleEditarUsuario : handleCriarUsuario}>
                  {usuarioEditando ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Usuários do Sistema</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 w-80">
                  <Search className="size-4 text-gray-500" />
                  <Input
                    placeholder="Pesquisar usuários..."
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {!mostrarFormulario && (
                  <Button onClick={() => setMostrarFormulario(true)} className="gap-2">
                    <UserPlus className="size-4" />
                    Novo Usuário
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      {termoPesquisa ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                          usuario.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          usuario.role === 'escalante' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {usuario.role === 'admin' && <Shield className="size-3" />}
                          {usuario.role === 'escalante' && <Users className="size-3" />}
                          {usuario.role === 'recursos-humanos' && <Eye className="size-3" />}
                          {roleLabels[usuario.role]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(usuario.id)}
                          className={usuario.ativo ? 'text-green-600' : 'text-gray-400'}
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(usuario)}
                            className="gap-1"
                          >
                            <Edit className="size-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletarUsuario(usuario.id)}
                            className="gap-1"
                          >
                            <Trash2 className="size-4" />
                            Deletar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
