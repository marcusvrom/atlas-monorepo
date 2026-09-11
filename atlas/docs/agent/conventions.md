# Convenções de código

Complemento operacional do `AGENTS.md`. Onde houver conflito, `AGENTS.md` vence.

## Nomes

| Elemento | Convenção | Exemplo |
|---|---|---|
| Arquivo de componente React | PascalCase | `GlassSurface.tsx` |
| Arquivo de hook | camelCase | `useGlassCapability.ts` |
| Arquivo de módulo TS | kebab-case | `query-keys.ts` |
| Classe C# | PascalCase | `WorkoutPlan` |
| Arquivo C# | um tipo público por arquivo | `Exercise.cs` |
| Tabela SQL | snake_case, singular | `performed_set` |
| Schema SQL | nome do módulo, minúsculo | `catalog`, `session` |
| Evento | `atlas.<contexto>.<fato-no-passado>` | `atlas.session.completed` |

## TypeScript

- `type` para união e forma de dado; `interface` para contrato implementado por classe
- Nunca `any`. Quando o tipo é realmente desconhecido, `unknown` + validação Zod
- `readonly` em arrays de parâmetro de função pura
- Import de tipo sempre com `import type` (`verbatimModuleSyntax` está ligado)
- Barrel file (`index.ts`) apenas em pacote publicado, nunca dentro de feature

## C#

- `sealed` por padrão em classe que não é projetada para herança
- Construtor primário quando a classe é só dependências
- `Result<T>` para erro de domínio; exceção só para falha de infraestrutura
- Nada de `async void`; `CancellationToken` em todo método assíncrono público
- Coleção exposta por agregado é sempre `IReadOnlyList<T>`

## SQL

- SQL de leitura em `const string` nomeada, não interpolada
- Sempre parametrizado. Interpolação de string em SQL é rejeitada no review
- Todo índice novo vem com o plano de execução da query que o justifica no PR

## Commits e PR

```
feat(mobile): tela de execução com registro otimista de série
fix(api): idempotência do lote de séries respeita clientGeneratedId
docs(specs): revisar ADR-0007 após requisito de Liquid Glass
```

PR precisa conter: o que muda, por quê, como testar, e print antes/depois quando
toca em UI.

## Comentário

Comentário explica **por quê**, nunca **o quê**. Se o código precisa de
comentário para dizer o que faz, o problema é o código.

Bom: `// 402 com upgradeTo permite paywall contextual sem hardcodar regra de plano.`
Ruim: `// incrementa o contador`
