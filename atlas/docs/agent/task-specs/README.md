# Task-specs

Unidade de trabalho consumível por agente de código. Cada arquivo carrega
contexto, contrato, critérios de aceite **verificáveis** e limites explícitos de
escopo.

## Formato

```yaml
spec_id:        identificador estável (ATL-<MÓDULO>-<NNN>)
title:          uma linha
phase:          mock-first | backend | integration
context_module: módulo ou área do app
depends_on:     [outras specs]
adr_refs:       [ADRs que justificam decisões aqui]
goal:           parágrafo curto — o "o quê", não o "como"
... (seções específicas por tipo)
acceptance_criteria:  lista verificável, não subjetiva
out_of_scope:   o que NÃO fazer nesta task
```

## Regra de ouro

`acceptance_criteria` precisa ser **verificável por outra pessoa sem contexto**.
"UI ficou boa" não é critério; "registrar série produz feedback visual em ≤ 16 ms
sem aguardar resposta do adapter" é.

## Prefixos

| Prefixo | Área |
|---|---|
| ATL-INF | Infraestrutura e pipeline |
| ATL-UI  | Casca do app, navegação, design system |
| ATL-IDN | Identity |
| ATL-CAT | Catálogo |
| ATL-PRG | Programação de treino |
| ATL-SES | Sessão de treino |
| ATL-BDY | Medidas corporais |
| ATL-INS | Insights |
| ATL-MKT | Marketplace |
| ATL-COA | Coaching |
| ATL-BIL | Billing |
| ATL-AVT | Avatar |
