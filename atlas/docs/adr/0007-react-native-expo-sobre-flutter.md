# ADR-0007 — React Native + Expo para o app mobile

**Status:** Aceito (2026-09) — substitui a recomendação inicial de Flutter
**Contexto:** requisito de design Liquid Glass adicionado após o baseline arquitetural

## Decisão

Construir o app mobile com **React Native 0.86 sobre Expo SDK 57**.

## Contexto

O baseline recomendava Flutter, com o argumento de renderização própria via
Impeller garantir paridade visual entre plataformas e facilitar o modelo
anatômico vetorial. O requisito de Liquid Glass inverte o peso desses fatores.

Liquid Glass no iOS 26 não é um efeito visual reproduzível: é um material do
sistema (`UIVisualEffectView` com `UIGlassEffect`) que amostra dinamicamente o
conteúdo por trás, reage a scroll, a modo claro/escuro e ao contexto do sistema,
e é atualizado pela Apple a cada release de OS.

## Alternativas avaliadas

| Opção | Vidro nativo | Paridade cross-platform | Custo |
|---|---|---|---|
| **RN + Expo** | Sim, via `expo-glass-effect` e native tabs | Média — exige projeto de linguagem própria em Android | Baixo |
| Flutter | Não — apenas imitação por shader | Alta | Médio, e resultado sempre aproximado |
| Nativo × 2 (SwiftUI + Compose) | Sim, ideal | N/A — duas bases | Alto: ~1,8× o esforço |
| RN sem Expo | Sim, com binding manual | Média | Alto: perder EAS, OTA, config plugins |

## Consequências

**Positivas**
- Material de vidro real no iOS 26, com atualização automática pela Apple
- Tab bar de sistema com vidro via Expo Router Native Tabs
- Acesso a SwiftUI e Jetpack Compose via Expo UI quando o componente nativo for superior
- EAS Build, EAS Update (OTA) e config plugins reduzem custo de operação
- Stack TypeScript compartilhada com os pacotes `contracts`/`domain`/`api-client`

**Negativas aceitas**
- Paridade visual em Android exige design deliberado, não tradução automática
- New Architecture ainda tem arestas em bibliotecas de terceiros — mitigado
  restringindo dependências nativas a pacotes do próprio Expo
- Regressão de memória conhecida com Reanimated + Hermes V1 exige *worklets
  bundle mode*
- Renderização de gráficos pesados é menos previsível que Impeller — mitigado
  usando `react-native-skia` nas telas de heatmap e gráfico

## Revisitar se

- A Apple expor o material de vidro por API pública que o Flutter consiga embrulhar
- O custo de manutenção do design Android exceder 20% do esforço de UI
