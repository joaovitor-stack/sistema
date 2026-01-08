import router from './index';

// Este arquivo reexporta o roteador principal definido em index.ts.
// Ele existe para que o server.ts possa importar "./routes" e encontrar o roteador.
export default router;