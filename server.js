import express from 'express'
import OpenAI from 'openai'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deterministicSafety } from './lib/safety.js'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.json({ limit: '64kb' }))

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['acknowledgement', 'dimensions', 'followUpQuestions', 'plan', 'supportTask', 'providerSummary'],
  properties: {
    acknowledgement: { type: 'string' },
    dimensions: {
      type: 'array', minItems: 6, maxItems: 6,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'label', 'score', 'evidence'],
        properties: {
          id: { type: 'string', enum: ['physical', 'sleep', 'mood', 'nutrition', 'feeding', 'support'] },
          label: { type: 'string' }, score: { type: 'integer', minimum: 0, maximum: 100 },
          evidence: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    followUpQuestions: { type: 'array', maxItems: 3, items: { type: 'string' } },
    plan: {
      type: 'array', minItems: 3, maxItems: 4,
      items: {
        type: 'object', additionalProperties: false,
        required: ['time', 'title', 'detail', 'owner'],
        properties: { time: { type: 'string' }, title: { type: 'string' }, detail: { type: 'string' }, owner: { type: 'string' } },
      },
    },
    supportTask: { type: 'string' },
    providerSummary: {
      type: 'object', additionalProperties: false,
      required: ['reported', 'organizedConcerns', 'unknowns'],
      properties: {
        reported: { type: 'array', items: { type: 'string' } },
        organizedConcerns: { type: 'array', items: { type: 'string' } },
        unknowns: { type: 'array', items: { type: 'string' } },
      },
    },
  },
}

app.post('/api/analyze', async (req, res) => {
  const text = String(req.body?.text || '').trim()
  if (text.length < 8 || text.length > 5000) return res.status(400).json({ error: 'Please provide a check-in between 8 and 5,000 characters.' })
  const safety = deterministicSafety(text)
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured.', safety })

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6',
      reasoning: { effort: 'medium' },
      instructions: `You are NAFAS, a warm Arabic-first postpartum recovery navigation assistant.
You do not diagnose, prescribe, change medication, or reassure away risk. Use the mother's language and answer in Arabic unless she writes in English.
Turn her unstructured account into a low-cognitive-load recovery plan. Scores reflect recovery LOAD, where 100 is highest load.
Never invent a negative finding. Put missing safety facts in unknowns. Keep the plan to at most four specific actions.
The deterministic safety system result is: ${JSON.stringify(safety)}. Do not downgrade it.`,
      input: `Postpartum day: 12. Birth: caesarean. Support person: husband. Mother's check-in:\n${text}`,
      text: { format: { type: 'json_schema', name: 'nafas_recovery_checkin', strict: true, schema } },
    })
    res.json({ ...JSON.parse(response.output_text), safety, model: 'gpt-5.6' })
  } catch (error) {
    console.error('OpenAI request failed:', error?.message)
    res.status(502).json({ error: 'The analysis service is temporarily unavailable.', safety })
  }
})

app.use(express.static(path.join(__dirname, 'dist')))
app.get('/{*splat}', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`NAFAS listening on http://localhost:${port}`))
