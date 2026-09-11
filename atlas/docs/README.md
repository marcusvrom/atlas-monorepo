# Documentação — Atlas

## Ordem de leitura

| # | Documento | Para quê |
|---|---|---|
| 1 | [`agent/AGENTS.md`](agent/AGENTS.md) | **Normativo.** Regras para gerar código aqui |
| 2 | [`specs/00-produto-e-dominio.md`](specs/00-produto-e-dominio.md) | Produto, personas, freemium, domínio, backend, custo |
| 3 | [`specs/10-arquitetura-mobile.md`](specs/10-arquitetura-mobile.md) | Stack, camadas, orçamento de performance |
| 4 | [`specs/11-design-system-liquid-glass.md`](specs/11-design-system-liquid-glass.md) | Onde usar vidro, fallback, acessibilidade |
| 5 | [`specs/12-estrategia-mock-first.md`](specs/12-estrategia-mock-first.md) | **Ponto de atenção.** Como o mock não vira desperdício |
| 6 | [`specs/13-mapa-de-navegacao.md`](specs/13-mapa-de-navegacao.md) | Rotas, telas prioritárias, estados obrigatórios |
| 7 | [`specs/30-contrato-de-integracao.md`](specs/30-contrato-de-integracao.md) | Ports, erros, paginação, evolução de contrato |
| 8 | [`adr/`](adr/) | Decisões e trade-offs aceitos |
| 9 | [`agent/task-specs/`](agent/task-specs/) | Unidades de trabalho executáveis |

## Convenção

- **Spec** responde "o quê" e "sob quais restrições".
- **ADR** responde "por quê" e "o que aceitamos perder".
- **Task-spec** responde "o que entregar nesta unidade de trabalho, e como saber
  que está pronto".

Quando um agente precisa de contexto, ele lê a task-spec; quando precisa
entender uma restrição estranha, ele lê o ADR referenciado. Nenhum dos dois é
opcional.
