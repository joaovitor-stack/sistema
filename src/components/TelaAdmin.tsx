import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Edit, Search, ShieldCheck, Users, Eye, Clock, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../types';

// Centralização da URL da sua API
const API_URL = "http://localhost:3333/api";

interface TelaAdminProps {
  onVoltar: () => void;
}

const roleLabels: Record<UserRole, string> = {
  'admin': 'Administrador',
  'escalante': 'Escalante',
  'recursos-humanos': 'Recursos Humanos',
  'plantao': 'Plantão',
  'escalante_extra': 'Escalante Extra'
};

export function TelaAdmin({ onVoltar }: TelaAdminProps) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [rolesDisponiveis, setRolesDisponiveis] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoRole, setNovoRole] = useState<string>(''); 
  const [novaSenha, setNovaSenha] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Carrega usuários e cargos da nossa API Node.js
      const [resUsers, resRoles] = await Promise.all([
        fetch(`${API_URL}/usuarios`),
        fetch(`${API_URL}/usuarios/roles`)
      ]);

      const users = await resUsers.json();
      const roles = await resRoles.json();

      if (roles) {
        setRolesDisponiveis(roles);
        // Define RH como padrão se nada estiver selecionado
        const rhRole = roles.find((r: any) => r.codigo === 'recursos-humanos');
        if (rhRole && !novoRole) setNovoRole(rhRole.id);
      }
      if (users) setUsuarios(users);
    } catch (error) {
      toast.error("Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  }

  const limparFormulario = () => {
    setNovoNome('');
    setNovoEmail('');
    setNovaSenha('');
    setEditandoId(null);
  };

  const handleSalvarUsuario = async () => {
    if (!novoNome || !novoEmail || (!editandoId && !novaSenha)) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId, // Se houver ID, o backend faz update. Se não, faz create.
          nome: novoNome,
          email: novoEmail,
          role_id: novoRole,
          senha: novaSenha
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar");

      toast.success(editandoId ? "Usuário atualizado!" : "Usuário criado!");
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarEdicao = (user: any) => {
    setEditandoId(user.id);
    setNovoNome(user.nome);
    setNovoEmail(user.email);
    setNovoRole(user.role_id);
    setNovaSenha('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirUsuario = async (id: string) => {
    if (!confirm("Deseja remover este acesso permanentemente?")) return;
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Erro ao excluir usuário");
      
      toast.success("Usuário removido");
      carregarDados();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Administração de Usuários</h1>
            <p className="text-slate-500">Gestão Max Tour</p>
          </div>
          <Button variant="outline" onClick={onVoltar} className="bg-white border-slate-300">Voltar</Button>
        </div>

        {/* NÍVEIS DE ACESSO */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-slate-400" /> Níveis de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-purple-700 font-bold mb-1"><ShieldCheck className="size-4" /> Admin</div>
              <p className="text-[10px] text-purple-600/80 font-medium">Acesso total</p>
            </div>
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-1"><Users className="size-4" /> Escalante</div>
              <p className="text-[10px] text-blue-600/80 font-medium">Gestão completa de escalas</p>
            </div>
            <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-orange-700 font-bold mb-1"><PlusCircle className="size-4" /> Extra</div>
              <p className="text-[10px] text-orange-600/80 font-medium">Viagens extras</p>
            </div>
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-1"><Clock className="size-4" /> Plantão</div>
              <p className="text-[10px] text-amber-600/80 font-medium">Visualização</p>
            </div>
            <div className="p-4 rounded-xl border border-green-100 bg-green-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-1"><Eye className="size-4" /> RH</div>
              <p className="text-[10px] text-green-600/80 font-medium">Gestão de Folgas</p>
            </div>
          </CardContent>
        </Card>

        {/* FORMULÁRIO */}
        <Card className="border-slate-200 shadow-sm border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {editandoId ? 'Editando Usuário' : 'Criar Novo Usuário'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do usuário" className="bg-white border-slate-300" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <Input value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="usuario@maxtour.com" className="bg-white border-slate-300" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nível de Acesso</label>
                <Select value={novoRole} onValueChange={setNovoRole}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {rolesDisponiveis.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {roleLabels[role.codigo as UserRole] || role.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Senha {editandoId && "(vazio para manter)"}</label>
                <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="********" className="bg-white border-slate-300" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSalvarUsuario} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8 font-bold text-white">
                {loading && <Loader2 className="animate-spin mr-2 size-4" />}
                {editandoId ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
              <Button onClick={limparFormulario} variant="outline" className="bg-white border-slate-300">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TABELA */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b bg-white/50">
            <CardTitle className="text-base font-bold">Usuários do Sistema</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Pesquisar..." className="pl-10 bg-white border-slate-300" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold px-6">Nome</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold text-center">Nível</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right font-bold px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 bg-white">
                  <TableCell className="font-medium px-6">{user.nome}</TableCell>
                  <TableCell className="text-slate-500">{user.email}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold border uppercase ${
                      user.roles_usuario?.codigo === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                      user.roles_usuario?.codigo === 'escalante' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      user.roles_usuario?.codigo === 'escalante_extra' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      user.roles_usuario?.codigo === 'plantao' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {roleLabels[user.roles_usuario?.codigo as UserRole] || user.roles_usuario?.codigo}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 font-bold text-[10px] flex items-center justify-center gap-1">
                      <div className="size-1.5 bg-green-600 rounded-full" /> Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleIniciarEdicao(user)} className="bg-white border-slate-200 text-slate-700 h-8 font-bold">
                        <Edit className="size-3.5 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExcluirUsuario(user.id)} className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 h-8 font-bold">
                        <Trash2 className="size-3.5 mr-1" /> Deletar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}