/**
 * n8n Workflow — Welcome Email Automation
 * Triggers when new user signs up, sends welcome email with onboarding guide
 * Deploy to: n8n Cloud or self-hosted
 */

module.exports = {
  name: 'ConstructorIA: Welcome Email Workflow',
  nodes: [
    {
      name: 'Webhook Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [50, 300],
      webhookId: '{{ $env.WEBHOOK_ID }}',
      parameters: {
        httpMethod: 'POST',
        path: 'constructoria-welcome',
        authentication: 'none',
        responseMode: 'onReceived'
      }
    },
    {
      name: 'Extract User Data',
      type: 'n8n-nodes-base.set',
      typeVersion: 1,
      position: [250, 300],
      parameters: {
        assignments: {
          assignments: [
            {
              name: 'email',
              value: '={{ $json.email }}'
            },
            {
              name: 'firstName',
              value: '={{ $json.first_name }}'
            },
            {
              name: 'lastName',
              value: '={{ $json.last_name }}'
            },
            {
              name: 'userId',
              value: '={{ $json.user_id }}'
            },
            {
              name: 'signupDate',
              value: '={{ $now.toISOString() }}'
            }
          ]
        }
      }
    },
    {
      name: 'Save to Database',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2,
      position: [450, 300],
      credentials: {
        postgresDb: 'constructoria_db'
      },
      parameters: {
        operation: 'insert',
        schema: 'public',
        table: 'users',
        columns: 'id,email,first_name,last_name,created_at,onboarding_sent',
        data: '={{ $json.userId }},{{ $json.email }},{{ $json.firstName }},{{ $json.lastName }},{{ $json.signupDate }},true'
      }
    },
    {
      name: 'Send Welcome Email',
      type: 'n8n-nodes-base.sendGrid',
      typeVersion: 1,
      position: [650, 300],
      credentials: {
        sendGridApi: 'sendgrid_api'
      },
      parameters: {
        fromEmail: 'bienvenida@constructoria.io',
        toEmail: '={{ $json.email }}',
        subject: '🏗️ Bienvenido a ConstructorIA',
        htmlTemplate: `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
    .header { color: #C87D2F; text-align: center; margin-bottom: 30px; }
    .content { color: #333; line-height: 1.6; }
    .btn { background: #C87D2F; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; }
    .features { background: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ Bienvenido a ConstructorIA</h1>
    </div>

    <div class="content">
      <p>Hola {{ $json.firstName }},</p>

      <p>¡Gracias por unirte a ConstructorIA! Somos la plataforma de IA para presupuestos y control de proyectos de construcción.</p>

      <div class="features">
        <h3>🎯 Qué puedes hacer:</h3>
        <ul>
          <li>💰 Crear presupuestos en minutos</li>
          <li>🤖 Chat inteligente con IA</li>
          <li>📊 Control de costos en tiempo real</li>
          <li>📱 Acceso en cualquier dispositivo</li>
          <li>🔐 100% seguro y privado</li>
        </ul>
      </div>

      <p><strong>Próximos pasos:</strong></p>
      <ol>
        <li>Completa tu perfil (2 min)</li>
        <li>Crea tu primer proyecto</li>
        <li>Sube un presupuesto para analizar</li>
        <li>Comienza a usar chat IA</li>
      </ol>

      <a href="https://constructoria.io/onboarding?token={{ $json.userId }}" class="btn">
        Comenzar Tutorial
      </a>

      <div class="features">
        <h3>📚 Recursos útiles:</h3>
        <ul>
          <li><a href="https://docs.constructoria.io">Documentación completa</a></li>
          <li><a href="https://constructoria.io/community">Comunidad de usuarios</a></li>
          <li><a href="mailto:soporte@constructoria.io">Contactar soporte</a></li>
        </ul>
      </div>

      <p>Si tienes preguntas, no dudes en contactarnos.</p>

      <p>¡Feliz construcción!<br>
      El equipo de ConstructorIA 🚀</p>
    </div>

    <div class="footer">
      <p>© 2026 ConstructorIA | LABStudio | <a href="https://constructoria.io">constructoria.io</a></p>
      <p>Recibiste este email porque te registraste en nuestra plataforma.</p>
    </div>
  </div>
</body>
</html>`
      }
    },
    {
      name: 'Send Admin Notification',
      type: 'n8n-nodes-base.slack',
      typeVersion: 1,
      position: [850, 300],
      credentials: {
        slackApi: 'slack_bot'
      },
      parameters: {
        channel: '#signups',
        text: `🎉 Nuevo usuario registrado:\n*Nombre:* {{ $json.firstName }} {{ $json.lastName }}\n*Email:* {{ $json.email }}\n*ID:* {{ $json.userId }}\n*Fecha:* {{ $json.signupDate }}`
      }
    },
    {
      name: 'Log Workflow Completion',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2,
      position: [1050, 300],
      credentials: {
        postgresDb: 'constructoria_db'
      },
      parameters: {
        operation: 'insert',
        schema: 'public',
        table: 'workflow_logs',
        columns: 'workflow_name,user_id,status,executed_at',
        data: `'welcome-email',{{ $json.userId }},'success','{{ $now.toISOString() }}'`
      }
    }
  ],
  connections: {
    'Webhook Trigger': {
      main: [
        [{ node: 'Extract User Data', index: 0 }]
      ]
    },
    'Extract User Data': {
      main: [
        [{ node: 'Save to Database', index: 0 }]
      ]
    },
    'Save to Database': {
      main: [
        [{ node: 'Send Welcome Email', index: 0 }]
      ]
    },
    'Send Welcome Email': {
      main: [
        [{ node: 'Send Admin Notification', index: 0 }]
      ]
    },
    'Send Admin Notification': {
      main: [
        [{ node: 'Log Workflow Completion', index: 0 }]
      ]
    }
  },
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    timezone: 'America/Argentina/Buenos_Aires'
  }
};

// Usage: Import this in n8n web UI or deploy via n8n CLI
// n8n import:workflow --input=workflow-welcome-email.js
