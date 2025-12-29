export type UserRole = 
  | 'admin' 
  | 'escalante' 
  | 'recursos-humanos' 
  | 'plantao'          // Novo nível: Apenas visualização e folgas
  | 'escalante_extra'; // Novo nível: Gestão de viagens extras

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
}

export interface LinhaEscala {
  id: string;
  nomeMotorista: string;
  cliente: string;
  sentido: string;
  turno: string;
  inicio: string;
  descricao: string;
  fim: string;
  linha: string;
  tipo: string;
  carro: string;
  deslocamentoInicial: string;
  deslocamentoFinal: string;
  numeroRegistro: string;
  duracao?: string; // Adicionado como opcional para suporte ao cálculo de jornada
}

export interface Escala {
  id: string;
  dataLancamento: string; // Formato DD/MM/AAAA (data que foi salva)
  garagem: string;
  escalaDoDia: string;    // Formato DD/MM/AAAA (data da escala em si)
  qualDia: string;        // Ex: Segunda-feira
  dataCriacao?: string;   // Mapeado para compatibilidade com o componente VisualizarEscala
  diaSemana?: string;     // Mapeado para compatibilidade com o componente VisualizarEscala
  horaCriacao?: string;   // Horário do log de salvamento
  linhas: LinhaEscala[];
}

export interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  ativo: boolean;
}

// Interface para a futura tela de folgas (conforme solicitado para o nível Plantão)
export interface Folga {
  id: string;
  motoristaId: string;
  nomeMotorista: string;
  dataInicio: string;
  dataFim: string;
  tipoFolga: 'Folga' | 'Férias' | 'Atestado' | 'Licença';
  observacao?: string;
}