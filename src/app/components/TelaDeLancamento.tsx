import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Pencil, Trash2, Plus, Copy, Search, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { CriarNovaEscala } from './CriarNovaEscala';
import { EditarEscala } from './EditarEscala';
import { VisualizarEscala } from './VisualizarEscala';
import { TelaAdmin, type UserRole } from './TelaAdmin';

interface Escala {
  id: string;
  dataLancamento: string;
  garagem: string;
  escalaDoDia: string;
  qualDia: string;
}

interface TelaDeLancamentoProps {
  userName: string;
  userRole: UserRole;
}

export function TelaDeLancamento({ userName, userRole }: TelaDeLancamentoProps) {
  const [escalas, setEscalas] = useState<Escala[]>([
    {
      id: '1',
      dataLancamento: '15/12/2024',
      garagem: 'Garagem Central',
      escalaDoDia: '21/12/2024',
      qualDia: 'Segunda-feira'
    },
    {
      id: '2',
      dataLancamento: '16/12/2024',
      garagem: 'Garagem Norte',
      escalaDoDia: '22/12/2024',
      qualDia: 'Terça-feira'
    },
    {
      id: '3',
      dataLancamento: '17/12/2024',
      garagem: 'Garagem Sul',
      escalaDoDia: '23/12/2024',
      qualDia: 'Quarta-feira'
    }
  ]);
  const [mostrarCriarEscala, setMostrarCriarEscala] = useState(false);
  const [escalaEditando, setEscalaEditando] = useState<string | null>(null);
  const [escalaVisualizando, setEscalaVisualizando] = useState<string | null>(null);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Verificar permissões
  const podeEditar = userRole === 'admin' || userRole === 'escalante';
  const podeApagar = userRole === 'admin' || userRole === 'escalante';
  const podeCriar = userRole === 'admin' || userRole === 'escalante';
  const podeDuplicar = userRole === 'admin' || userRole === 'escalante';
  const isAdmin = userRole === 'admin';

  const handleDelete = (id: string) => {
    if (!podeApagar) {
      toast.error('Você não tem permissão para apagar escalas');
      return;
    }
    setEscalas(escalas.filter(escala => escala.id !== id));
    toast.success('Escala deletada com sucesso!');
  };

  const handleEdit = (id: string) => {
    if (!podeEditar) {
      toast.error('Você não tem permissão para editar escalas');
      return;
    }
    setEscalaEditando(id);
  };

  const handleView = (id: string) => {
    setEscalaVisualizando(id);
  };

  const handleDuplicate = (id: string) => {
    if (!podeDuplicar) {
      toast.error('Você não tem permissão para duplicar escalas');
      return;
    }
    const escalaOriginal = escalas.find(e => e.id === id);
    if (escalaOriginal) {
      const hoje = new Date();
      const escalaDuplicada: Escala = {
        ...escalaOriginal,
        id: Date.now().toString(),
        dataLancamento: hoje.toLocaleDateString('pt-BR'),
      };
      setEscalas([escalaDuplicada, ...escalas]);
      toast.success('Escala duplicada com sucesso!');
    }
  };

  const handleCreateNew = () => {
    if (!podeCriar) {
      toast.error('Você não tem permissão para criar escalas');
      return;
    }
    setMostrarCriarEscala(true);
  };

  const handleSaveEscala = (linhas: any[]) => {
    const hoje = new Date();
    const novaEscala: Escala = {
      id: Date.now().toString(),
      dataLancamento: hoje.toLocaleDateString('pt-BR'),
      garagem: 'Garagem Central', // Pode ser adicionado como campo no formulário
      escalaDoDia: hoje.toLocaleDateString('pt-BR'),
      qualDia: hoje.toLocaleDateString('pt-BR', { weekday: 'long' })
    };
    setEscalas([novaEscala, ...escalas]);
    setMostrarCriarEscala(false);
  };

  const handleSaveEditEscala = (linhas: any[]) => {
    // Atualizar a escala
    setEscalaEditando(null);
  };

  const handleCancelEscala = () => {
    setMostrarCriarEscala(false);
  };

  const handleCancelEditEscala = () => {
    setEscalaEditando(null);
  };

  const handleVoltarVisualizacao = () => {
    setEscalaVisualizando(null);
  };

  // Filtrar escalas com base no termo de pesquisa
  const escalasFiltradas = escalas.filter(escala =>
    escala.dataLancamento.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    escala.garagem.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    escala.escalaDoDia.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    escala.qualDia.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  if (mostrarAdmin) {
    return <TelaAdmin onVoltar={() => setMostrarAdmin(false)} />;
  }

  if (escalaVisualizando) {
    return <VisualizarEscala escalaId={escalaVisualizando} onVoltar={handleVoltarVisualizacao} />;
  }

  if (escalaEditando) {
    return <EditarEscala escalaId={escalaEditando} onSave={handleSaveEditEscala} onCancel={handleCancelEditEscala} />;
  }

  if (mostrarCriarEscala) {
    return <CriarNovaEscala onSave={handleSaveEscala} onCancel={handleCancelEscala} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Usuário logado:</p>
            <p className="text-lg">{userName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {userRole === 'admin' ? 'Administrador' : 
               userRole === 'escalante' ? 'Escalante' : 
               'Recursos Humanos'}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => setMostrarAdmin(true)} variant="outline" className="gap-2">
                <Settings className="size-4" />
                Administração
              </Button>
            )}
            {podeCriar && (
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="size-4" />
                Criar Nova Escala
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Escalas</CardTitle>
              <div className="flex items-center gap-2 w-80">
                <Search className="size-4 text-gray-500" />
                <Input
                  placeholder="Pesquisar escalas..."
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Lançamento</TableHead>
                  <TableHead>Garagem</TableHead>
                  <TableHead>Escala do Dia</TableHead>
                  <TableHead>Qual Dia</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      {termoPesquisa ? 'Nenhuma escala encontrada' : 'Nenhuma escala lançada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  escalasFiltradas.map((escala) => (
                    <TableRow key={escala.id}>
                      <TableCell>{escala.dataLancamento}</TableCell>
                      <TableCell>{escala.garagem}</TableCell>
                      <TableCell>{escala.escalaDoDia}</TableCell>
                      <TableCell>{escala.qualDia}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(escala.id)}
                            className="gap-1"
                          >
                            <Eye className="size-4" />
                            Visualizar
                          </Button>
                          {podeEditar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(escala.id)}
                              className="gap-1"
                            >
                              <Pencil className="size-4" />
                              Editar
                            </Button>
                          )}
                          {podeDuplicar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicate(escala.id)}
                              className="gap-1"
                            >
                              <Copy className="size-4" />
                              Duplicar
                            </Button>
                          )}
                          {podeApagar && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(escala.id)}
                              className="gap-1"
                            >
                              <Trash2 className="size-4" />
                              Deletar
                            </Button>
                          )}
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