# ADR-0014 — Camada de dados em ports & adapters

**Status:** Aceito

## Decisão

O app acessa dados exclusivamente através de **ports** (interfaces por bounded
context) implementados por dois **adapters** intercambiáveis: `mock` e `http`.
A seleção é feita uma única vez, na composição da árvore React, a partir de
`EXPO_PUBLIC_API_MODE`.

## Contexto

O projeto entrega a UI antes do backend. Sem uma fronteira formal, o resultado
previsível é: chamadas de mock espalhadas em `useEffect`, telas acopladas ao
formato do dado falso, e uma "semana de integração" que vira um mês de reescrita.

## Estrutura

```
packages/api-client/src/
├── ports/            Interfaces. Nenhuma implementação, nenhuma dependência.
├── mock/             Adapter com estado mutável em memória + fixtures
├── http/             Adapter fetch, tipos gerados do OpenAPI
└── index.ts          createApiClient({ mode, baseUrl, ... })
```

## Regras que dão validade à decisão

1. **Ambos os adapters validam a saída com o mesmo schema Zod.** Sem isso, o mock
   diverge do contrato silenciosamente e a garantia é ilusória.
2. **Ports são orientados a caso de uso, não a endpoint.** `getTodayWorkout()`,
   não `GET /workout-plans?active=true`. O backend pode agregar chamadas depois
   sem quebrar a UI.
3. **Adapter incompleto lança `NotImplementedError`.** Nunca retorna `undefined`
   ou dado parcial — falha ruidosa é o ponto.
4. **Erros são normalizados.** `ApiError` com `code` de domínio, idêntico nos dois
   adapters.
5. **Mix por domínio é suportado** durante a migração: catálogo em HTTP enquanto
   sessão ainda está em mock.

## Consequências

**Positivas:** troca de transporte sem tocar em tela; mock vira fixture de teste;
contrato exercitado pela UI antes de existir servidor; possibilidade de demo
offline permanente para o time comercial.

**Negativas:** dois adapters para manter (paridade obrigatória em code review);
uma camada extra de indireção que não se paga em apps triviais — este não é um.
