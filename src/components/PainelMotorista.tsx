import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Loader2, Calendar, Bus, ChevronDown, Clock, MapPin } from "lucide-react";

// --- Interfaces ---
interface ViagemPainel {
  id: string;
  motorista_id: string;
  cliente: string;
  linha: string;
  descricao: string;
  turno_codigo: string;
  inicio: string | null;
  fim: string | null;
  deslocamento_inicial: string | null;
  deslocamento_final: string | null;
  duracao: string;
  carro: string;
  escalas?: { data_escala: string } | null;
}

interface FolgaPainel {
  id: string;
  motorista_id: string;
  data: string;
  observacao: string | null;
}

interface ItinerarioPainel {
  id: string;
  linha_id: string;
  nome_linha: string; 
  ordem: number;
  descricao: string; 
  ponto: string;     
  horario: string;
}

interface PainelData {
  motorista: {
    id: string;
    nome: string;
    numero_registro: string;
  };
  viagens: ViagemPainel[];
  folgas: FolgaPainel[];
  itinerarios: ItinerarioPainel[];
}

export default function PainelMotorista() {
  const [re, setRe] = useState("");
  const [painelData, setPainelData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"escala" | "folgas" | "itinerarios">("escala");

  const buscarPainel = async () => {
    if (!re) {
      setErro("Informe o número de registro (RE)");
      return;
    }
    setErro(null);
    setLoading(true);
    try {
      const resp = await fetch(`/api/painelmotorista?re=${encodeURIComponent(re)}`);
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.message || "Erro ao buscar painel");
      }
      const data = (await resp.json()) as PainelData;
      setPainelData(data);
      setActiveTab("escala");
    } catch (err: any) {
      setErro(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  // --- Renderização da Escala (Correção de Data Literal) ---
  const renderEscala = () => {
    if (!painelData || painelData.viagens.length === 0) {
      return <p className="text-sm text-slate-500 p-4 text-center">Nenhuma viagem encontrada.</p>;
    }

    const viagensPorData = painelData.viagens.reduce((acc, v) => {
      const d = v.escalas?.data_escala || "Sem data";
      if (!acc[d]) acc[d] = [];
      acc[d].push(v);
      return acc;
    }, {} as Record<string, ViagemPainel[]>);

    return (
      <div className="space-y-3">
        {Object.entries(viagensPorData).map(([dataStr, lista]) => (
          <details key={dataStr} className="group border rounded-lg bg-white shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 list-none bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                {/* TRATAMENTO DE DATA SEGURO PARA PRODUÇÃO: Sem conversão de fuso */}
                {dataStr !== "Sem data" 
                  ? dataStr.split('-').reverse().join('/') 
                  : dataStr}
              </div>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
            </summary>
            
            <div className="p-2 bg-slate-50 border-t space-y-2">
              {lista.map((v) => (
                <div key={v.id} className="p-3 bg-white border rounded shadow-sm">
                  <div className="flex justify-between font-bold text-blue-800 border-b pb-2 mb-2">
                    <span className="text-sm flex-1 mr-2">{v.linha}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center h-fit whitespace-nowrap">
                        {v.inicio} - {v.fim}
                    </span>
                  </div>

                  {/* Área de Deslocamentos Adicionada */}
                  {(v.deslocamento_inicial || v.deslocamento_final) && (
                    <div className="flex gap-2 mb-3 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                       {v.deslocamento_inicial && (
                         <div className="flex-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Desl. Inicial</span>
                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                               <MapPin className="w-3 h-3 text-green-600" /> {v.deslocamento_inicial}
                            </div>
                         </div>
                       )}
                       {v.deslocamento_final && (
                         <div className="flex-1 border-l pl-2 border-slate-200">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Desl. Final</span>
                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                               <MapPin className="w-3 h-3 text-red-500" /> {v.deslocamento_final}
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  <div className="text-xs space-y-1 text-slate-600">
                    <p><b>Cliente:</b> {v.cliente}</p>
                    <p><b>Descrição:</b> {v.descricao}</p>
                    
                    <div className="flex justify-between pt-2 mt-2 border-t border-dashed border-slate-200">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">Carro: {v.carro}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">Turno: {v.turno_codigo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    );
  };

  // --- Renderização de Folgas (Correção de Data Literal) ---
  const renderFolgas = () => {
    if (!painelData || painelData.folgas.length === 0) {
      return <p className="text-sm text-slate-500 p-4 text-center">Nenhuma folga encontrada.</p>;
    }
    return (
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Observação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {painelData.folgas.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium">
                {/* TRATAMENTO DE DATA SEGURO PARA PRODUÇÃO: Ignora o timezone do navegador */}
                {f.data.split('-').reverse().join('/')}
              </TableCell>
              <TableCell>{f.observacao ?? "---"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // --- Renderização de Itinerários ---
  const renderItinerarios = () => {
    if (!painelData || painelData.itinerarios.length === 0) {
      return <p className="text-sm text-slate-500 p-4 text-center">Nenhum itinerário encontrado.</p>;
    }

    const itinerariosPorLinha = painelData.itinerarios.reduce((acc, it) => {
      const chave = it.nome_linha || it.linha_id;
      if (!acc[chave]) acc[chave] = [];
      acc[chave].push(it);
      return acc;
    }, {} as Record<string, ItinerarioPainel[]>);

    return (
      <div className="space-y-3">
        {Object.entries(itinerariosPorLinha).map(([linha, pontos]) => (
          <details key={linha} className="group border rounded-lg bg-white shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 list-none bg-blue-50/20">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm uppercase">
                <Bus className="w-4 h-4 text-blue-600" />
                {linha}
              </div>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-blue-400" />
            </summary>
            <div className="border-t">
              <Table>
                <TableBody>
                  {pontos.sort((a,b) => a.ordem - b.ordem).map((p) => (
                    <TableRow key={p.id} className="border-b last:border-0">
                      <TableCell className="w-[85px] align-top py-3">
                         <div className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs w-fit">
                            <Clock className="w-3 h-3" />
                            {p.horario}
                         </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-slate-800 text-sm uppercase">{p.ponto}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.descricao}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen pb-10 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
        <Bus className="text-blue-600" /> Painel do Motorista
      </h1>

      <Card className="mb-4 shadow-sm border-blue-100">
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Registro (RE)</label>
            <div className="flex gap-2">
              <Input
                value={re}
                onChange={(e) => setRe(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && buscarPainel()}
                placeholder="Ex: 1234"
                className="bg-white"
              />
              <Button onClick={buscarPainel} disabled={loading} className="bg-blue-600">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Buscar"}
              </Button>
            </div>
          </div>
          {erro && <p className="text-red-600 text-xs font-medium">{erro}</p>}
        </CardContent>
      </Card>

      {painelData && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <Card className="mb-4 border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-md flex justify-between items-center">
                <span>{painelData.motorista.nome}</span>
                <span className="text-slate-400 text-xs font-normal">RE: {painelData.motorista.numero_registro}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-3 gap-1 mb-4">
            <Button
              variant={activeTab === "escala" ? "default" : "outline"}
              className="text-xs h-9 px-0 rounded-r-none"
              onClick={() => setActiveTab("escala")}
            >
              Escala
            </Button>
            <Button
              variant={activeTab === "folgas" ? "default" : "outline"}
              className="text-xs h-9 px-0 rounded-none border-x-0"
              onClick={() => setActiveTab("folgas")}
            >
              Folgas
            </Button>
            <Button
              variant={activeTab === "itinerarios" ? "default" : "outline"}
              className="text-xs h-9 px-0 rounded-l-none"
              onClick={() => setActiveTab("itinerarios")}
            >
              Itinerário
            </Button>
          </div>

          <div className="pb-8">
            {activeTab === "escala" && renderEscala()}
            {activeTab === "folgas" && renderFolgas()}
            {activeTab === "itinerarios" && renderItinerarios()}
          </div>
        </div>
      )}
    </div>
  );
}