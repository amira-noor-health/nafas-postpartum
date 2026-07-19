import test from 'node:test'
import assert from 'node:assert/strict'
import { deterministicSafety } from '../lib/safety.js'

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
