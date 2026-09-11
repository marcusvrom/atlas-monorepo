# Módulo BodyMeasurement

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
`MeasurementEntry`

## Invariantes
- Massa magra é sempre **derivada** (`peso × (1 − %gordura)`), nunca informada.
- Protocolos de dobras (Pollock 3/7, Faulkner, Guedes) são **versionados**: o
  mesmo dado bruto precisa produzir o mesmo resultado três anos depois.
- **Guardrail de saúde obrigatório**: metas fora de faixa segura são rejeitadas
  por invariante de agregado, não por validação de UI. Ver spec 00 §4.5.
- Fotos de progresso nunca no banco: S3 com KMS dedicado e URL pré-assinada de
  5 minutos.

## Task-specs
ATL-BDY-001..003
