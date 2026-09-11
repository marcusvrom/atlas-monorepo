# ATL-UI-012 — Check-in diário

Campos aprovados explicitamente pelo usuário em 10/09/2026. Extensão aditiva: não modifica schemas anteriores.

- CheckInInput: data local YYYY-MM-DD, clientGeneratedId UUID, sono 0–24 horas, qualidade e energia 1–5, dor 0–10 (campos nulos permitidos em rascunho), status draft/completed.
- CheckInEntry acrescenta updatedAt ISO-8601. Conclusão exige horas, qualidade e energia. A UI exige dor somente no objetivo reabilitação; nos demais, não coleta esse campo.
- Uma entrada por data; reenvio do mesmo UUID retorna a operação anterior. Nova edição recebe novo UUID.
- WellbeingPort: listCheckIns(fromDate, toDate), upsertCheckIn(input).
- Mock em memória + rascunho local persistido pelo app; HTTP GET /api/v1/check-ins e PUT /api/v1/check-ins/{date}, descritos no OpenAPI. Nenhum backend nesta fase.
- Dados não entram em eventos, logs ou relatórios. O histórico apresenta autorrelato, sem notas diagnósticas ou regra clínica copiada do exemplo.
