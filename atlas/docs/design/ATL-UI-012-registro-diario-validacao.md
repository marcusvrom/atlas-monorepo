# ATL-UI-012 — pesos, navegação e registro diário

Revisão de 11/09/2026, restrita ao pedido de formatação em kg, acessibilidade, navegação e incentivo ao preenchimento diário. Exclusivamente adapter mock. Nenhuma dependência, contrato ou backend alterado.

## Critérios acrescentados nesta revisão

| Critério | Evidência | Resultado |
| --- | --- | --- |
| Kg inteiros ou meios, sem mudar dados originais | format-weight.test.ts: 13 casos, incluindo limites de arredondamento, ausência, negativos e precisão original; inspeção do painel e de uma série mockada | Verificado |
| Revisão de navegação e acessibilidade | Fluxos e limitações abaixo; grupos de seleção única, nomes específicos dos controles e volta segura | Verificado na web; validação nativa pendente |
| Home distingue pendência, rascunho e conclusão | Abriu sem registro; salvou parcial; home mostrou progresso parcial; retomou e concluiu; home ofereceu revisão | Verificado na web |
| Data acompanha novo dia e feedback aguarda persistência | Hook local reavalia data ao focar, retomar o app e a cada 30 s; formulário tem chave por data. Registro de série iniciou descanso após sucesso da persistência local | Série verificada na web; virada real do dia apenas inspecionada no código |

Os critérios anteriores da ATL-UI-012 não são declarados novamente concluídos por esta revisão.

## Navegação e acessibilidade

- Home → check-in → salvar rascunho → voltar → retomar → concluir → home: funcionou; dados de demonstração persistiram após recarregar.
- Home → Progresso: painel abriu com unidades em kg formatadas e botão de revisão do check-in concluído.
- Home → treino → aumentar carga em meio kg → registrar série: registro correto e descanso após salvamento local. O registrador deixou de desmontar a cada atualização otimista.
- Sessão aberta diretamente → sair: corrigido botão sem efeito na web. Confirmação em Sheet abre, mantém a sessão em andamento e retorna à home com “Retomar treino”.
- Corrigido erro de cleanup do bloqueio opcional de tela acordada quando o navegador não concedeu esse recurso.
- Formulário foi movido antes do histórico. Etapa anterior tem rótulo distinto de Voltar; instrução explica campos pendentes.
- Sono, energia, dor e controles segmentados usam seleção única acessível. Carga tem ações nomeadas, valor textual e estado desabilitado durante persistência.
- Tela de 320 × 740: formulário inspecionado visualmente; opções quebram em linhas e conteúdo permanece rolável.
- Modo sólido com contraste aumentado e movimento reduzido: sessão inspecionada. Modo blurFallback: home inspecionada. Seleção nativa restaurada ao terminar; no navegador isso não comprova vidro nativo.
- Escala de texto do sistema, VoiceOver, TalkBack, teclado externo completo, gestos e vidro nativos ainda exigem dispositivo. Isto não é certificação de acessibilidade nem auditoria integral de todas as rotas.

## Verificações executadas

Saídas completas em [daily-quality](./evidencias-ATL-UI-012/daily-quality/).

Resultados da última execução:

- pnpm typecheck: 5 successful, 5 total; exit 0.
- pnpm lint: exit 0.
- pnpm test: 31 arquivos / 172 testes unitários passaram. Exit 1 na etapa E2E: Maestro não instalado.
- node scripts/check-adapter-parity.mjs: Paridade OK — 9 ports verificados nos dois adapters.
- node scripts/check-contract-parity.mjs: Contrato OK — 23 endpoints com adapter correspondente.

O smoke test nativo foi atualizado para identificar o controle de carga por testID. Não foi executado neste ambiente. Dados utilizados na inspeção são demonstrações mockadas; nenhuma medição foi enviada a logs ou telemetria pelo aplicativo.
