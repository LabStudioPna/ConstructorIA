# n8n Workflows — ConstructorIA Automation

Automatización completa de procesos de construcción usando n8n (open-source workflow automation).

---

## 🎯 Workflows Principales

### 1. Welcome Email Automation
**Trigger:** Usuario nuevo registrado
**Actions:** 
- Guardar en DB
- Enviar welcome email (SendGrid)
- Notificar admin (Slack)
- Log workflow

**Deploy:** `workflow-welcome-email.js`
**Status:** ✅ Creado

---

### 2. Project Creation Notification
**Trigger:** Nuevo proyecto creado
**Actions:**
- Crear carpeta en Google Drive
- Enviar template presupuesto
- Crear evento calendario (Google Calendar)
- Notify team (Slack)

```json
{
  "trigger": "webhook",
  "path": "/constructoria-project-created",
  "payload": {
    "project_id": "string",
    "user_id": "string",
    "name": "string",
    "area_sqm": "number"
  }
}
```

---

### 3. Daily Progress Report
**Trigger:** Diario (9 AM - configurable)
**Actions:**
- Obtener proyectos activos
- Calcular progreso diario
- Generar reporte PDF
- Enviar email a PM + equipo
- Guardar en histórico

```yaml
Schedule: Daily 09:00 Buenos Aires
Recipients: [project_manager, supervisor, owner]
Report includes:
  - Budget variance
  - Timeline variance
  - New issues/risks
  - Supplier status
  - Crew activity
```

---

### 4. Budget Deviation Alert
**Trigger:** Desviación >5% del presupuesto
**Actions:**
- Detectar varianza (PostgreSQL query)
- Calcular impacto ($)
- Crear issue tracking
- Notify PM + Finance
- Trigger recommendation engine

```json
{
  "threshold": 0.05,
  "alert_on": "cost_increase",
  "recipients": ["pm", "finance_manager"],
  "actions": ["create_task", "send_alert", "log_event"]
}
```

---

### 5. Supplier Reorder Automation
**Trigger:** Stock bajo (configurable por rubro)
**Actions:**
- Verificar niveles de inventario (Supplier API)
- Comparar precios (5 suppliers)
- Crear orden de compra automática
- Enviar PO a proveedor email
- Guardar en QuickBooks
- Notify purchasing

```yaml
Materials monitored:
  - Cement: min_stock 50 bolsas
  - Steel: min_stock 500 kg
  - Copper: min_stock 100 m
  - Tiles: min_stock 1000 units
  
Auto-reorder if < min_stock:
  - Query 5 suppliers
  - Select cheapest + reliable
  - Create PO
  - Send email + SMS
```

---

### 6. Photo Upload & Analysis
**Trigger:** Foto subida al proyecto
**Actions:**
- Store image (Google Cloud Storage)
- Analyze (Claude Vision)
- Extract findings (JSON)
- Create quality report
- Flag defects
- Notify team
- Update timeline

```json
{
  "trigger": "webhook",
  "path": "/projects/:id/photos",
  "file_size_limit": "10MB",
  "format": ["jpg", "png"],
  "analysis_focus": ["progress", "safety", "quality"]
}
```

---

### 7. Payroll Sync
**Trigger:** Fin de semana (viernes)
**Actions:**
- Obtener timesheets (Mobile app / QR)
- Calcular horas trabajadas
- Sync a nómina (Rippling/ADP)
- Generate payment vouchers
- Send receipts
- Update budget (labor costs)

```yaml
Frequency: Weekly (Friday 6 PM)
Data sources:
  - Mobile app timesheets
  - QR check-in/out
  - GPS tracking
  - Project assignments
  
Integrations:
  - Rippling (HR/Payroll)
  - Bank API (payments)
  - PDF generation
  - Email distribution
```

---

### 8. Weekly Status Report
**Trigger:** Lunes 8 AM
**Actions:**
- Compile metrics (projects, budget, timeline, team)
- Generate dashboard
- Create presentation
- Send to stakeholders
- Save to archive

```json
{
  "recipients": ["ceo", "finance", "operations"],
  "content": {
    "projects": "status_summary",
    "financials": "budget_variance_analysis",
    "timeline": "schedule_status",
    "team": "crew_performance",
    "risks": "top_3_risks"
  },
  "format": "pdf",
  "send_via": "email"
}
```

---

### 9. Contractor Payment Processing
**Trigger:** Contractor completes task
**Actions:**
- Verify completion (photo/approval)
- Calculate payment
- Create invoice
- Process payment (Stripe/Bank)
- Send receipt
- Update accounting

```yaml
Workflow:
  1. Contractor marks task complete
  2. Photo + signature upload
  3. PM approval (or auto-approve)
  4. Payment calculation (hourly + bonus)
  5. Process payment
  6. Invoice to QuickBooks
  7. Send receipt + thank you
```

---

### 10. Quarterly Business Review
**Trigger:** Trimestral (Primer día del mes +1)
**Actions:**
- Extract YTD financials
- Calculate KPIs
- Generate deck (Google Slides)
- Analysis + recommendations
- Email to leadership

```json
{
  "schedule": "quarterly",
  "trigger_date": "first_day_of_month + 1",
  "metrics": [
    "revenue", "margin", "project_count",
    "team_size", "customer_satisfaction",
    "safety_incidents", "budget_accuracy"
  ],
  "deliverable": "pdf_presentation"
}
```

---

## 🔗 Integraciones Disponibles

| Sistema | Purpose | Status |
|---------|---------|--------|
| PostgreSQL | Data storage | ✅ Ready |
| SendGrid | Email | ✅ Ready |
| Slack | Notifications | ✅ Ready |
| Google Drive | File storage | ⏳ Config |
| Google Calendar | Scheduling | ⏳ Config |
| Stripe | Payments | ⏳ Setup |
| Rippling | Payroll | ⏳ Setup |
| QuickBooks | Accounting | ⏳ API |
| Twilio | SMS alerts | ⏳ Setup |
| AWS S3 | Cloud storage | ⏳ Config |

---

## 📋 Deployment Steps

1. **Install n8n:**
   ```bash
   npm install -g n8n
   n8n start
   ```

2. **Import workflows:**
   - Go to n8n UI (http://localhost:5678)
   - Import JSON files from GitHub
   - Configure credentials (API keys, DB connection)
   - Test workflows

3. **Set webhooks:**
   - Copy webhook URLs from n8n
   - Add to backend (server.js)
   - Test with cURL

4. **Monitor:**
   - Check execution logs
   - Set up alerts for failures
   - Monitor usage/costs

---

## 💡 Best Practices

- **Error handling:** All workflows have retry logic (3x)
- **Logging:** Every action logged to DB (workflow_logs table)
- **Secrets:** Use n8n credentials (encrypted)
- **Testing:** Test workflow before production
- **Documentation:** Keep this file updated

---

**Last Updated:** 2026-07-17
**Status:** ✅ 2 workflows deployed, 8 in progress
