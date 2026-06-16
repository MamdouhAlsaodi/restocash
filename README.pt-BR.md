# RestoCash — Documentação em Português

**RestoCash** é um projeto de sistema POS (Ponto de Venda) para restaurantes, lanchonetes e fluxo de caixa.

A primeira versão será um aplicativo mobile para o operador de caixa, mas a arquitetura foi pensada para ser **mobile-first, não mobile-only**. Isso significa que um painel web poderá ser adicionado no futuro usando a mesma API.

---

## Por que este projeto existe?

O RestoCash foi criado como um projeto prático de aprendizado e arquitetura realista.

O objetivo é praticar conceitos importantes de desenvolvimento backend e mobile:

- Design de REST API
- Relacionamentos no banco de dados
- Autenticação com JWT
- Autorização por papéis
- Separação entre regra de negócio e interface
- Checkout seguro
- Relatórios de vendas
- Estrutura preparada para crescimento

---

## Arquitetura

```text
Mobile App agora ─┐
                  ├── REST API ── Business Logic ── PostgreSQL
Web Dashboard depois ─┘
```

O backend é a fonte da verdade.

A interface mobile pode mostrar um total preliminar, mas o cálculo oficial da venda acontece no backend.

---

## Exemplo de checkout

O app mobile envia:

```json
{
  "items": [{ "productId": "...", "quantity": 2 }],
  "paymentMethod": "PIX"
}
```

O backend então:

1. Busca os produtos no banco.
2. Usa o preço real salvo no banco.
3. Calcula subtotais e total.
4. Salva a venda.
5. Salva snapshots dos itens vendidos.

Assim, vendas antigas continuam corretas mesmo se o preço do produto mudar depois.

---

## Stack planejada

### Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT
- bcrypt
- class-validator

### Mobile

- Expo React Native
- TypeScript
- SecureStore para JWT
- Camada de API organizada

### Web no futuro

- Next.js
- TypeScript
- Mesma REST API

---

## MVP

A primeira versão terá:

- Login
- Papéis: Admin e Cashier
- Categorias
- Produtos
- Carrinho
- Checkout
- Formas de pagamento:
  - Dinheiro
  - Pix
  - Cartão de Débito
  - Cartão de Crédito
- Relatório diário de vendas

---

## Regras principais

### O backend calcula o total final

A interface não é a fonte oficial do valor da venda.

### Itens da venda salvam snapshots

Cada item vendido salva:

- Nome do produto no momento da venda
- Preço unitário no momento da venda
- Quantidade
- Subtotal

### Produtos não são removidos permanentemente

Produtos com histórico de vendas devem ser desativados com:

```text
isActive = false
```

---

## Status atual

Já existe uma fundação inicial:

- Estrutura monorepo
- Scripts na raiz
- Pacote compartilhado
- Fundação inicial da API com NestJS
- Endpoint `/api/health`
- Plano de desenvolvimento detalhado

Comandos verificados:

```bash
npm run typecheck
npm test
npm --workspace @restocash/api run build
```

Resposta do endpoint de saúde:

```json
{"status":"ok","service":"restocash-api"}
```

---

## Futuro do projeto

Possíveis próximas funcionalidades:

- Painel web administrativo
- Gestão de produtos
- Gestão de operadores de caixa
- Histórico de vendas
- Relatórios mensais
- Cancelamento de venda com motivo
- Controle de estoque
- Suporte a múltiplas unidades

---

## Filosofia

O RestoCash foi criado para ser simples no começo, mas com uma base correta para crescer.

A regra principal é: regras de negócio ficam no backend; a interface apenas consome a API.
