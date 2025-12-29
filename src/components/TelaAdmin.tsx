import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Edit, Search, ShieldCheck, Users, Eye, Clock, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, Usuario } from '../types'; 

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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  
  // Estados do Formulário
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoRole, setNovoRole] = useState<UserRole>('recursos-humanos');
  const [novaSenha, setNovaSenha] = useState('');
  
  // Estado para controle de edição
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    const salvos = JSON.parse(localStorage.getItem('maxtour_usuarios') || '[]');
    setUsuarios(salvos);
  }, []);

  const limparFormulario = () => {
    setNovoNome('');
    setNovoEmail('');
    setNovoRole('recursos-humanos');
    setNovaSenha('');
    setEditandoId(null);
  };

  const handleSalvarUsuario = () => {
    if (!novoNome || !novoEmail || (!editandoId && !novaSenha)) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    let listaAtualizada;

    if (editandoId) {
      listaAtualizada = usuarios.map(u => 
        u.id === editandoId ? { ...u, nome: novoNome, email: novoEmail, role: novoRole } : u
      );
      toast.success("Usuário atualizado!");
    } else {
      const novoUsuario: Usuario = {
        id: Math.random().toString(36).substr(2, 9),
        nome: novoNome,
        email: novoEmail,
        role: novoRole,
        ativo: true
      };
      listaAtualizada = [...usuarios, novoUsuario];
      toast.success("Usuário criado com sucesso!");
    }

    setUsuarios(listaAtualizada);
    localStorage.setItem('maxtour_usuarios', JSON.stringify(listaAtualizada));
    limparFormulario();
  };

  const handleIniciarEdicao = (user: Usuario) => {
    setEditandoId(user.id);
    setNovoNome(user.nome);
    setNovoEmail(user.email);
    setNovoRole(user.role);
    setNovaSenha('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirUsuario = (id: string) => {
    if (confirm("Deseja remover este acesso permanentemente?")) {
      const novos = usuarios.filter(u => u.id !== id);
      setUsuarios(novos);
      localStorage.setItem('maxtour_usuarios', JSON.stringify(novos));
      toast.error("Usuário removido");
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) || 
    u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Administração de Usuários</h1>
            <p className="text-slate-500">Gerencie usuários e permissões do sistema</p>
          </div>
          <Button variant="outline" onClick={onVoltar} className="bg-white border-slate-300">Voltar</Button>
        </div>

        {/* NÍVEIS DE ACESSO CENTRALIZADOS */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-slate-400" /> Níveis de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-purple-700 font-bold mb-1"><ShieldCheck className="size-4" /> Admin</div>
              <p className="text-[10px] text-purple-600/80 font-medium">Acesso total a todas funcionalidades</p>
            </div>
            
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-1"><Users className="size-4" /> Escalante</div>
              <p className="text-[10px] text-blue-600/80 font-medium">Pode criar, apagar, editar e duplicar escalas</p>
            </div>

            <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-orange-700 font-bold mb-1"><PlusCircle className="size-4" /> Extra</div>
              <p className="text-[10px] text-orange-600/80 font-medium">Gestão exclusiva de viagens extras</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-1"><Clock className="size-4" /> Plantão</div>
              <p className="text-[10px] text-amber-600/80 font-medium">Visualização de escalas e gestão de folgas</p>
            </div>

            <div className="p-4 rounded-xl border border-green-100 bg-green-50/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-1"><Eye className="size-4" /> RH</div>
              <p className="text-[10px] text-green-600/80 font-medium">Visualização de escalas e gestão de folgas</p>
            </div>
          </CardContent>
        </Card>

        {/* FORMULÁRIO (CRIAR/EDITAR) */}
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
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do usuário" className="bg-white border-slate-300 shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <Input value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="usuario@maxtour.com" className="bg-white border-slate-300 shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nível de Acesso</label>
                <Select value={novoRole} onValueChange={(v: UserRole) => setNovoRole(v)}>
                  <SelectTrigger className="bg-white border-slate-300 shadow-sm text-slate-900">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="escalante">Escalante</SelectItem>
                    <SelectItem value="escalante_extra">Escalante Extra</SelectItem>
                    <SelectItem value="plantao">Plantão</SelectItem>
                    <SelectItem value="recursos-humanos">Recursos Humanos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Senha {editandoId && "(vazio para manter)"}</label>
                <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="********" className="bg-white border-slate-300 shadow-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSalvarUsuario} className="bg-blue-600 hover:bg-blue-700 px-8 font-bold">
                {editandoId ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
              <Button onClick={limparFormulario} variant="outline" className="bg-white border-slate-300">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TABELA DE USUÁRIOS */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b bg-white/50">
            <CardTitle className="text-base font-bold">Usuários do Sistema</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Pesquisar..." className="pl-10 bg-white border-slate-300 shadow-sm" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Nome</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold text-center">Nível</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 bg-white">
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell className="text-slate-500">{user.email}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold border ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                      user.role === 'escalante' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      user.role === 'escalante_extra' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      user.role === 'plantao' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {roleLabels[user.role]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 font-bold text-[10px] flex items-center justify-center gap-1">
                      <div className="size-1.5 bg-green-600 rounded-full" /> Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleIniciarEdicao(user)} className="bg-white border-slate-200 text-slate-700 h-8 font-bold shadow-sm">
                        <Edit className="size-3.5 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExcluirUsuario(user.id)} className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 h-8 font-bold shadow-sm">
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