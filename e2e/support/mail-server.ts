import { createServer, type Server } from 'node:http'

import { simpleParser } from 'mailparser'
import { SMTPServer } from 'smtp-server'

export type CapturedMail = {
  to: string[]
  subject: string
  html: string
  receivedAt: string
}

const listen = (server: Server | SMTPServer, port: number) =>
  new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => resolve())
  })

/**
 * SMTP giả thay cho Gmail: server gửi mail qua nodemailer như thật, mail được giữ trong bộ nhớ.
 * Test đọc mail qua HTTP: GET /messages?to=<email>
 */
export const startMailServer = async ({ smtpPort, apiPort }: { smtpPort: number; apiPort: number }) => {
  const mails: CapturedMail[] = []

  const smtp = new SMTPServer({
    authOptional: true,
    allowInsecureAuth: true,
    disabledCommands: ['STARTTLS'],
    logger: false,
    onAuth: (auth, _session, callback) => callback(null, { user: auth.username }),
    onData: (stream, session, callback) => {
      simpleParser(stream)
        .then((parsed) => {
          mails.push({
            to: session.envelope.rcptTo.map((rcpt) => rcpt.address.toLowerCase()),
            subject: parsed.subject ?? '',
            html: typeof parsed.html === 'string' ? parsed.html : '',
            receivedAt: new Date().toISOString()
          })
          callback()
        })
        .catch(callback)
    }
  })

  const api = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (req.method !== 'GET' || url.pathname !== '/messages') {
      res.writeHead(404).end()
      return
    }

    const to = url.searchParams.get('to')?.toLowerCase()
    const result = to ? mails.filter((mail) => mail.to.includes(to)) : mails
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result))
  })

  await listen(smtp, smtpPort)
  await listen(api, apiPort)

  return {
    close: async () => {
      await new Promise<void>((resolve) => smtp.close(() => resolve()))
      await new Promise<void>((resolve) => api.close(() => resolve()))
    }
  }
}
