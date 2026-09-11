# Módulo Billing

> **Status:** não implementado (Fase 1). Estrutura a replicar: `src/Modules/Catalog`.

## Agregados
`Subscription`, `Entitlement`, `Payout`, `Invoice`

## Contrato público
`IEntitlementService.HasAsync(userId, Feature.X)` é a ÚNICA forma de o resto do
sistema consultar direito de acesso. Nenhum módulo lê `subscription.Plan`. Isso
desacopla feature-gating de plano comercial e permite grandfathering, cupons e
experimentos de pricing sem tocar em 40 lugares.

## Fluxos
- Bens digitais (avatar, Pro) → IAP obrigatório
- Assinatura de coach → web, fora do IAP
- Serviço humano → split via Stripe Connect / Pagar.me
- `402` carrega `{ feature, limit, currentPlan, suggestedUpgrade }`

## Task-specs
ATL-BIL-001..004
