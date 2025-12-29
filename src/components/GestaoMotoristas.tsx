import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Save, Plus, Trash2, ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Motorista {
  id: string;
  nome: string;
  numeroRegistro: string;
  categoria: string;
  garagem: string;
}

interface GestaoMotoristasProps {
  onBack: () => void;
}

export function GestaoMotoristas({ onBack }: GestaoMotoristasProps) {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);

  // Carregar dados ao iniciar
  useEffect(() => {
    const salvos = JSON.parse(localStorage.getItem('maxtour_motoristas') || '[]');
    setMotoristas(salvos);
  }, []);

  const handleAddMotorista = () => {
    const novo: Motorista = {
      id: Math.random().toString(36).substr(2, 9),
      nome: '',
      numeroRegistro: '',
      categoria: '',
      garagem: ''
    };
    setMotoristas([...motoristas, novo]);
  };

  const handleUpdate = (id: string, field: keyof Motorista, value: string) => {
    setMotoristas(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleRemove = (id: string) => {
    setMotoristas(prev => prev.filter(m => m.id !== id));
  };

  const salvarNoStorage = () => {
    // Validação básica
    const invalido = motoristas.some(m => !m.nome || !m.numeroRegistro || !m.categoria || !m.garagem);
    if (invalido) {
      return toast.error("Preencha todos os campos, incluindo a garagem, antes de salvar!");
    }

    localStorage.setItem('maxtour_motoristas', JSON.stringify(motoristas));
    toast.success("Motoristas salvos com sucesso!");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="bg-white">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="text-blue-600" /> Cadastro de Motoristas
          </h1>
        </div>
        <Button onClick={salvarNoStorage} className="bg-green-600 hover:bg-green-700 text-white">
          <Save className="size-4 mr-2" /> Salvar Alterações
        </Button>
      </div>

      <Card className="shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
          <CardTitle className="text-lg text-blue-600">Lista de Colaboradores</CardTitle>
          <Button size="sm" onClick={handleAddMotorista} className="bg-blue-600 text-white">
            <Plus className="size-4 mr-1" /> Novo Motorista
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead className="w-[150px]">RE</TableHead>
                <TableHead className="w-[200px]">Garagem</TableHead>
                <TableHead className="w-[250px]">Categoria</TableHead>
                <TableHead className="w-[80px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {motoristas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                    Nenhum motorista cadastrado. Clique em "Novo Motorista".
                  </TableCell>
                </TableRow>
              ) : (
                motoristas.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Input 
                        value={m.nome || ''} 
                        onChange={e => handleUpdate(m.id, 'nome', e.target.value)}
                        placeholder="Nome do motorista"
                        className="h-9 bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={m.numeroRegistro || ''} 
                        onChange={e => handleUpdate(m.id, 'numeroRegistro', e.target.value)}
                        placeholder="Ex: 12345"
                        className="h-9 bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={m.garagem || ''} 
                        onValueChange={val => handleUpdate(m.id, 'garagem', val)}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Garagem" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Extrema">Extrema</SelectItem>
                          <SelectItem value="Bragança Paulista">Bragança Paulista</SelectItem>
                          <SelectItem value="Cambuí">Cambuí - Camanducaia</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={m.categoria || ''} 
                        onValueChange={val => handleUpdate(m.id, 'categoria', val)}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="MOTORISTA ÔNIBUS">MOTORISTA ÔNIBUS</SelectItem>
                          <SelectItem value="MOTORISTA MICRO ÔNIBUS">MOTORISTA MICRO ÔNIBUS</SelectItem>
                          <SelectItem value="MOTORISTA VAN">MOTORISTA VAN</SelectItem>
                          <SelectItem value="MOTORISTA CATEGORIA B">MOTORISTA CATEGORIA B</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemove(m.id)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}