import { User } from '../types/user';

export const MOCK_USERS: User[] = [
  {
    id: 'user-admin-1',
    nome: 'Dra. Helena Souza',
    email: 'helena.souza@prazojus.demo',
    cargo: 'Diretora do Núcleo de Perícias & Admin',
    departamento: 'Diretoria Técnico-Científica',
    matricula: 'PJ-00192',
    role: 'Administrador',
  },
  {
    id: 'user-supervisor-2',
    nome: 'Dr. Carlos Menezes',
    email: 'carlos.menezes@prazojus.demo',
    cargo: 'Perito Criminal Supervisor de Seção',
    departamento: 'Seção de Exames Balísticos e Digitais',
    matricula: 'PJ-04812',
    role: 'Supervisor',
  },
  {
    id: 'user-operator-3',
    nome: 'Lucas Silveira',
    email: 'lucas.silveira@prazojus.demo',
    cargo: 'Técnico Pericial / Operador de Prazos',
    departamento: 'Protocolo e Recepção de Peças',
    matricula: 'PJ-10943',
    role: 'Operador',
  },
];
