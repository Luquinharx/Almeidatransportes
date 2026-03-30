# Thinka

Aplicação web para gestão financeira e operacional.

## Executar localmente

1. Instalar dependências:

```bash
npm install
```

2. Iniciar ambiente de desenvolvimento:

```bash
npm run dev
```

## Firebase

Configuração principal em `src/lib/firebase.ts`.

Variáveis de ambiente em `.env` (modelo em `.env.example`).

### Firestore

Persistência principal do sistema:

- Contexto com sync Firestore + cache local: `src/contexts/FinanceContext.tsx`
- Serviço de sync: `src/services/financeFirestoreService.ts`
- Cache offline local: `src/services/financeLocalCache.ts`

Regras:

- `firestore.rules`

### Storage

O projeto usa Firebase Storage para anexos de lançamentos.

- Cliente: `src/lib/storage.ts`
- Ciclo de vida de anexos (upload/substituição/exclusão): `src/services/attachmentService.ts`
- Regras: `storage.rules`

Estrutura escalável recomendada no bucket:

- `users/{uid}/transactions/attachments/{yyyy}/{mm}/{arquivo}`
- `users/{uid}/reports/{yyyy}/{mm}/{arquivo}`
- `users/{uid}/employees/documents/{yyyy}/{mm}/{arquivo}`

### Publicação de regras do Storage

1. No Firebase Console, habilite Storage no projeto.
2. Defina a região do bucket conforme sua operação.
3. Publique as regras de `storage.rules`.

Opcional via CLI:

```bash
firebase deploy --only storage
```

### Validação backend de anexos

Cloud Function pronta para remover arquivos inválidos por tamanho/content type/extensão:

- `functions/src/index.ts`

Deploy:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Deploy de regras Firebase

```bash
firebase deploy --only firestore:rules,storage
```

## Qualidade

```bash
npm run lint
npm run test
npm run build
```
