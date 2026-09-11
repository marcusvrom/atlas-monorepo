# Spec 11 — Design System: Liquid Glass

## 1. Princípio

Liquid Glass é **material**, não decoração. Ele existe para separar camadas
funcionais: o conteúdo vive no fundo, os controles flutuam sobre ele. Aplicar
vidro em tudo destrói exatamente a hierarquia que ele deveria criar.

**Regra de ouro do projeto:** vidro só em elementos que *flutuam sobre
conteúdo rolável*. Nunca em conteúdo, nunca em fundo de tela inteira, nunca
empilhado (vidro sobre vidro).

### 1.1 Onde usar

| Elemento | Vidro? | Variante |
|---|---|---|
| Tab bar | ✔ (nativa do sistema) | `NativeTabs` |
| Header flutuante ao rolar | ✔ | `regular` |
| Barra de controle da sessão de treino (timer, próximo) | ✔ | `regular`, tinted |
| FAB / botão de ação primária | ✔ | `clear` sobre imagem |
| Bottom sheet handle | ✔ | `regular` |
| Card de exercício em lista | ✘ | superfície sólida elevada |
| Card de métrica no dashboard | ✘ | superfície sólida elevada |
| Fundo de tela | ✘ | gradiente de profundidade |
| Modal de conteúdo longo | ✘ | sólido |

### 1.2 Fundo: o vidro precisa de algo para refratar

Vidro sobre cinza chapado parece cinza chapado. Toda tela tem um
`<DepthBackground>` — gradiente de malha suave em tons do tema, com blobs
posicionados atrás das áreas de vidro. Custo: um `LinearGradient` estático +
dois círculos borrados. Não animar em scroll (custo de GPU sem ganho perceptível).

## 2. Camada de abstração (obrigatória)

Nenhuma tela importa `expo-glass-effect`. Existe **um** componente:

```tsx
<GlassSurface variant="regular" tint="neutral" interactive>
  {children}
</GlassSurface>
```

Ele resolve, em ordem:

1. `isLiquidGlassAvailable() && isGlassEffectAPIAvailable()` → `GlassView` nativo
2. Usuário com **Reduzir Transparência** → superfície sólida do tema
3. Android / iOS < 26 → `expo-blur` + borda em gradiente + overlay de ruído sutil
4. Modo de teste / snapshot → superfície sólida determinística

Racional: a disponibilidade do vidro é uma condição de runtime que muda por
device, versão de OS e preferência de acessibilidade. Espalhar essa checagem
por 40 componentes garante inconsistência. Ver ADR-0015.

## 3. Tokens

Definidos em `@atlas/design-tokens`. Extrato do que é específico de vidro:

```ts
glass: {
  regular:     { blurIntensity: 24, fallbackOpacity: 0.72, borderOpacity: 0.18 },
  clear:       { blurIntensity: 12, fallbackOpacity: 0.45, borderOpacity: 0.26 },
  radius:      { sm: 14, md: 22, lg: 28, pill: 999 },
  borderWidth: 0.5,
  shadow:      { opacity: 0.18, radius: 24, offsetY: 8 }
}
```

Raios grandes não são estética arbitrária: o material do sistema no iOS 26 usa
cantos com curvatura contínua e raios generosos. Raio pequeno com vidro parece
erro de implementação.

## 4. Acessibilidade — não negociável

| Preferência do sistema | Comportamento |
|---|---|
| Reduzir Transparência | Vidro → sólido, em todo o app |
| Aumentar Contraste | Borda de vidro passa a 1px sólida, texto ganha peso |
| Reduzir Movimento | Sem transição morph entre superfícies |
| Texto Dinâmico até XXL | Layout não quebra; testar em `accessibilityLarge` |

Contraste mínimo de texto sobre vidro: **4.5:1 contra o pior caso do fundo**,
não contra o fundo médio. Na prática isso obriga a uma camada de tinta sob o
texto em superfícies `clear`.

## 5. Paridade Android

Android **não** recebe uma imitação do iOS. Recebe a mesma linguagem traduzida:
superfícies elevadas com blur real (`expo-blur` funciona bem em Android 12+),
bordas em gradiente, e a mesma escala tipográfica e de espaçamento. Material 3
Expressive e Liquid Glass compartilham mais do que aparentam — profundidade por
camada, cantos generosos, tinta dinâmica.

Onde há divergência intencional, registrar em
`src/design/components/*.android.tsx`, nunca em `if (Platform.OS)` espalhado.

## 6. Tipografia e cor

| Token | iOS | Android |
|---|---|---|
| Fonte | SF Pro (sistema) | Roboto Flex (sistema) |
| Escala | 34 / 28 / 22 / 17 / 15 / 13 | mesma |
| Tinta primária | `#5B8CFF` | `#5B8CFF` |
| Sucesso / atenção / risco | `#3ECF8E` / `#FFB020` / `#FF5C5C` | idem |

Tema escuro é o **default** do produto. Vidro tem muito mais presença sobre
fundo escuro, e a maior parte do uso do app acontece em academia com
iluminação artificial. Tema claro é suportado, não prioritário.
