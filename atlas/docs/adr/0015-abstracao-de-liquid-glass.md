# ADR-0015 — Liquid Glass atrás de uma camada de abstração

**Status:** Aceito

## Decisão

`expo-glass-effect` só pode ser importado dentro de `src/design/glass/`. Todo o
resto do app consome `<GlassSurface>` e os componentes derivados.

## Contexto

A disponibilidade do vidro depende de três condições de runtime independentes:

1. Plataforma e versão de OS (iOS 26+)
2. Disponibilidade real da API (algumas builds de iOS 26 não a expõem — crash conhecido)
3. Preferência de acessibilidade do usuário (Reduzir Transparência)

Espalhar essas checagens produz inconsistência garantida: alguma tela vai
esquecer uma delas, e o bug aparece só no device de um usuário específico.

## Implementação

```
src/design/glass/
├── useGlassCapability.ts    resolve as 3 condições, memoizado, reativo a mudança
│                            de preferência de acessibilidade
├── GlassSurface.tsx         seleciona: native | blur-fallback | solid
└── glass-fallback.tsx       blur + borda em gradiente + ruído
```

## Consequências

**Positivas:** fallback correto por construção; acessibilidade em um lugar;
testes de snapshot determinísticos (modo `solid` forçado); trocar de biblioteca
de vidro é alterar um arquivo.

**Negativas:** `GlassSurface` não expõe toda a superfície de API do `GlassView`.
Isso é intencional — necessidades novas passam por revisão do design system em
vez de vazarem para telas.
