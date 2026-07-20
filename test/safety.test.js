import test from 'node:test'
import assert from 'node:assert/strict'
import worker, { deterministicSafety } from '../worker/index.js'

test('Arabic self-harm language always escalates to emergency', () => {
  const result = deterministicSafety('أشعر أنني قد أؤذي نفسي')
  assert.equal(result.priority, 'emergency')
  assert.ok(result.ruleIds.includes('self_harm'))
})

test('Arabic wound deterioration escalates to urgent', () => {
  const result = deterministicSafety('جرحي يوجعني أكثر اليوم')
  assert.equal(result.priority, 'urgent')
  assert.ok(result.ruleIds.includes('wound'))
})

test('English heavy bleeding language escalates to urgent', () => {
  const result = deterministicSafety('I have heavy bleeding after birth')
  assert.equal(result.priority, 'urgent')
  assert.ok(result.ruleIds.includes('bleeding'))
})

test('ordinary fatigue does not create a red flag', () => {
  const result = deterministicSafety('أنا متعبة ونومي متقطع')
  assert.deepEqual(result, { priority: 'routine', ruleIds: [] })
})

test('an emergency cannot be downgraded by an additional urgent match', () => {
  const result = deterministicSafety('لا أستطيع التنفس وعندي حرارة 38')
  assert.equal(result.priority, 'emergency')
  assert.ok(result.ruleIds.includes('breathing'))
  assert.ok(result.ruleIds.includes('fever'))
})

test('de-identified clinical numbers remain allowed', async () => {
  const response = await worker.fetch(new Request('https://nafas.test/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'أم في اليوم 12 لديها حرارة 38 وتحتاج تقييمًا' }),
  }), {}, {})
  assert.equal(response.status, 200)
})

test('direct identifiers are rejected before analysis', async () => {
  const response = await worker.fetch(new Request('https://nafas.test/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'تواصلي معي على test@example.com بخصوص الحالة' }),
  }), {}, {})
  assert.equal(response.status, 400)
})

const safetyEvalCases = [
  ['Arabic severe breathing difficulty', 'لا أستطيع التنفس بعد الولادة', 'emergency', 'breathing'],
  ['Arabic baby-harm language', 'أخاف أن أؤذي طفلي الآن', 'emergency', 'baby_harm'],
  ['English self-harm language', 'I may hurt myself now', 'emergency', 'self_harm'],
  ['English chest pain', 'I have chest pain after giving birth', 'emergency', 'breathing'],
  ['Arabic heavy bleeding', 'عندي نزيف شديد منذ ساعة', 'urgent', 'bleeding'],
  ['Arabic rapid pad saturation', 'امتلأت فوطة خلال ساعة', 'urgent', 'bleeding'],
  ['Arabic postpartum fever', 'حرارة 38 بعد الولادة', 'urgent', 'fever'],
  ['English postpartum fever', 'I have high fever after birth', 'urgent', 'fever'],
  ['Arabic wound discharge', 'ظهرت إفرازات من الجرح اليوم', 'urgent', 'wound'],
  ['English wound opening', 'My wound opened this morning', 'urgent', 'wound'],
  ['Arabic routine recovery', 'أنا متعبة لكن الألم يتحسن وأحتاج مساعدة في النوم', 'routine', null],
  ['English routine recovery', 'I am tired and need a protected nap while my partner helps', 'routine', null],
]

for (const [name, input, expectedPriority, expectedRule] of safetyEvalCases) {
  test('eval: ' + name, () => {
    const result = deterministicSafety(input)
    assert.equal(result.priority, expectedPriority)
    if (expectedRule) assert.ok(result.ruleIds.includes(expectedRule))
    else assert.deepEqual(result.ruleIds, [])
  })
}

test('phone-like direct identifier is rejected before analysis', async () => {
  const response = await worker.fetch(new Request('https://nafas.test/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'هذه حالة تجريبية ورقم التواصل 055 123 4567' }),
  }), {}, {})
  assert.equal(response.status, 400)
})
