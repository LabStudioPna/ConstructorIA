# n8n Workflows — ConstructorIA Automation

Todos los workflows se ejecutan en n8n y se integran con PostgreSQL, Anthropic API, y proveedores.

---

## 1. Welcome Email (Onboarding)

**Trigger:** Usuario nuevo registrado  
**Actions:**
1. Webhook recibe `user.created` event
2. Extract user data (email, name, API key status)
3. Insert into database `workflow_logs`
4. Send personalized welcome email (Resend/SendGrid)
5. Send admin notification (Slack)

**Schedule:** Inmediato  
**Retry:** 3 intentos cada 5 min

---

## 2. Daily Progress Report

**Trigger:** Cada día a las 9 AM  
**Actions:**
1. Query active projects por usuario
2. Calcular budget variance (actual vs estimado)
3. Contar items completados
4. Generate email HTML report
5. Send por email (Resend)
6. Log en `workflow_logs`

**Frequency:** Diaria  
**Recipients:** Users con subscription activa

---

## 3. Budget Deviation Alert

**Trigger:** Budget deviates >5%  
**Actions:**
1. Monitor `budget_items` inserts/updates
2. Calculate variance against `projects.budget`
3. Si variance > 5%:
   - Send email alert
   - Send Slack notification (si user tiene integración)
   - Send SMS (Twilio)
4. Log deviation en `project_history`

**Threshold:** Configurable por usuario

---

## 4. Auto-Reorder Supplies

**Trigger:** Supplier stock bajo (manual o automático)  
**Actions:**
1. Query `suppliers` tabla para materiales tracked
2. Call `compareSuppliers()` (suppliers-integration.js)
3. Seleccionar mejor proveedor (precio + delivery + rating)
4. Generate purchase order (PO)
5. Email PO a proveedor
6. Guardar order en `workflow_logs`

**Schedule:** Manual o diaria a las 10 AM  
**Approval:** Required antes de send

---

## 5. Weekly Digest

**Trigger:** Cada lunes a las 8 AM  
**Actions:**
1. Aggregar data de última semana:
   - Projects completados
   - Budgets analizados
   - Cost predictions generadas
   - Alerts disparadas
2. Generate digest HTML
3. Send por email
4. Post summary a Slack (opcional)

**Recipients:** Todos los usuarios

---

## 6. Floor Plan Analysis Webhook

**Trigger:** User sube plano en agente-constructor.html  
**Actions:**
1. Webhook receives base64 image
2. Call `analyze-plan.js` (Claude Vision)
3. Extract dimensions, rooms, materials, cost estimate
4. Insert en `floor_plans` tabla
5. Return analysis a frontend (WebSocket)
6. Trigger PDF export (opcional)

**Latency Target:** <10 seg

---

## 7. Payroll Sync (Contractor Payments)

**Trigger:** Cada 15 y último día del mes  
**Actions:**
1. Query contractors con `payment_status = 'pending'`
2. Sum completed work items
3. Validate hours/amounts
4. Generate invoice
5. Transfer vía Stripe/PayPal
6. Send payment confirmation
7. Update `project_history`

**Integration:** Stripe/PayPal API  
**Approval:** Manual si > $5000

---

## 8. Quarterly Business Review (QBR) Report

**Trigger:** Primer día de cada trimestre a las 10 AM  
**Actions:**
1. Aggregar data 3 últimos meses:
   - Revenue by project
   - Cost trends
   - Team utilization
   - Customer satisfaction (NPS)
2. Generate PDF report
3. Upload a AWS S3
4. Email link a stakeholders
5. Post metrics a Slack

**Recipients:** Business owners, project managers

---

## 9. Supplier Partnership Updates

**Trigger:** Diario a las 6 PM  
**Actions:**
1. Check supplier API endpoints para nuevos precios
2. Update `suppliers` tabla
3. Alert si precio cambió >5%
4. Recommend cambio de proveedor si savings > 10%
5. Log cambios en `workflow_logs`

**Suppliers Tracked:** 5 principales

---

## 10. Photo Upload & Auto-Analysis

**Trigger:** User sube foto en agente-constructor.html  
**Actions:**
1. Webhook receives image
2. Call `vision-photo.js` (Claude Vision)
3. Analyze: progress %, phase, safety, quality
4. Insert en `floor_plans` tabla (photo_history)
5. Auto-update project progress estimate
6. Send Slack notification si safety alerts

**Latency Target:** <5 seg  
**Storage:** AWS S3

---

## Implementation Checklist

- [ ] n8n instance running
- [ ] PostgreSQL credentials configured
- [ ] Anthropic API key loaded
- [ ] Stripe/PayPal credentials ready
- [ ] Slack integration (si usa notifications)
- [ ] Email service (Resend/SendGrid)
- [ ] SMS service (Twilio) - opcional
- [ ] AWS S3 bucket created
- [ ] Cron jobs scheduled
- [ ] Error monitoring (Sentry)
- [ ] Workflow logging active

---

## Error Handling

Todos los workflows tienen:
- Retry logic (3 intentos)
- Error notifications (email + Slack)
- Fallback handlers
- Detailed logging en `workflow_logs`

---

**Last Updated:** 2026-07-17  
**Status:** Production-ready
