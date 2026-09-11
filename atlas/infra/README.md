# Infraestrutura — Terraform

> **Status:** Fase 1. Não é necessário para rodar a Fase 0 (mock-first) — o app
> funciona inteiramente no device.

## Estrutura alvo

```
infra/
├── modules/
│   ├── network/        VPC, subnets, NAT, PrivateLink (S3, ECR, Secrets)
│   ├── ecs-service/    task definition, service, autoscaling, ALB TG, alarmes
│   ├── aurora/         cluster Serverless v2, PostGIS, param groups, PI
│   ├── redis/          ElastiCache
│   ├── opensearch/     busca de profissionais (Fase 2+)
│   ├── media-pipeline/ S3, MediaConvert, CloudFront + OAC
│   ├── messaging/      EventBridge bus, regras, SQS + DLQ
│   └── observability/  log groups, dashboards, alarmes, SLO
└── envs/
    ├── dev/
    ├── staging/
    └── prod/
```

## Regras

- Remote state em S3 com lock em DynamoDB
- `terraform plan` obrigatório como comentário no PR
- `apply` em prod exige aprovação manual e roda via OIDC — nenhuma chave de
  longa duração no pipeline
- Tudo em `ARM64` (Graviton): −20% de custo e melhor perf/watt em .NET 9
- Teto de ACU no Aurora Serverless com alarme de billing — sem teto, a escala
  automática vira surpresa na fatura

## Dimensionamento inicial (dev)

| Recurso | Configuração |
|---|---|
| Aurora Serverless v2 | 0.5–4 ACU |
| ECS Fargate | 1 task, 0.5 vCPU / 1 GB |
| Redis | cache.t4g.micro |
| NAT | 1 gateway (não redundante em dev, de propósito) |

Estimativa de custo em produção: `docs/specs/00-produto-e-dominio.md` §17.
