# PR 0 — Saneamento e bootstrap

Estado: implementação local preparada; **PR 0 não concluído**. Faltam E2E e
validação nativa. Base normativa: seção PR 0 de `E:/projects/Atlas/codex-brief-atlas.md`,
autorizada pelo usuário em substituição ao YAML ausente. Data: 09/09/2026.

## Critérios de aceite, um por um

| Critério                                                             | Resultado executado                              | Evidência / limite                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` limpo                                                 | Instalação realizada; repetição congelada passou | [install.txt](pr0-evidencias/install.txt). A primeira instalação falhou por expo-glass-effect inexistente e foi corrigida. Instalações iniciais avisaram sobre pacotes descontinuados; a repetição final não acusou dependências ausentes.               |
| `pnpm typecheck` limpo                                               | Passou nos 5 pacotes                             | [typecheck.txt](pr0-evidencias/typecheck.txt)                                                                                                                                                                                                            |
| `pnpm test` limpo                                                    | **Não passou**                                   | 26 testes unitários/de contrato passaram; Maestro ausente. [test.txt](pr0-evidencias/test.txt)                                                                                                                                                           |
| `pnpm lint` limpo                                                    | Passou, zero warnings                            | [lint.txt](pr0-evidencias/lint.txt)                                                                                                                                                                                                                      |
| Dois scripts de paridade                                             | Passaram: 7 ports e 12 endpoints                 | [adapter-parity.txt](pr0-evidencias/adapter-parity.txt), [contract-parity.txt](pr0-evidencias/contract-parity.txt)                                                                                                                                       |
| Abre em simulador iOS 26 e emulador Android sem warning de resolução | **Não verificado em runtime nativo**             | Exportação Metro/Hermes de ambas as plataformas passou. Nenhum erro de resolução final. Warnings de NO_COLOR/FORCE_COLOR são preservados no log. Não há Xcode neste Windows; adb/emulator não foram encontrados. [export.txt](pr0-evidencias/export.txt) |
| Dev Menu troca vidro sem reiniciar                                   | Implementado; **validação visual pendente**      | Testes verificam configuração reativa, seleção de solid/blurFallback/native e precedência de acessibilidade. Não equivalem a renderizar vidro nativo.                                                                                                    |

## Seis correções do brief

1. `newId()` usa `expo-crypto` no mobile. Hoje e Sessão deixaram de acessar o
   crypto global. Os testes Node usam explicitamente `node:crypto`; não dependem
   do runtime Expo. **UUIDv4 foi autorizado pelo usuário neste PR como exceção
   temporária à R7**, que originalmente exige v7.
2. Duração nula é tratada explicitamente antes da concatenação, exibindo travessão
   quando não há repetições nem duração.
3. Paths geométricos foram mantidos. Teste confirma cobertura de todos os IDs da
   fixture. A geometria continua isolada em `body-paths.ts` (ATL-CAT-003).
4. Não foi introduzida animação de opacidade no vidro. A inspeção encontrou
   opacidades estáticas não nulas nos componentes existentes. Não foi feita
   afirmação de garantia visual para toda a árvore nativa.
5. Expo declarado em `^57.0.17` e resolvido em 57.0.21; versões nativas alinhadas
   à matriz oficial publicada no SDK 57. Bundle mode configurado em Babel e
   Metro e exercitado nas duas exportações. Medição de memória permanece pendente.
6. Script de prebuild usa `expo prebuild --no-clean`. Não foi executada geração
   nativa sem SDKs e dispositivos disponíveis.

## Implementação e decisões

- Provider mobile fixado em mock. Configuração de latência/erro é consultada pelo
  mesmo cliente em cada operação; não há recriação de store ao trocar controles.
- Teste verifica preservação de sessão e idempotência após erro simulado, além da
  latência de 3000 ms usando relógio controlado.
- Dev Menu oferece tema claro/escuro, capability, latência e erro com validação
  local dos limites. Rota protegida por `__DEV__`; valores duram até reiniciar o
  processo. Entrada acessível mesmo quando consultas de dados falham.
- Nativo indisponível cai para blurFallback. Reduzir Transparência prevalece
  inclusive sobre `forceCapability`. A tab bar continua sob responsabilidade
  de NativeTabs/OS; o controle de capability atua em GlassSurface.
- ESLint compartilhado usa eslint-config-expo autorizado. Exceção no-redeclare
  em contracts acomoda o padrão legítimo Zod valor/tipo com mesmo nome; `tsc`
  continua verificando duplicações. Nenhum schema foi modificado.
- Prettier configurado na raiz. [Saída de formatação](pr0-evidencias/format.txt).
- Os imports ESM `.js` dos pacotes de workspace são resolvidos para fontes `.ts`
  por um resolver restrito a `packages/`, preservando os demais resolvers Expo.
- NativeTabs usa a API atual de Icon/Label e símbolos Android existentes, em vez
  de drawables inexistentes. Propriedade SVG sem suporte de tipos foi removida;
  accessibilityLabel permanece, mas VoiceOver ainda exige teste nativo.
- `pnpm test` executa unitários globais antes do E2E. A falta de Maestro continua
  falhando o comando; nenhum gate foi desabilitado para obter verde.
- Criado `.maestro/bootstrap.yaml` para percorrer os controles sem relançar o app.
  **Fluxo preparado, não executado**. Requer build de desenvolvimento e Metro
  ativo. Não mede qualidade visual nem substitui a inspeção nos três materiais.

## Definition of Done restante

- Não há nova tela com consulta de domínio: Dev Menu usa configuração local.
  As telas de dados existentes não foram reescritas neste PR.
- Os três caminhos de seleção de capability têm testes unitários. Faltam
  capturas/inspeção visual no nativo, solid e blurFallback, nos dois temas.
- Não foram encontrados TODOs no código mobile. Paths continuam referenciando
  ATL-CAT-003. A busca de transporte em app/dev não encontrou chamadas diretas.
- Persistem convenções legadas nas telas existentes, como estilos literais e
  strings fora de t(); este PR não representa uma certificação integral R5/UI.
- Contratos, domínio, tokens, OpenAPI e backend não foram alterados.
- Expo export mediu aproximadamente **5,1 MB Android / 4,9 MB iOS** em bytecode
  Hermes. São artefatos acima do orçamento de 3,5 MB; não há baseline anterior
  medido para calcular regressão. Não são medições de RAM ou TTI.
- A configuração mobile está deliberadamente fixa em mock; a futura integração
  deve restaurar a seleção na composição do provider. A interface de configuração
  demo não deve virar método de port ou requisito de endpoint HTTP.
- O helper gera v4 por autorização excepcional. Antes da integração, resolver
  formalmente a divergência UUIDv4/v7 entre brief e R7.

## Publicação e próximos passos

O Git está em `E:/projects/Atlas/atlas-monorepo`, branch main sem commits, com a
pasta atlas inteira não rastreada. Nenhum commit, push ou PR foi criado: falta
uma base versionada para representar apenas esta task sem incluir todo o projeto.

Para concluir o PR 0: disponibilizar ambiente nativo/Maestro, executar o fluxo
preparado e validar iOS 26/Android fisicamente; revisar os três materiais e temas;
resolver a base Git para publicação isolada. Não iniciar PR 1 como se os gates
nativos do PR 0 já estivessem satisfeitos.

## Referências de ferramentas

- [Configuração oficial do bundle mode](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup/).
- [Fluxos Maestro](https://docs.maestro.dev/getting-started/writing-your-first-flow).
