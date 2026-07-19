export const RED_FLAGS = [
  { id: 'self_harm', level: 'emergency', terms: ['أؤذي نفسي', 'أقتل نفسي', 'إيذاء نفسي', 'suicide', 'kill myself', 'hurt myself'] },
  { id: 'baby_harm', level: 'emergency', terms: ['أؤذي طفلي', 'أؤذي البيبي', 'hurt my baby', 'harm my baby'] },
  { id: 'breathing', level: 'emergency', terms: ['ضيق تنفس شديد', 'لا أستطيع التنفس', 'can’t breathe', 'cannot breathe', 'chest pain'] },
  { id: 'bleeding', level: 'urgent', terms: ['نزيف شديد', 'فوطة خلال ساعة', 'heavy bleeding', 'soaking a pad'] },
  { id: 'fever', level: 'urgent', terms: ['حرارة 38', 'حمى', 'fever 38', 'high fever'] },
  { id: 'wound', level: 'urgent', terms: ['إفرازات من الجرح', 'الجرح مفتوح', 'ألم الجرح يزداد', 'جرحي يوجعني أكثر', 'wound discharge', 'wound opened'] },
]

export function deterministicSafety(text) {
  const normalized = text.toLowerCase()
  const matches = RED_FLAGS.filter(rule => rule.terms.some(term => normalized.includes(term.toLowerCase())))
  const priority = matches.some(m => m.level === 'emergency') ? 'emergency' : matches.length ? 'urgent' : 'routine'
  return { priority, ruleIds: matches.map(m => m.id) }
}
