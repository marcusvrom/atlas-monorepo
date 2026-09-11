# @atlas/mobile

App Expo SDK 57 / React Native 0.86 do Atlas, fase mock-first.

## Rodar

Na raiz do monorepo: `pnpm install --frozen-lockfile`, depois `pnpm mobile`.
Para builds nativos, use `pnpm mobile:android` ou, em macOS com Xcode,
`pnpm mobile:ios`. A configuração exige as ferramentas nativas correspondentes.
`pnpm --filter @atlas/mobile prebuild` usa `--no-clean` para preservar customizações.

## Demonstração

Em builds de desenvolvimento, toque em **Abrir demonstração**. A rota `/dev`
permite alternar tema, material e latência/erro do mock sem reiniciar ou apagar
fichas/sessões. As preferências duram até reiniciar o processo. A rota é protegida
em produção. Nativo só é usado quando as duas APIs de vidro estão disponíveis;
Reduzir Transparência tem precedência sobre qualquer escolha.

As capabilities controlam `GlassSurface`; a tab bar continua sendo renderizada
pelo sistema via NativeTabs. Sua aparência e acessibilidade precisam de validação
nativa, especialmente no iOS 26.

Valores iniciais: `EXPO_PUBLIC_MOCK_LATENCY_MS=220` e
`EXPO_PUBLIC_MOCK_ERROR_RATE=0`. O provider mobile está fixado em mock nesta fase.
O adapter HTTP existente continua disponível no pacote para integração futura.

## Verificação

- `pnpm typecheck` e `pnpm lint`, na raiz.
- `pnpm test:unit`: testes de domínio, contrato e bootstrap.
- `pnpm test`: unitários seguidos de Maestro; não ignora a falha de E2E.
- `pnpm exec expo export --platform android --platform ios`, nesta pasta.
- Gates de paridade em `scripts/`, executados na raiz.

O estado real dos critérios e das limitações do ambiente está em
[PR 0 — verificação](../../docs/pr0-verificacao.md).
