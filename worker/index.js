const RED_FLAGS = [
  { id: 'self_harm', level: 'emergency', terms: ['أؤذي نفسي', 'أقتل نفسي', 'إيذاء نفسي', 'suicide', 'kill myself', 'hurt myself'] },
  { id: 'baby_harm', level: 'emergency', terms: ['أؤذي طفلي', 'أؤذي البيبي', 'hurt my baby', 'harm my baby'] },
  { id: 'breathing', level: 'emergency', terms: ['ضيق تنفس شديد', 'لا أستطيع التنفس', 'can’t breathe', "can't breathe", 'cannot breathe', 'chest pain'] },
  { id: 'bleeding', level: 'urgent', terms: ['نزيف شديد', 'فوطة خلال ساعة', 'heavy bleeding', 'soaking a pad'] },
  { id: 'fever', level: 'urgent', terms: ['حرارة 38', 'حمى', 'fever 38', 'high fever'] },
  { id: 'wound', level: 'urgent', terms: ['إفرازات من الجرح', 'الجرح مفتوح', 'ألم الجرح يزداد', 'جرحي يوجعني أكثر', 'wound discharge', 'wound opened'] },
]

function deterministicSafety(text) {
  const normalized = text.toLowerCase()
  const matches = RED_FLAGS.filter((rule) => rule.terms.some((term) => normalized.includes(term.toLowerCase())))
  const priority = matches.some((match) => match.level === 'emergency')
    ? 'emergency'
    : matches.length
      ? 'urgent'
      : 'routine'
  return { priority, ruleIds: matches.map((match) => match.id) }
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['acknowledgement', 'dimensions', 'followUpQuestions', 'plan', 'supportTask', 'providerSummary'],
  properties: {
    acknowledgement: { type: 'string' },
    dimensions: {
      type: 'array',
      minItems: 6,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'score', 'evidence'],
        properties: {
          id: { type: 'string', enum: ['physical', 'sleep', 'mood', 'nutrition', 'feeding', 'support'] },
          label: { type: 'string' },
          score: { type: 'integer', minimum: 0, maximum: 100 },
          evidence: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    followUpQuestions: { type: 'array', maxItems: 3, items: { type: 'string' } },
    plan: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['time', 'title', 'detail', 'owner'],
        properties: {
          time: { type: 'string' },
          title: { type: 'string' },
          detail: { type: 'string' },
          owner: { type: 'string' },
        },
      },
    },
    supportTask: { type: 'string' },
    providerSummary: {
      type: 'object',
      additionalProperties: false,
      required: ['reported', 'organizedConcerns', 'unknowns'],
      properties: {
        reported: { type: 'array', items: { type: 'string' } },
        organizedConcerns: { type: 'array', items: { type: 'string' } },
        unknowns: { type: 'array', items: { type: 'string' } },
      },
    },
  },
}

const defaultDimensions = [
  { id: 'physical', label: 'الجسد والألم', score: 78, evidence: ['ألم الجرح يزداد'] },
  { id: 'sleep', label: 'النوم والطاقة', score: 86, evidence: ['ثلاث ساعات نوم فقط'] },
  { id: 'mood', label: 'المزاج', score: 67, evidence: ['بكاء وشعور بالفشل'] },
  { id: 'nutrition', label: 'التغذية', score: 58, evidence: ['وجبة واحدة اليوم'] },
  { id: 'feeding', label: 'الرضاعة', score: 44, evidence: ['رضاعة متكررة'] },
  { id: 'support', label: 'الدعم', score: 72, evidence: ['الحاجة إلى نافذة راحة محمية'] },
]

const defaultDimensionsEn = [
  { id: 'physical', label: 'Body & pain', score: 78, evidence: ['Wound pain is increasing'] },
  { id: 'sleep', label: 'Sleep & energy', score: 86, evidence: ['Only three hours of sleep'] },
  { id: 'mood', label: 'Mood', score: 67, evidence: ['Crying and self-blame'] },
  { id: 'nutrition', label: 'Nutrition', score: 58, evidence: ['One meal today'] },
  { id: 'feeding', label: 'Infant feeding', score: 44, evidence: ['Frequent feeding'] },
  { id: 'support', label: 'Support', score: 72, evidence: ['Needs a protected rest window'] },
]

function fallbackResult(text, safety, reason = null) {
  const english = /[A-Za-z]/.test(text) && !/[\u0600-\u06FF]/.test(text)
  if (english && safety.priority === 'emergency') {
    return {
      acknowledgement: 'What you described needs immediate human help. Do not stay alone. Ask a trusted adult to remain with you and the baby now.',
      dimensions: defaultDimensionsEn,
      followUpQuestions: [],
      plan: [
        { time: 'Now', title: 'Contact local emergency services', detail: 'Or go to the nearest emergency department immediately. Do not drive yourself.', owner: 'A trusted person calls and accompanies you' },
        { time: 'Now', title: 'Do not stay alone', detail: 'Place the baby with a trusted adult and move away from anything that could cause harm.', owner: 'Care circle' },
        { time: 'Within minutes', title: 'Use the same direct words', detail: 'Tell the emergency team exactly what you are feeling and when it started.', owner: 'Mother with support person' },
      ],
      supportTask: 'Stay with her and the baby now. Contact local emergency services or take her to the nearest emergency department. Do not leave her alone.',
      providerSummary: {
        reported: [text],
        organizedConcerns: ['A phrase triggered the deterministic emergency safety path.'],
        unknowns: ['Is there an immediate plan or available means?', 'Is a trusted adult present now?'],
      },
      safety,
      mode: 'safety',
      model: 'Deterministic safety check',
      warning: reason,
    }
  }
  if (english) {
    return {
      acknowledgement: 'You are carrying increasing pain, very limited sleep and little food while also blaming yourself. That is not personal failure; it is a recovery load that exceeds today’s available support.',
      dimensions: defaultDimensionsEn,
      followUpQuestions: ['Is your temperature 38°C or higher?', 'Is there spreading redness or wound discharge?', 'Are you soaking a pad within one hour?'],
      plan: [
        { time: 'Now', title: 'Check temperature and wound', detail: 'Look for spreading redness, discharge, wound separation or temperature of 38°C or higher.', owner: 'Mother' },
        { time: 'Within one hour', title: 'Food and water before chores', detail: 'Have water and a simple meal with protein and carbohydrates.', owner: 'Support person prepares it' },
        { time: 'Today', title: 'Contact a healthcare professional', detail: 'Because the wound pain is increasing rather than improving. A short summary is ready.', owner: 'Mother' },
        { time: 'This evening', title: 'Protected sleep window', detail: 'Ninety minutes without baby duty or household decisions.', owner: 'Support person with the baby' },
      ],
      supportTask: 'Take the baby for 90 minutes and bring her a simple meal and water. Protect this rest window and handle the small household decisions yourself.',
      providerSummary: {
        reported: [text],
        organizedConcerns: ['Increasing caesarean wound pain.', 'Very limited sleep.', 'Limited food intake.', 'Crying and self-blame.'],
        unknowns: ['Temperature', 'Wound appearance', 'Bleeding severity', 'Pain score out of 10'],
      },
      safety,
      mode: 'demo',
      model: 'Safe fallback',
      warning: reason,
    }
  }
  if (safety.priority === 'emergency') {
    return {
      acknowledgement: 'ما تصفينه يحتاج مساعدة بشرية فورية الآن. لا تبقي وحدك، واطلبي من شخص موثوق أن يبقى معك ومع الطفل.',
      dimensions: defaultDimensions,
      followUpQuestions: [],
      plan: [
        { time: 'الآن', title: 'اتصلي بالطوارئ المحلية', detail: 'أو توجهي إلى أقرب قسم طوارئ فورًا. لا تقودي بنفسك.', owner: 'شخص موثوق يتصل ويرافقك' },
        { time: 'الآن', title: 'لا تبقي وحدك', detail: 'أعطي الطفل لشخص بالغ موثوق وأبعدي أي وسيلة قد تسبب أذى.', owner: 'دائرة الدعم' },
        { time: 'خلال دقائق', title: 'أخبريهم بالكلمات نفسها', detail: 'قولي بوضوح ما تشعرين به ومتى بدأ.', owner: 'أنتِ مع المرافق' },
      ],
      supportTask: 'ابقَ معها ومع الطفل الآن، واتصل بالطوارئ المحلية أو اصطحبها إلى أقرب قسم طوارئ. لا تتركها وحدها.',
      providerSummary: {
        reported: [text],
        organizedConcerns: ['ظهرت عبارة تندرج ضمن فحص السلامة الطارئ.'],
        unknowns: ['هل توجد خطة أو وسيلة متاحة؟', 'هل يوجد شخص بالغ موثوق حاضر الآن؟'],
      },
      safety,
      mode: 'safety',
      model: 'فحص سلامة حتمي',
      warning: reason,
    }
  }

  return {
    acknowledgement: 'أنتِ تتعاملين مع ألم متزايد، نقص شديد في النوم، وقلة الطعام—وفي الوقت نفسه تلومين نفسكِ. هذا ليس فشلًا منكِ؛ هذا عبء تعافٍ أكبر من الموارد المتاحة لكِ اليوم.',
    dimensions: defaultDimensions,
    followUpQuestions: ['هل حرارتك 38° أو أكثر؟', 'هل يوجد احمرار منتشر أو إفرازات من الجرح؟', 'هل النزيف يملأ فوطة خلال ساعة؟'],
    plan: [
      { time: 'الآن', title: 'افحصي حرارتك والجرح', detail: 'تحققي من الاحمرار المنتشر، الإفرازات، تباعد الجرح أو حرارة 38° فأكثر.', owner: 'أنتِ' },
      { time: 'خلال ساعة', title: 'وجبة وماء قبل أي مهمة', detail: 'كوب ماء ووجبة سهلة تحتوي بروتينًا وكربوهيدرات.', owner: 'شخص الدعم يحضّرها' },
      { time: 'اليوم', title: 'تواصلي مع مقدم الرعاية', detail: 'لأن ألم الجرح يزداد بدل أن يتحسن. جهزنا لك ملخصًا قصيرًا.', owner: 'أنتِ' },
      { time: 'هذا المساء', title: 'نافذة نوم محمية', detail: '90 دقيقة دون مسؤولية الطفل أو أسئلة منزلية.', owner: 'شخص الدعم مع الطفل' },
    ],
    supportTask: 'خذ الطفل لمدة 90 دقيقة، وأحضر لها وجبة وماء. هذه نافذة نوم محمية—اتخذ القرارات المنزلية الصغيرة بنفسك.',
    providerSummary: {
      reported: [text],
      organizedConcerns: ['ازدياد ألم جرح القيصرية.', 'نوم متقطع وقليل.', 'تناول غذائي محدود.', 'بكاء وشعور بالفشل.'],
      unknowns: ['درجة الحرارة', 'شكل الجرح', 'شدة النزيف', 'درجة الألم من 10'],
    },
    safety,
    mode: 'demo',
    model: 'نمط عرض آمن',
    warning: reason,
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

async function analyzeRequest(request, env) {
  const startedAt = Date.now()
  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'تعذر قراءة الرسالة.' }, 400)
  }

  const text = String(body?.text || '').trim()
  const outputLanguage = body?.language === 'en'
    ? 'English'
    : body?.language === 'ar'
      ? 'Arabic'
      : /[\u0600-\u06FF]/.test(text)
        ? 'Arabic'
        : 'English'
  if (text.length < 8 || text.length > 5000) {
    return jsonResponse({ error: 'اكتبي بين 8 و5,000 حرف.' }, 400)
  }
  const containsEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
  const containsLongNumber = /[0-9٠-٩](?:[0-9٠-٩\s()+-]{6,})[0-9٠-٩]/.test(text)
  if (containsEmail || containsLongNumber) {
    return jsonResponse({ error: 'أزيلي البريد الإلكتروني أو رقم الهاتف/الهوية، واستخدمي حالة منزوعة الهوية فقط.' }, 400)
  }

  const safety = deterministicSafety(text)
  const meta = (path, model = null) => ({
    path,
    model,
    latencyMs: Date.now() - startedAt,
    safeguards: ['PII gate', 'deterministic red-flag check', 'structured output'],
    stored: false,
  })
  if (safety.priority === 'emergency') {
    return jsonResponse({ ...fallbackResult(text, safety), meta: meta('deterministic-safety-bypass', 'No model call') })
  }
  if (!env.OPENAI_API_KEY) {
    return jsonResponse({ ...fallbackResult(text, safety, 'التحليل المباشر غير مفعّل بعد.'), meta: meta('safe-fallback', 'No API key') })
  }

  const instructions = [
    'You are NAFAS, a warm postpartum recovery navigation assistant designed Arabic-first and able to serve English judge demos.',
    'You do not diagnose, prescribe, change medication, or reassure away risk.',
    'Required output language: ' + outputLanguage + '. Every user-facing string in every JSON field must use that language.',
    'Turn her unstructured account into a low-cognitive-load recovery plan.',
    'Scores reflect recovery LOAD, where 100 is highest load.',
    'Never invent a negative finding. Put missing safety facts in unknowns.',
    'Keep the plan to at most four specific actions.',
    'The deterministic safety result is: ' + JSON.stringify(safety) + '. Never downgrade it.',
  ].join('\n')

  const model = env.OPENAI_MODEL || 'gpt-5.6-terra'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 28000)

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: 'Bearer ' + env.OPENAI_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: 'low' },
        max_output_tokens: 1400,
        instructions,
        input: 'Postpartum day: 12. Birth: caesarean. Support person: husband. Mother check-in:\n' + text,
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'nafas_recovery_checkin',
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    })

    if (!openaiResponse.ok) throw new Error('OpenAI status ' + openaiResponse.status)
    const payload = await openaiResponse.json()
    const outputText = payload.output_text || payload.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === 'output_text')?.text
    if (!outputText) throw new Error('OpenAI response had no output text')
    const result = JSON.parse(outputText)
    return jsonResponse({ ...result, safety, mode: 'live', model, meta: meta('live-gpt-structured-output', model) })
  } catch (error) {
    console.error('NAFAS analysis failed:', error instanceof Error ? error.message : 'unknown error')
    return jsonResponse({
      ...fallbackResult(text, safety, 'تعذر التحليل المباشر مؤقتًا؛ عُرضت الخطة الآمنة الاحتياطية.'),
      meta: meta('safe-fallback', model),
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

const page = String.raw`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#173c32">
    <meta name="description" content="نَفَس: رفيق تعافٍ ذكي وآمن للأم بعد الولادة، يحوّل قصتها إلى فحص سلامة وخطة 24 ساعة ومهام دعم واضحة.">
    <title>نَفَس | تعافيكِ مسؤولية مشتركة</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
      :root{--ink:#173c32;--sage:#6f8f7d;--mint:#dce9df;--cream:#f7f5ef;--paper:#fffefa;--gold:#b98a55;--line:#dedfd7;--rose:#a85e50;--rose-soft:#fff8f4;color:#223d35;background:#f7f5ef;font-family:'Noto Sans Arabic',system-ui,sans-serif;font-synthesis:none;text-rendering:optimizeLegibility}
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-width:320px;min-height:100vh;background:radial-gradient(circle at 12% 4%,#deebe2 0,transparent 25%),radial-gradient(circle at 90% 18%,#f1e4d6 0,transparent 20%),var(--cream);color:var(--ink)}button,textarea{font:inherit}button{cursor:pointer}.hidden{display:none!important}
      .app{min-height:100vh}.topbar{height:86px;display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:auto;padding:0 34px;border-bottom:1px solid rgba(23,60,50,.09)}.top-actions{display:flex;align-items:center;gap:9px}.live-chip{display:flex;align-items:center;gap:6px;border:1px solid #cad9cf;background:#f4faf6;color:#456858;border-radius:20px;padding:7px 10px;font-size:9px;font-weight:700;letter-spacing:.4px}.live-chip i{width:6px;height:6px;background:#4f916c;border-radius:50%;box-shadow:0 0 0 4px #dceddf}.judge-toggle{border:1px solid #b9c9bf;background:var(--paper);color:var(--ink);border-radius:20px;padding:8px 13px;font-size:10px;font-weight:700;letter-spacing:.5px}
      .brand{display:flex;align-items:center;gap:12px}.brand-mark{width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--sage);border-radius:50% 50% 45% 55%;font-family:'Noto Kufi Arabic';font-size:20px;transform:rotate(-5deg)}.brand-copy{display:flex;flex-direction:column;line-height:1.25}.brand-copy strong{font-family:'Noto Kufi Arabic';letter-spacing:2px;font-size:18px}.brand-copy small{font-size:10px;color:#718179}.avatar{border:0;background:var(--ink);color:#fff;border-radius:50%;width:38px;height:38px}
      main{max-width:1040px;margin:auto;padding:58px 28px 76px}.home{max-width:790px;text-align:center}.eyebrow{color:var(--sage);font-size:13px;font-weight:600;letter-spacing:.5px;display:flex;justify-content:center;align-items:center;gap:8px}.eyebrow i{width:22px;height:1px;background:var(--gold)}
      h1{font-family:'Noto Kufi Arabic';font-size:48px;line-height:1.45;margin:15px 0;font-weight:500;letter-spacing:-1.5px}h1 em{font-family:'Noto Sans Arabic';color:var(--sage);font-weight:300;font-style:normal}.intro{max-width:650px;margin:0 auto 22px;color:#60736c;line-height:1.9;font-size:16px}.hero-proof{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:0 auto 27px}.hero-proof span{border:1px solid #d7ddd7;background:#ffffffa8;border-radius:20px;padding:6px 10px;color:#65786f;font-size:9px;font-weight:600}
      .prototype-note{display:flex;gap:10px;align-items:flex-start;text-align:right;background:#eef4f0;border:1px solid #d6e4da;border-radius:13px;padding:12px 14px;margin:0 0 14px;color:#536a60;font-size:11px;line-height:1.8}.prototype-note b{color:var(--ink)}.prototype-note>span{flex:0 0 auto;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#d7e8dc;color:#315a4b;font-weight:700}
      .checkin-card{background:rgba(255,254,250,.96);border:1px solid #e3e1d7;border-radius:24px;padding:25px;text-align:right;box-shadow:0 18px 60px rgba(35,62,52,.08)}.prompt{font-weight:600;display:flex;align-items:center;gap:9px;margin-bottom:14px}.pulse-dot{width:9px;height:9px;border-radius:50%;background:#b78772;box-shadow:0 0 0 6px #f0ded6}
      textarea{width:100%;min-height:132px;resize:vertical;border:0;border-radius:15px;background:#f6f4ed;padding:18px;color:var(--ink);font-size:15px;line-height:1.9;outline:none}textarea:focus{box-shadow:inset 0 0 0 1.5px #90aa9b}textarea::placeholder{color:#9ba49f}.voice-row{display:flex;align-items:center;justify-content:space-between;padding:12px 2px 16px}.mic{border:0;background:transparent;color:var(--sage);font-weight:600;display:flex;align-items:center;gap:8px}.mic span{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--mint);font-size:18px}.mic.recording span{background:#efd4ce;animation:pulse 1s infinite}.private{color:#8a948e;font-size:11px}
      .primary{border:0;background:var(--ink);color:white;border-radius:13px;min-height:52px;padding:0 26px;font-weight:600;box-shadow:0 9px 18px rgba(23,60,50,.16)}.checkin-card>.primary{width:100%}.primary:disabled{opacity:.7;cursor:wait}.trust-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border-top:1px solid #dddcd4;padding-top:21px;margin-top:26px}.trust-row div{display:flex;flex-direction:column;border-left:1px solid #dddcd4}.trust-row div:last-child{border:0}.trust-row b{font-size:12px}.trust-row span{font-size:11px;color:#89948e}
      .scenario-lab{margin:24px 0 4px;text-align:right}.scenario-head{display:flex;align-items:end;justify-content:space-between;margin-bottom:12px}.scenario-head small{color:var(--sage);font-weight:700}.scenario-head h2{font:600 18px 'Noto Kufi Arabic';margin:3px 0}.scenario-head>span{font-size:9px;color:#829087}.scenario-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.scenario{border:1px solid #dfe2dc;background:#fffefa;border-radius:15px;padding:14px;text-align:right;color:var(--ink);min-height:100px;display:flex;flex-direction:column;justify-content:space-between;transition:transform .2s,border-color .2s,box-shadow .2s}.scenario:hover,.scenario:focus-visible{transform:translateY(-2px);border-color:#91aa9b;box-shadow:0 10px 24px #253d3320}.scenario b{font-size:12px}.scenario span{font-size:9px;color:#7d8b84;line-height:1.6}.scenario i{font-style:normal;font-size:9px;font-weight:700;color:#4f795f}.scenario.urgent i{color:#a06b42}.scenario.emergency i{color:#a74f49}
      .pipeline-section{margin:38px auto 0;padding:25px;border:1px solid #d9dfd9;border-radius:22px;background:#eff4f0;text-align:right}.pipeline-head{display:flex;justify-content:space-between;align-items:start;gap:20px}.pipeline-head small{font-size:9px;color:#61776b;font-weight:700;text-transform:uppercase;letter-spacing:1px}.pipeline-head h2{font:600 19px 'Noto Kufi Arabic';margin:3px 0}.pipeline-head p{font-size:10px;color:#718079;max-width:330px;margin:0;line-height:1.7}.pipeline-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:18px}.pipeline-card{position:relative;background:#fffefa;border:1px solid #dfe4df;border-radius:13px;padding:12px;min-height:86px}.pipeline-card:not(:last-child):after{content:'←';position:absolute;left:-8px;top:33px;color:#9caf9f;font-size:11px}.pipeline-card strong{display:block;font-size:10px;margin-top:8px}.pipeline-card span{font-size:8px;color:#7d8b84;line-height:1.5;display:block}.pipeline-num{width:21px;height:21px;display:grid;place-items:center;background:#dfeae3;border-radius:7px;color:#315c4b;font-size:9px;font-weight:700}
      .status{min-height:26px;color:#8c5a4d;font-size:12px;padding-top:8px}.loading-panel{display:grid;grid-template-columns:32px 1fr;gap:11px;align-items:center;margin-top:10px;padding:11px 13px;background:#edf3ef;border-radius:12px;color:#597066;text-align:right}.loading-orbit{width:30px;height:30px;border:2px solid #bfd0c5;border-top-color:var(--ink);border-radius:50%;animation:spin 1s linear infinite}.loading-panel b{display:block;font-size:10px}.loading-panel span{font-size:9px;color:#819087}.spinner{display:inline-block;width:16px;height:16px;border:2px solid #fff6;border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;margin-left:8px;vertical-align:middle}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{50%{transform:scale(1.15)}}
      .back{border:0;background:transparent;color:#71847a;padding:0;margin-bottom:22px}.results-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:34px}.results-head .eyebrow{justify-content:flex-start}.results-head h1{font-size:39px;margin:8px 0}.score{width:135px;height:135px;border:9px solid #e3d5c5;border-left-color:#b87f63;border-radius:50%;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--paper)}.score strong{font-size:34px}.score span{font-size:10px;line-height:1.5;color:#6f7c76}
      .safety-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:20px;padding:23px;border:1px solid #e0b9aa;border-radius:18px;background:var(--rose-soft);box-shadow:0 9px 25px rgba(100,53,40,.05)}.safety-card.routine{border-color:#b8d0c0;background:#f4faf6}.safety-card.emergency{border-color:#b34a43;background:#fff1ef}.safety-icon{width:46px;height:46px;border-radius:50%;background:#f0d8ce;color:#9e5749;display:grid;place-items:center;font:bold 23px serif}.safety-card.routine .safety-icon{background:#dcebe1;color:#38614e}.safety-label{color:#a75e50;font-size:11px;font-weight:700}.safety-card.routine .safety-label{color:#47745d}.safety-card h2{margin:3px 0;font-size:17px}.safety-card p{margin:0;font-size:12px;color:#796d68}.safety-card button{background:var(--rose);color:white;border:0;border-radius:10px;padding:12px 18px;white-space:nowrap}.safety-card.routine button{background:#47745d}
      .insight{display:flex;gap:17px;padding:28px 8px 24px;border-bottom:1px solid var(--line)}.quote{font:50px Georgia;color:#b6c9bd;line-height:1}.insight-title{font-size:11px;color:var(--sage);font-weight:700}.mode-badge{display:inline-block;background:#dce9df;color:#315a4b;border-radius:12px;padding:3px 8px;margin-inline-start:8px;font-size:9px}.insight p{margin:6px 0;color:#52665f;line-height:1.9;font-size:14px}.warning{font-size:10px!important;color:#9b6b58!important}
      .load-section,.plan-section{padding:34px 0;border-bottom:1px solid var(--line)}.section-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:23px}.section-title small{color:var(--sage);font-weight:600}.section-title h2{font-size:21px;margin:2px 0}.section-title>span{font-size:11px;color:#75857d}.map-layout{display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:stretch}.radar-card{background:linear-gradient(145deg,#173c32,#285648);color:white;border-radius:22px;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;box-shadow:0 17px 34px #173c3230}.radar-card svg{width:220px;max-width:100%;height:auto;overflow:visible}.radar-grid{fill:none;stroke:#ffffff26;stroke-width:1}.radar-axis{stroke:#ffffff24;stroke-width:1}.radar-shape{fill:#d6b99055;stroke:#f0d2a8;stroke-width:2;filter:drop-shadow(0 5px 12px #0004)}.radar-dot{fill:#fff4df;stroke:#a97851;stroke-width:1.5}.radar-card b{font-size:11px;margin-top:8px}.radar-card span{font-size:8px;color:#b9cec4}.load-grid{display:grid;grid-template-columns:1fr;gap:8px}.load-item{display:grid;grid-template-columns:auto 1fr 34px;align-items:center;gap:12px;background:var(--paper);padding:12px;border:1px solid #e5e5dd;border-radius:13px}.dim-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#e5eee8}.dim-icon.high{background:#efddd4}.dim-icon.mid{background:#eee5d5}.dim-copy b{font-size:12px}.bar{height:4px;background:#eaebe6;border-radius:5px;margin-top:7px;overflow:hidden}.bar i{display:block;height:100%;background:#7c9a88;transition:width .8s ease}.bar i.high{background:#bd7f66}.bar i.mid{background:#b69a68}.load-item>strong{font-size:13px;color:#6d7f76}
      .pill{background:#e2ebe5;padding:6px 11px;border-radius:20px;color:var(--ink)!important}.steps{display:grid;grid-template-columns:1fr 1fr;gap:12px}.steps article{display:flex;gap:14px;background:var(--paper);border:1px solid #e3e3db;border-radius:14px;padding:17px}.step-num{font:500 12px 'Noto Kufi Arabic';color:#9a866d}.steps small{color:#9a866d;font-size:10px}.steps h3{font-size:14px;margin:2px 0}.steps p{font-size:11px;line-height:1.7;color:#718079;margin:0 0 8px}.owner{font-size:10px;color:#557566;background:#e5ede8;padding:4px 8px;border-radius:10px}
      .support-card{margin:30px 0;background:linear-gradient(135deg,#173c32,#255547);color:white;border-radius:22px;padding:27px 30px;display:flex;gap:25px;align-items:center;justify-content:space-between;box-shadow:0 16px 34px #173c3225}.support-card small{color:#a9c4b5}.support-card h2{margin:4px 0;font-size:20px}.support-card p{font-size:12px;line-height:1.9;color:#d9e5de;max-width:600px}.support-actions{display:flex;gap:8px;flex-direction:column}.support-card button{border:1px solid #8eab9c;background:transparent;color:white;border-radius:10px;padding:11px 15px;white-space:nowrap}.support-card button:first-child{background:#fffefa;color:var(--ink);border-color:#fffefa}.trace-strip{display:flex;flex-wrap:wrap;gap:7px;margin:-11px 0 28px}.trace-strip span{font-size:9px;background:#edf3ef;border:1px solid #d5e1d9;color:#587064;border-radius:18px;padding:5px 9px}.bottom-actions{display:flex;justify-content:flex-end;gap:10px}.doctor{border:1px solid #cfd7d1;background:var(--paper);color:var(--ink);border-radius:13px;padding:0 22px;min-height:52px}
      .care-overlay{position:fixed;inset:0;background:#102c25cc;z-index:20;display:grid;place-items:center;padding:20px;backdrop-filter:blur(8px)}.care-modal{width:min(440px,100%);background:var(--cream);border-radius:26px;padding:24px;box-shadow:0 30px 90px #0007;text-align:right}.care-top{display:flex;justify-content:space-between;align-items:center}.care-top button{border:0;background:#e5ebe7;border-radius:50%;width:32px;height:32px}.care-badge{display:inline-flex;gap:6px;align-items:center;background:#dce9df;border-radius:18px;padding:6px 10px;font-size:9px;color:#3f6554;margin:20px 0 10px}.care-modal h2{font:600 23px 'Noto Kufi Arabic';margin:0}.care-modal>p{color:#687a72;line-height:1.8;font-size:12px}.care-task{background:#fffefa;border:1px solid #dddcd4;border-radius:17px;padding:18px;margin:18px 0}.care-task small{color:#8a958f;font-size:9px}.care-task p{font-size:14px;line-height:1.8;margin:6px 0}.care-task span{font-size:10px;color:#527060}.care-modal>.primary{width:100%}.accepted{background:#e1eee5!important;color:#315b49!important;box-shadow:none!important}
      .summary-page{max-width:880px}.summary-sheet{background:var(--paper);border:1px solid #e1e0d7;border-radius:22px;padding:42px;box-shadow:0 18px 60px #263e3420}.sheet-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:20px}.sheet-head>span{font-size:11px;color:#849087}.summary-sheet>h1{font-size:30px;margin:28px 0 3px}.disclaimer{font-size:11px;color:#849087}.patient{display:grid;grid-template-columns:repeat(3,1fr);background:#edf2ee;border-radius:13px;padding:16px;margin:25px 0}.patient div{display:flex;flex-direction:column}.patient small{color:#829088;font-size:10px}.patient b{font-size:12px}.summary-sheet section{border-top:1px solid var(--line);padding:20px 0}.summary-sheet section h3{font-size:13px}.summary-sheet blockquote{background:#f5f3ec;border-right:3px solid var(--sage);padding:16px;margin:0;font-size:12px;line-height:1.9;color:#52645d}.summary-sheet li{font-size:12px;line-height:2;color:#52645d}.unknowns{display:flex;gap:8px;flex-wrap:wrap}.unknowns span{background:#f3e7df;color:#8d6253;border-radius:18px;padding:6px 12px;font-size:10px}.separation{display:flex;gap:13px;background:#eef4f0;border-radius:13px;padding:15px;margin-bottom:20px}.separation>span{width:27px;height:27px;border-radius:50%;background:#769382;color:white;display:grid;place-items:center}.separation p{margin:0;font-size:11px;color:#63756c}.summary-sheet>.primary{width:100%}
      footer{border-top:1px solid #dedfd7;padding:19px 28px;display:flex;justify-content:center;gap:22px;font-size:10px;color:#7a8982;background:#f3f1ea}footer b{color:#9e5f52}.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#173c32;color:white;border-radius:12px;padding:12px 20px;font-size:12px;box-shadow:0 12px 35px #0003;z-index:10}
      [dir='ltr'] body{font-family:Inter,system-ui,sans-serif}[dir='ltr'] h1,[dir='ltr'] .scenario-head h2,[dir='ltr'] .pipeline-head h2,[dir='ltr'] .care-modal h2{font-family:Georgia,serif;letter-spacing:-.6px}[dir='ltr'] .prototype-note,[dir='ltr'] .scenario-lab,[dir='ltr'] .pipeline-section,[dir='ltr'] .checkin-card,[dir='ltr'] .loading-panel,[dir='ltr'] .care-modal{text-align:left}[dir='ltr'] .pipeline-card:not(:last-child):after{content:'→';left:auto;right:-8px}[dir='ltr'] .trust-row div{border-left:0;border-right:1px solid #dddcd4}[dir='ltr'] .trust-row div:last-child{border:0}
      @media(max-width:700px){.topbar{height:72px;padding:0 16px}.brand-copy small,.live-chip{display:none}.judge-toggle{font-size:9px;padding:7px 10px}main{padding:34px 17px 60px}h1{font-size:33px}.intro{font-size:14px}.checkin-card{padding:17px}.scenario-grid{grid-template-columns:1fr}.scenario{min-height:78px}.pipeline-head{flex-direction:column}.pipeline-grid{grid-template-columns:1fr 1fr}.pipeline-card:not(:last-child):after{display:none}.trust-row{gap:9px}.trust-row div{padding:0 5px}.results-head h1{font-size:28px}.score{width:104px;height:104px;border-width:7px}.score strong{font-size:25px}.safety-card{grid-template-columns:auto 1fr}.safety-card button{grid-column:1/-1}.map-layout{grid-template-columns:1fr}.radar-card{min-height:250px}.load-grid,.steps{grid-template-columns:1fr}.support-card{flex-direction:column;align-items:stretch}.support-actions{width:100%}.support-card button{width:100%}.patient{grid-template-columns:1fr;gap:10px}.summary-sheet{padding:24px 18px}.sheet-head{align-items:flex-start;gap:10px}.sheet-head>span{font-size:9px}.bottom-actions{display:grid;grid-template-columns:1fr 1fr}footer{flex-direction:column;gap:2px;text-align:center}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
    </style>
  </head>
  <body>
    <div class="app">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">نَ</span><div class="brand-copy"><strong>نَفَس</strong><small>تعافيكِ… مسؤولية مشتركة</small></div></div>
        <div class="top-actions"><span class="live-chip"><i></i> GPT‑5.6 LIVE</span><button id="language-toggle" class="judge-toggle" type="button">EN • JUDGE MODE</button></div>
      </header>

      <main id="home" class="home">
        <div id="home-eyebrow" class="eyebrow"><i></i> اليوم 12 بعد الولادة</div>
        <h1 id="home-title">مساء الخير يا ليان<br><em>كيف حالكِ فعلًا؟</em></h1>
        <p id="home-intro" class="intro">صوت أم واحد يتحول إلى فحص سلامة، خريطة تعافٍ، خطة 24 ساعة، ومهمة واضحة لمن يدعمها.</p>
        <div class="hero-proof"><span id="proof-one">صوت عربي أولًا</span><span id="proof-two">حماية قبل الذكاء</span><span id="proof-three">لا تخزين للمحادثة</span><span id="proof-four">خطة قابلة للمشاركة</span></div>
        <div class="prototype-note"><span>i</span><div><b id="prototype-title">نموذج مسابقة تعليمي، وليس خدمة طبية.</b><br><span id="prototype-copy">استخدمي حالة خيالية أو منزوعة الهوية فقط. لا تدخلي أسماء حقيقية، أرقام تواصل، سجلات أو معلومات صحية تعريفية.</span></div></div>
        <section class="checkin-card" aria-labelledby="checkin-title">
          <div id="checkin-title" class="prompt"><span class="pulse-dot"></span> صِفي حالة تجريبية منزوعة الهوية</div>
          <textarea id="checkin" maxlength="5000" placeholder="مثلاً: أم في اليوم 12 بعد الولادة لم تنم جيدًا، وجرحها يؤلمها… دون اسم أو معلومات تعريفية"></textarea>
          <div class="voice-row"><button id="voice" class="mic" type="button"><span>◉</span><b id="voice-label">تحدثي بدلًا من الكتابة</b></button><span id="private-label" class="private">⌾ لا تخزين للمحادثة</span></div>
          <button id="analyze" class="primary" type="button">افهمي يومي</button>
          <div id="form-status" class="status" role="status" aria-live="polite"></div>
          <div id="loading-panel" class="loading-panel hidden"><span class="loading-orbit"></span><div><b id="loading-title">بوابة الخصوصية</b><span id="loading-copy">نتأكد أولًا أن الحالة منزوعة الهوية…</span></div></div>
        </section>
        <section class="scenario-lab" aria-labelledby="scenario-title"><div class="scenario-head"><div><small id="scenario-kicker">مختبر العرض</small><h2 id="scenario-title">شاهدي كيف تتغير الاستجابة مع مستوى الخطورة</h2></div><span id="scenario-note">حالات خيالية منزوعة الهوية</span></div><div class="scenario-grid">
          <button class="scenario routine" data-scenario="routine" type="button"><i id="routine-level">تعافٍ روتيني</i><b id="routine-title">تعب ونوم متقطع</b><span id="routine-copy">خطة صغيرة وتوزيع عملي للدعم</span></button>
          <button class="scenario urgent" data-scenario="urgent" type="button"><i id="urgent-level">تقييم اليوم</i><b id="urgent-title">ألم جرح يزداد</b><span id="urgent-copy">علامة لا تُهمل وأسئلة متابعة واضحة</span></button>
          <button class="scenario emergency" data-scenario="emergency" type="button"><i id="emergency-level">تدخل فوري</i><b id="emergency-title">خطر على السلامة</b><span id="emergency-copy">مسار حتمي يتجاوز النموذج فورًا</span></button>
        </div></section>
        <section class="pipeline-section"><div class="pipeline-head"><div><small id="pipeline-kicker">داخل NAFAS</small><h2 id="pipeline-title">قصة واحدة، خمس طبقات حماية وفعل</h2></div><p id="pipeline-copy">لا نطلب من GPT أن يفعل كل شيء. لكل طبقة وظيفة وحدود واضحة.</p></div><div class="pipeline-grid">
          <div class="pipeline-card"><span class="pipeline-num">01</span><strong id="pipe-one-title">صوت أو نص</strong><span id="pipe-one-copy">لغة الأم الطبيعية</span></div>
          <div class="pipeline-card"><span class="pipeline-num">02</span><strong id="pipe-two-title">بوابة الخصوصية</strong><span id="pipe-two-copy">رفض المعرّفات المباشرة</span></div>
          <div class="pipeline-card"><span class="pipeline-num">03</span><strong id="pipe-three-title">فحص حتمي</strong><span id="pipe-three-copy">العلامات الحرجة أولًا</span></div>
          <div class="pipeline-card"><span class="pipeline-num">04</span><strong id="pipe-four-title">GPT‑5.6</strong><span id="pipe-four-copy">مخرجات منظمة لا نص حر</span></div>
          <div class="pipeline-card"><span class="pipeline-num">05</span><strong id="pipe-five-title">فعل مشترك</strong><span id="pipe-five-copy">أم + دعم + مقدم رعاية</span></div>
        </div></section>
        <div class="trust-row"><div><b id="trust-one-title">لا أحكام</b><span id="trust-one-copy">مساحة آمنة لكِ</span></div><div><b id="trust-two-title">لا تشخيص</b><span id="trust-two-copy">إرشاد ودعم آمن</span></div><div><b id="trust-three-title">أنتِ تقررين</b><span id="trust-three-copy">لا مشاركة دون إذنك</span></div></div>
      </main>

      <main id="results" class="hidden">
        <button id="new-checkin" class="back" data-screen="home" type="button">→ تسجيل جديد</button>
        <div class="results-head"><div><div id="results-eyebrow" class="eyebrow"><i></i> استمعتُ إليكِ</div><h1 id="results-title">هذا ما يحتاج<br><em>انتباهنا اليوم</em></h1></div><div class="score"><strong id="score">68</strong><span id="score-label">عبء التعافي<br>اليوم</span></div></div>
        <section id="safety-card" class="safety-card"><div class="safety-icon">!</div><div><span class="safety-label">فحص سلامة مهم</span><h2 id="safety-title">علامة تحتاج الانتباه</h2><p id="safety-copy">سنضع السلامة أولًا قبل خطة اليوم.</p></div><button id="safety-action" type="button">ابدئي 3 أسئلة ←</button></section>
        <section class="insight"><span class="quote">“</span><div><div class="insight-title"><span id="understood-label">ما فهمته منكِ</span> <span id="mode-badge" class="mode-badge">نمط عرض آمن</span></div><p id="acknowledgement"></p><p id="warning" class="warning hidden"></p></div></section>
        <section class="load-section"><div class="section-title"><div><small id="map-kicker">خريطة عبء التعافي</small><h2 id="map-title">الصورة الكاملة، لا عَرَض واحد</h2></div><span id="today-label">اليوم ▾</span></div><div class="map-layout"><div class="radar-card"><svg id="radar" viewBox="0 0 240 240" role="img" aria-label="خريطة عبء التعافي"></svg><b id="radar-title">بصمة التعافي اليوم</b><span id="radar-copy">كلما اتسعت المساحة، زاد العبء</span></div><div id="dimensions" class="load-grid"></div></div></section>
        <section class="plan-section"><div class="section-title"><div><small id="plan-kicker">خطة الـ24 ساعة</small><h2 id="plan-title">أقل عدد من الخطوات، أكبر قدر من الراحة</h2></div><span id="step-count" class="pill">4 خطوات فقط</span></div><div id="steps" class="steps"></div></section>
        <section class="support-card"><div><small id="support-kicker">نقل العبء، لا إضافة نصيحة</small><h2 id="support-title">مهمة واحدة جاهزة لدائرة الدعم</h2><p id="support-task"></p></div><div class="support-actions"><button id="preview-care" type="button">معاينة تجربة الداعم</button><button id="share-task" type="button">مشاركة المهمة ←</button></div></section>
        <div id="trace-strip" class="trace-strip"></div>
        <div class="bottom-actions"><button id="summary-button" class="doctor" type="button">▤ ملخص لمقدم الرعاية</button><button id="save-plan" class="primary" type="button">احفظي خطتي</button></div>
      </main>

      <main id="summary" class="summary-page hidden">
        <button id="back-to-plan" class="back" data-screen="results" type="button">→ العودة للخطة</button>
        <div class="summary-sheet"><div class="sheet-head"><div class="brand"><span class="brand-mark">نَ</span><div class="brand-copy"><strong>نَفَس</strong><small>تعافيكِ… مسؤولية مشتركة</small></div></div><span>ملخص زيارة • 19 يوليو 2026</span></div>
          <h1 id="summary-title">ملخص تعافٍ بعد الولادة</h1><p id="summary-disclaimer" class="disclaimer">أُنشئ هذا الملخص من إفادة الأم لتسهيل التواصل، ولا يمثل تشخيصًا طبيًا.</p>
          <div class="patient"><div><small id="patient-name-label">الاسم</small><b id="patient-name">ليان — حالة تجريبية</b></div><div><small id="stage-label">مرحلة التعافي</small><b id="stage-value">اليوم 12 بعد قيصرية</b></div><div><small id="reason-label">سبب التواصل</small><b id="summary-reason">مراجعة التعافي</b></div></div>
          <section><h3 id="reported-label">ما ذكرته الأم مباشرة</h3><blockquote id="reported-text"></blockquote></section>
          <section><h3 id="concerns-label">نقاط تحتاج تقييمًا</h3><ul id="concerns"></ul></section>
          <section><h3 id="unknowns-label">معلومات ما زالت غير مكتملة</h3><div id="unknowns" class="unknowns"></div></section>
          <div class="separation"><span>✓</span><p><b id="separation-title">فصل المصدر عن الاستنتاج</b><br><span id="separation-copy">يعرض نَفَس كلمات الأم كما هي، ويفصلها بوضوح عن الملاحظات والأسئلة غير المكتملة.</span></p></div>
          <button id="share-summary" class="primary" type="button">مشاركة الملخص بأمان</button>
        </div>
      </main>

      <footer><span id="footer-one">نَفَس لا يقدم تشخيصًا أو بديلًا عن الرعاية الطبية.</span><b id="footer-two">في الطوارئ، اتصلي بخدمات الطوارئ المحلية فورًا.</b></footer>
      <div id="toast" class="toast hidden" role="status" aria-live="polite"></div>
      <div id="care-overlay" class="care-overlay hidden"><div class="care-modal" role="dialog" aria-modal="true" aria-labelledby="care-title"><div class="care-top"><div class="brand"><span class="brand-mark">نَ</span><div class="brand-copy"><strong>نَفَس</strong></div></div><button id="close-care" type="button" aria-label="إغلاق">×</button></div><span id="care-badge" class="care-badge">دائرة الدعم • مهمة واحدة</span><h2 id="care-title">وجودك اليوم يمكن قياسه بفعل واحد</h2><p id="care-copy">هذه المهمة اختارتها الأم من خطتها. لا تحتاج إلى نصائح إضافية—فقط خفّف العبء.</p><div class="care-task"><small id="care-task-label">مهمتك الآن</small><p id="care-task-text"></p><span id="care-time">المدة المقترحة: 60–90 دقيقة</span></div><button id="accept-care" class="primary" type="button">تم—أنا أتولى هذه المهمة</button></div></div>
    </div>

    <script>
      (function () {
        'use strict';
        var currentLanguage = 'ar';
        var currentData = null;
        var loadingTimer = null;
        var loadingStep = 0;
        var checkin = document.getElementById('checkin');
        var analyzeButton = document.getElementById('analyze');
        var formStatus = document.getElementById('form-status');
        var scenarioText = {
          ar: {
            routine: 'هذه حالة خيالية منزوعة الهوية: أم في اليوم الثاني عشر بعد ولادة قيصرية. تشعر بتعب متوسط وتنام بشكل متقطع، وألم الجرح أربعة من عشرة دون حرارة أو إفرازات. تشرب الماء لكن شهيتها قليلة، وزوجها موجود ويمكنه مساعدتها اليوم.',
            urgent: 'هذه حالة خيالية منزوعة الهوية: أم في اليوم الثاني عشر بعد ولادة قيصرية. منذ أمس ألم الجرح يزداد وظهرت إفرازات من الجرح، ولا تعرف درجة حرارتها. نامت ثلاث ساعات فقط ولم تأكل إلا وجبة واحدة، وزوجها موجود معها.',
            emergency: 'هذه حالة خيالية منزوعة الهوية: أم بعد الولادة تقول إنها تفكر في إيذاء نفسي الآن وهي وحدها مع الطفل.',
          },
          en: {
            routine: 'Fictional de-identified case: A mother is on day 12 after a caesarean birth. She has moderate fatigue, fragmented sleep, and wound pain rated 4/10 with no fever or discharge. She is drinking water but eating little, and her partner can help today.',
            urgent: 'Fictional de-identified case: A mother is on day 12 after a caesarean birth. Since yesterday her wound pain has increased and she noticed wound discharge. Her temperature is unknown. She slept three hours, ate once, and her partner is with her.',
            emergency: 'Fictional de-identified case: A postpartum mother says, “I may hurt myself now,” and she is alone with the baby.',
          },
        };
        var translations = {
          ar: {
            'home-eyebrow': '— اليوم 12 بعد الولادة',
            'home-title': 'مساء الخير يا ليان<br><em>كيف حالكِ فعلًا؟</em>',
            'home-intro': 'صوت أم واحد يتحول إلى فحص سلامة، خريطة تعافٍ، خطة 24 ساعة، ومهمة واضحة لمن يدعمها.',
            'proof-one': 'صوت عربي أولًا', 'proof-two': 'حماية قبل الذكاء', 'proof-three': 'لا تخزين للمحادثة', 'proof-four': 'خطة قابلة للمشاركة',
            'prototype-title': 'نموذج مسابقة تعليمي، وليس خدمة طبية.',
            'prototype-copy': 'استخدمي حالة خيالية أو منزوعة الهوية فقط. لا تدخلي أسماء حقيقية، أرقام تواصل، سجلات أو معلومات صحية تعريفية.',
            'checkin-title': '● صِفي حالة تجريبية منزوعة الهوية', 'voice-label': 'تحدثي بدلًا من الكتابة', 'private-label': '⌾ لا تخزين للمحادثة',
            'scenario-kicker': 'مختبر العرض', 'scenario-title': 'شاهدي كيف تتغير الاستجابة مع مستوى الخطورة', 'scenario-note': 'حالات خيالية منزوعة الهوية',
            'routine-level': 'تعافٍ روتيني', 'routine-title': 'تعب ونوم متقطع', 'routine-copy': 'خطة صغيرة وتوزيع عملي للدعم',
            'urgent-level': 'تقييم اليوم', 'urgent-title': 'ألم جرح يزداد', 'urgent-copy': 'علامة لا تُهمل وأسئلة متابعة واضحة',
            'emergency-level': 'تدخل فوري', 'emergency-title': 'خطر على السلامة', 'emergency-copy': 'مسار حتمي يتجاوز النموذج فورًا',
            'pipeline-kicker': 'داخل NAFAS', 'pipeline-title': 'قصة واحدة، خمس طبقات حماية وفعل', 'pipeline-copy': 'لا نطلب من GPT أن يفعل كل شيء. لكل طبقة وظيفة وحدود واضحة.',
            'pipe-one-title': 'صوت أو نص', 'pipe-one-copy': 'لغة الأم الطبيعية', 'pipe-two-title': 'بوابة الخصوصية', 'pipe-two-copy': 'رفض المعرّفات المباشرة',
            'pipe-three-title': 'فحص حتمي', 'pipe-three-copy': 'العلامات الحرجة أولًا', 'pipe-four-title': 'GPT‑5.6', 'pipe-four-copy': 'مخرجات منظمة لا نص حر',
            'pipe-five-title': 'فعل مشترك', 'pipe-five-copy': 'أم + دعم + مقدم رعاية',
            'trust-one-title': 'لا أحكام', 'trust-one-copy': 'مساحة آمنة لكِ', 'trust-two-title': 'لا تشخيص', 'trust-two-copy': 'إرشاد ودعم آمن', 'trust-three-title': 'أنتِ تقررين', 'trust-three-copy': 'لا مشاركة دون إذنك',
            'new-checkin': '→ تسجيل جديد', 'results-eyebrow': '— استمعتُ إليكِ', 'results-title': 'هذا ما يحتاج<br><em>انتباهنا اليوم</em>', 'score-label': 'عبء التعافي<br>اليوم', 'understood-label': 'ما فهمته منكِ',
            'map-kicker': 'خريطة عبء التعافي', 'map-title': 'الصورة الكاملة، لا عَرَض واحد', 'today-label': 'اليوم ▾', 'radar-title': 'بصمة التعافي اليوم', 'radar-copy': 'كلما اتسعت المساحة، زاد العبء',
            'plan-kicker': 'خطة الـ24 ساعة', 'plan-title': 'أقل عدد من الخطوات، أكبر قدر من الراحة', 'support-kicker': 'نقل العبء، لا إضافة نصيحة', 'support-title': 'مهمة واحدة جاهزة لدائرة الدعم',
            'preview-care': 'معاينة تجربة الداعم', 'share-task': 'مشاركة المهمة ←', 'summary-button': '▤ ملخص لمقدم الرعاية', 'save-plan': 'احفظي خطتي',
            'back-to-plan': '→ العودة للخطة', 'summary-title': 'ملخص تعافٍ بعد الولادة', 'summary-disclaimer': 'أُنشئ هذا الملخص من إفادة الأم لتسهيل التواصل، ولا يمثل تشخيصًا طبيًا.',
            'patient-name-label': 'الاسم', 'patient-name': 'ليان — حالة تجريبية', 'stage-label': 'مرحلة التعافي', 'stage-value': 'اليوم 12 بعد قيصرية', 'reason-label': 'سبب التواصل',
            'reported-label': 'ما ذكرته الأم مباشرة', 'concerns-label': 'نقاط تحتاج تقييمًا', 'unknowns-label': 'معلومات ما زالت غير مكتملة',
            'separation-title': 'فصل المصدر عن الاستنتاج', 'separation-copy': 'يعرض نَفَس كلمات الأم كما هي، ويفصلها بوضوح عن الملاحظات والأسئلة غير المكتملة.', 'share-summary': 'مشاركة الملخص بأمان',
            'footer-one': 'نَفَس لا يقدم تشخيصًا أو بديلًا عن الرعاية الطبية.', 'footer-two': 'في الطوارئ، اتصلي بخدمات الطوارئ المحلية فورًا.',
            'care-badge': 'دائرة الدعم • مهمة واحدة', 'care-title': 'وجودك اليوم يمكن قياسه بفعل واحد', 'care-copy': 'هذه المهمة اختارتها الأم من خطتها. لا تحتاج إلى نصائح إضافية—فقط خفّف العبء.', 'care-task-label': 'مهمتك الآن', 'care-time': 'المدة المقترحة: 60–90 دقيقة', 'accept-care': 'تم—أنا أتولى هذه المهمة',
          },
          en: {
            'home-eyebrow': '— POSTPARTUM DAY 12',
            'home-title': 'One mother. One honest story.<br><em>A shared path to recovery.</em>',
            'home-intro': 'NAFAS turns one unfiltered voice note into a safety check, a six-dimension recovery map, a 24-hour plan, and one clear task for her care circle.',
            'proof-one': 'Arabic-first voice', 'proof-two': 'Safety before AI', 'proof-three': 'Conversation not stored', 'proof-four': 'Shareable care plan',
            'prototype-title': 'Educational competition prototype — not a medical service.',
            'prototype-copy': 'Use fictional or de-identified cases only. Do not enter real names, contact numbers, records, or identifiable health information.',
            'checkin-title': '● Describe a fictional, de-identified check-in', 'voice-label': 'Speak instead of typing', 'private-label': '⌾ Conversation not stored',
            'scenario-kicker': 'JUDGE DEMO LAB', 'scenario-title': 'See the product adapt to three levels of risk', 'scenario-note': 'Fictional, de-identified cases',
            'routine-level': 'ROUTINE RECOVERY', 'routine-title': 'Fatigue + fragmented sleep', 'routine-copy': 'A small plan and practical support handoff',
            'urgent-level': 'SAME-DAY REVIEW', 'urgent-title': 'Worsening wound pain', 'urgent-copy': 'A signal that cannot be buried in a long story',
            'emergency-level': 'IMMEDIATE ACTION', 'emergency-title': 'Safety risk', 'emergency-copy': 'A deterministic path that bypasses the model',
            'pipeline-kicker': 'INSIDE NAFAS', 'pipeline-title': 'One story. Five guarded steps.', 'pipeline-copy': 'GPT does not carry the whole safety burden. Every layer has a bounded job.',
            'pipe-one-title': 'Voice or text', 'pipe-one-copy': 'The mother’s natural language', 'pipe-two-title': 'Privacy gate', 'pipe-two-copy': 'Direct identifiers rejected',
            'pipe-three-title': 'Deterministic check', 'pipe-three-copy': 'Critical signals first', 'pipe-four-title': 'GPT‑5.6', 'pipe-four-copy': 'Strict structured output',
            'pipe-five-title': 'Shared action', 'pipe-five-copy': 'Mother + care circle + clinician',
            'trust-one-title': 'No judgment', 'trust-one-copy': 'A low-friction check-in', 'trust-two-title': 'No diagnosis', 'trust-two-copy': 'Navigation, not treatment', 'trust-three-title': 'User controlled', 'trust-three-copy': 'Nothing shared without consent',
            'new-checkin': '← New check-in', 'results-eyebrow': '— I HEARD YOU', 'results-title': 'What needs our<br><em>attention today</em>', 'score-label': 'recovery load<br>today', 'understood-label': 'What I understood',
            'map-kicker': 'RECOVERY LOAD MAP', 'map-title': 'The whole picture, not one symptom', 'today-label': 'Today ▾', 'radar-title': 'Today’s recovery fingerprint', 'radar-copy': 'A wider shape means a heavier load',
            'plan-kicker': 'THE NEXT 24 HOURS', 'plan-title': 'Fewer decisions. More protected recovery.', 'support-kicker': 'TRANSFER LOAD — NOT ADVICE', 'support-title': 'One ready-to-share care-circle task',
            'preview-care': 'Preview caregiver view', 'share-task': 'Share this task →', 'summary-button': '▤ Clinician-ready summary', 'save-plan': 'Save this plan',
            'back-to-plan': '← Back to plan', 'summary-title': 'Postpartum recovery summary', 'summary-disclaimer': 'Generated from the mother’s own account to support communication. It is not a diagnosis.',
            'patient-name-label': 'NAME', 'patient-name': 'Layan — fictional demo', 'stage-label': 'RECOVERY STAGE', 'stage-value': 'Day 12 after caesarean birth', 'reason-label': 'REASON FOR CONTACT',
            'reported-label': 'What the mother reported', 'concerns-label': 'Items for assessment', 'unknowns-label': 'Information still unknown',
            'separation-title': 'Source separated from inference', 'separation-copy': 'NAFAS preserves the mother’s words and clearly separates them from organized concerns and missing information.', 'share-summary': 'Share summary safely',
            'footer-one': 'NAFAS does not diagnose or replace medical care.', 'footer-two': 'In an emergency, contact local emergency services immediately.',
            'care-badge': 'CARE CIRCLE • ONE TASK', 'care-title': 'Your support becomes real through one action', 'care-copy': 'The mother selected this task from her plan. She does not need more advice — she needs load removed.', 'care-task-label': 'YOUR TASK NOW', 'care-time': 'Suggested protected window: 60–90 minutes', 'accept-care': 'I’ve got this task',
          },
        };
        var htmlIds = ['home-title', 'results-title', 'score-label'];

        function applyLanguage(language) {
          currentLanguage = language;
          document.documentElement.lang = language;
          document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
          var values = translations[language];
          Object.keys(values).forEach(function (id) {
            var element = document.getElementById(id);
            if (!element) return;
            if (htmlIds.indexOf(id) >= 0) element.innerHTML = values[id]; else element.textContent = values[id];
          });
          document.getElementById('language-toggle').textContent = language === 'ar' ? 'EN • JUDGE MODE' : 'العربية';
          checkin.placeholder = language === 'ar' ? 'مثلاً: أم في اليوم 12 بعد الولادة لم تنم جيدًا، وجرحها يؤلمها… دون اسم أو معلومات تعريفية' : 'Example: A mother on postpartum day 12 has fragmented sleep and increasing wound pain… no name or identifying details.';
          analyzeButton.textContent = language === 'ar' ? 'افهمي يومي' : 'Build the shared plan';
          checkin.value = '';
          currentData = null;
          showScreen('home');
        }

        function showScreen(name) {
          ['home', 'results', 'summary'].forEach(function (id) {
            document.getElementById(id).classList.toggle('hidden', id !== name);
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function toast(message) {
          var element = document.getElementById('toast');
          element.textContent = '✓ ' + message;
          element.classList.remove('hidden');
          window.setTimeout(function () { element.classList.add('hidden'); }, 2800);
        }

        function setBusy(busy) {
          analyzeButton.disabled = busy;
          var panel = document.getElementById('loading-panel');
          var title = document.getElementById('loading-title');
          var copy = document.getElementById('loading-copy');
          var stages = currentLanguage === 'ar' ? [
            ['بوابة الخصوصية', 'نتأكد أولًا أن الحالة منزوعة الهوية…'],
            ['فحص السلامة الحتمي', 'نبحث عن العبارات التي لا يجوز أن تنتظر النموذج…'],
            ['GPT‑5.6 يبني الصورة', 'ننظم عبء التعافي في ستة محاور واضحة…'],
            ['توزيع العبء', 'نحوّل الفهم إلى خطة ومهمة لدائرة الدعم…'],
          ] : [
            ['Privacy gate', 'Checking that the case is de-identified first…'],
            ['Deterministic safety check', 'Critical phrases never wait for the model…'],
            ['GPT‑5.6 builds the picture', 'Structuring recovery load across six dimensions…'],
            ['Transferring the load', 'Turning insight into a plan and care-circle task…'],
          ];
          window.clearInterval(loadingTimer);
          if (busy) {
            loadingStep = 0;
            panel.classList.remove('hidden');
            title.textContent = stages[0][0]; copy.textContent = stages[0][1];
            analyzeButton.innerHTML = '<span class="spinner"></span>' + (currentLanguage === 'ar' ? ' نبني خطة مشتركة…' : ' Building the shared plan…');
            formStatus.textContent = '';
            loadingTimer = window.setInterval(function () {
              loadingStep = Math.min(loadingStep + 1, stages.length - 1);
              title.textContent = stages[loadingStep][0]; copy.textContent = stages[loadingStep][1];
            }, 4200);
          } else {
            panel.classList.add('hidden');
            analyzeButton.textContent = currentLanguage === 'ar' ? 'افهمي يومي' : 'Build the shared plan';
          }
        }

        function addTextElement(parent, tag, className, text) {
          var element = document.createElement(tag);
          if (className) element.className = className;
          element.textContent = text;
          parent.appendChild(element);
          return element;
        }

        function averageScore(dimensions) {
          if (!dimensions || !dimensions.length) return 0;
          return Math.round(dimensions.reduce(function (sum, item) { return sum + Number(item.score || 0); }, 0) / dimensions.length);
        }

        function renderSafety(safety) {
          var card = document.getElementById('safety-card');
          var title = document.getElementById('safety-title');
          var copy = document.getElementById('safety-copy');
          var action = document.getElementById('safety-action');
          var english = currentLanguage === 'en';
          card.classList.remove('routine', 'emergency');
          if (safety.priority === 'emergency') {
            card.classList.add('emergency');
            title.textContent = english ? 'Get immediate human help now' : 'اطلبي مساعدة فورية الآن';
            copy.textContent = english ? 'Do not stay alone. Contact local emergency services or go to the nearest emergency department with a trusted person.' : 'لا تبقي وحدك. اتصلي بالطوارئ المحلية أو توجهي إلى أقرب قسم طوارئ مع شخص موثوق.';
            action.textContent = english ? 'Emergency steps shown above' : 'خطوات الطوارئ أعلاه';
          } else if (safety.priority === 'urgent') {
            title.textContent = english ? 'A signal needs same-day review' : 'ظهرت علامة تستحق تواصلًا اليوم';
            copy.textContent = english ? 'This does not prove a complication, but it should be assessed by a healthcare professional today.' : 'هذا لا يثبت وجود مشكلة، لكنه يحتاج تقييمًا من مقدم الرعاية اليوم.';
            action.textContent = english ? 'Review the safety questions →' : 'راجعي أسئلة السلامة ←';
          } else {
            card.classList.add('routine');
            title.textContent = english ? 'No emergency phrase was detected' : 'لم تظهر عبارة طارئة في رسالتكِ';
            copy.textContent = english ? 'We can continue with today’s plan while watching for any new change.' : 'سنكمل خطة اليوم مع إبقاء أي تغير جديد تحت الملاحظة.';
            action.textContent = english ? 'Continue to the plan →' : 'متابعة الخطة ←';
          }
        }

        function renderRadar(items) {
          var svg = document.getElementById('radar');
          var ns = 'http://www.w3.org/2000/svg';
          var center = 120; var radius = 88; var count = Math.max(3, items.length || 6);
          svg.textContent = '';
          function point(index, value) {
            var angle = -Math.PI / 2 + (Math.PI * 2 * index / count);
            return [center + Math.cos(angle) * radius * value, center + Math.sin(angle) * radius * value];
          }
          [0.33, 0.66, 1].forEach(function (level) {
            var polygon = document.createElementNS(ns, 'polygon');
            polygon.setAttribute('class', 'radar-grid');
            polygon.setAttribute('points', Array.from({ length: count }, function (_, index) { return point(index, level).join(','); }).join(' '));
            svg.appendChild(polygon);
          });
          Array.from({ length: count }, function (_, index) {
            var axis = document.createElementNS(ns, 'line'); var outer = point(index, 1);
            axis.setAttribute('class', 'radar-axis'); axis.setAttribute('x1', center); axis.setAttribute('y1', center); axis.setAttribute('x2', outer[0]); axis.setAttribute('y2', outer[1]); svg.appendChild(axis);
          });
          var values = items.map(function (item, index) { return point(index, Math.max(0.08, Math.min(1, Number(item.score || 0) / 100))); });
          var shape = document.createElementNS(ns, 'polygon'); shape.setAttribute('class', 'radar-shape'); shape.setAttribute('points', values.map(function (item) { return item.join(','); }).join(' ')); svg.appendChild(shape);
          values.forEach(function (item) { var dot = document.createElementNS(ns, 'circle'); dot.setAttribute('class', 'radar-dot'); dot.setAttribute('cx', item[0]); dot.setAttribute('cy', item[1]); dot.setAttribute('r', 4); svg.appendChild(dot); });
        }

        function renderDimensions(items) {
          var container = document.getElementById('dimensions');
          var icons = ['✦', '☾', '◌', '◇', '◡', '⌂'];
          container.textContent = '';
          items.forEach(function (item, index) {
            var value = Math.max(0, Math.min(100, Number(item.score || 0)));
            var tone = value >= 70 ? 'high' : value >= 50 ? 'mid' : 'low';
            var row = document.createElement('div'); row.className = 'load-item';
            addTextElement(row, 'div', 'dim-icon ' + tone, icons[index] || '◌');
            var copy = document.createElement('div'); copy.className = 'dim-copy';
            addTextElement(copy, 'b', '', item.label);
            var bar = document.createElement('div'); bar.className = 'bar';
            var fill = document.createElement('i'); fill.className = tone; fill.style.width = value + '%'; bar.appendChild(fill); copy.appendChild(bar); row.appendChild(copy);
            addTextElement(row, 'strong', '', String(value));
            container.appendChild(row);
          });
          renderRadar(items);
        }

        function renderPlan(items) {
          var container = document.getElementById('steps');
          container.textContent = '';
          items.forEach(function (item, index) {
            var article = document.createElement('article');
            addTextElement(article, 'span', 'step-num', String(index + 1).padStart(2, '0'));
            var copy = document.createElement('div');
            addTextElement(copy, 'small', '', item.time);
            addTextElement(copy, 'h3', '', item.title);
            addTextElement(copy, 'p', '', item.detail);
            addTextElement(copy, 'b', 'owner', '↗ ' + item.owner);
            article.appendChild(copy); container.appendChild(article);
          });
          document.getElementById('step-count').textContent = currentLanguage === 'ar' ? items.length + ' خطوات فقط' : items.length + ' focused actions';
        }

        function renderSummary(data) {
          var reported = data.providerSummary && data.providerSummary.reported && data.providerSummary.reported[0] ? data.providerSummary.reported[0] : checkin.value;
          document.getElementById('reported-text').textContent = reported;
          var concerns = document.getElementById('concerns'); concerns.textContent = '';
          (data.providerSummary.organizedConcerns || []).forEach(function (item) { addTextElement(concerns, 'li', '', item); });
          var unknowns = document.getElementById('unknowns'); unknowns.textContent = '';
          (data.providerSummary.unknowns || []).forEach(function (item) { addTextElement(unknowns, 'span', '', item); });
          document.getElementById('summary-reason').textContent = currentLanguage === 'ar'
            ? (data.safety.priority === 'emergency' ? 'حاجة إلى تقييم طارئ' : data.safety.priority === 'urgent' ? 'علامة تحتاج تقييمًا اليوم' : 'مراجعة التعافي')
            : (data.safety.priority === 'emergency' ? 'Emergency assessment needed' : data.safety.priority === 'urgent' ? 'Same-day assessment signal' : 'Recovery review');
        }

        function renderTrace(data) {
          var container = document.getElementById('trace-strip');
          var meta = data.meta || {};
          var seconds = meta.latencyMs ? (meta.latencyMs / 1000).toFixed(1) + 's' : '—';
          var labels = currentLanguage === 'ar'
            ? ['✓ بوابة الخصوصية', '✓ فحص سلامة حتمي', '✓ مخرجات منظمة', '◷ ' + seconds, meta.stored === false ? '⊘ لا تخزين' : '']
            : ['✓ Privacy gate', '✓ Deterministic safety', '✓ Structured output', '◷ ' + seconds, meta.stored === false ? '⊘ Not stored' : ''];
          container.textContent = '';
          labels.filter(Boolean).forEach(function (label) { addTextElement(container, 'span', '', label); });
        }

        function renderResults(data) {
          currentData = data;
          document.getElementById('score').textContent = String(averageScore(data.dimensions));
          document.getElementById('acknowledgement').textContent = data.acknowledgement;
          document.getElementById('mode-badge').textContent = data.mode === 'live'
            ? (currentLanguage === 'ar' ? 'تحليل مباشر • ' + data.model : 'LIVE • ' + data.model)
            : (currentLanguage === 'ar' ? data.model : (data.meta && data.meta.path === 'deterministic-safety-bypass' ? 'DETERMINISTIC SAFETY • NO MODEL CALL' : data.model));
          var warning = document.getElementById('warning');
          warning.textContent = data.warning || '';
          warning.classList.toggle('hidden', !data.warning);
          document.getElementById('support-task').textContent = '“' + data.supportTask + '”';
          renderSafety(data.safety || { priority: 'routine', ruleIds: [] });
          renderDimensions(data.dimensions || []);
          renderPlan(data.plan || []);
          renderSummary(data);
          renderTrace(data);
          document.getElementById('care-task-text').textContent = data.supportTask;
          document.getElementById('accept-care').classList.remove('accepted');
          document.getElementById('accept-care').textContent = translations[currentLanguage]['accept-care'];
          showScreen('results');
        }

        async function analyze(text) {
          if (!text || text.trim().length < 8) {
            formStatus.textContent = currentLanguage === 'ar' ? 'احكي لي قليلًا أولًا، أو اختاري الحالة التجريبية.' : 'Add a little context first, or choose a fictional demo case.';
            return;
          }
          setBusy(true);
          try {
            var response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: text.trim(), language: currentLanguage }) });
            var data = await response.json();
            if (!response.ok) throw new Error(data.error || (currentLanguage === 'ar' ? 'تعذر التحليل' : 'The analysis could not be completed'));
            renderResults(data);
          } catch (error) {
            formStatus.textContent = error.message || (currentLanguage === 'ar' ? 'تعذر التحليل الآن.' : 'The analysis is temporarily unavailable.');
          } finally {
            setBusy(false);
          }
        }

        analyzeButton.addEventListener('click', function () { analyze(checkin.value); });
        document.querySelectorAll('[data-scenario]').forEach(function (button) {
          button.addEventListener('click', function () {
            var text = scenarioText[currentLanguage][button.dataset.scenario];
            checkin.value = text;
            analyze(text);
          });
        });
        document.getElementById('language-toggle').addEventListener('click', function () { applyLanguage(currentLanguage === 'ar' ? 'en' : 'ar'); });
        document.querySelectorAll('[data-screen]').forEach(function (button) { button.addEventListener('click', function () { showScreen(button.dataset.screen); }); });
        document.getElementById('summary-button').addEventListener('click', function () { showScreen('summary'); });
        document.getElementById('save-plan').addEventListener('click', function () { if (currentData) localStorage.setItem('nafas-plan', JSON.stringify(currentData)); toast(currentLanguage === 'ar' ? 'تم حفظ خطة اليوم على هذا الجهاز' : 'The plan was saved on this device'); });
        document.getElementById('safety-action').addEventListener('click', function () { toast(currentLanguage === 'ar' ? 'راجعي الحرارة، الجرح، النزيف والتنفس، ثم تواصلي بحسب الأولوية' : 'Check temperature, wound, bleeding and breathing, then follow the displayed priority'); });

        async function shareText(title, text) {
          if (navigator.share) { await navigator.share({ title: title, text: text }); return; }
          await navigator.clipboard.writeText(text); toast(currentLanguage === 'ar' ? 'نُسخ النص—لن يُشارك إلا عندما تختارين أنتِ' : 'Copied — it is only shared when you choose');
        }
        document.getElementById('share-task').addEventListener('click', function () { if (currentData) shareText(currentLanguage === 'ar' ? 'مهمة دعم من نَفَس' : 'A care-circle task from NAFAS', currentData.supportTask).catch(function () {}); });
        document.getElementById('share-summary').addEventListener('click', function () {
          if (!currentData) return;
          var text = currentLanguage === 'ar'
            ? 'ملخص نَفَس لمقدم الرعاية\n\nما ذكرته الأم:\n' + document.getElementById('reported-text').textContent + '\n\nنقاط تحتاج تقييمًا:\n- ' + currentData.providerSummary.organizedConcerns.join('\n- ') + '\n\nمعلومات غير مكتملة:\n- ' + currentData.providerSummary.unknowns.join('\n- ')
            : 'NAFAS clinician-ready summary\n\nMother-reported:\n' + document.getElementById('reported-text').textContent + '\n\nItems for assessment:\n- ' + currentData.providerSummary.organizedConcerns.join('\n- ') + '\n\nStill unknown:\n- ' + currentData.providerSummary.unknowns.join('\n- ');
          shareText(currentLanguage === 'ar' ? 'ملخص تعافٍ بعد الولادة' : 'Postpartum recovery summary', text).catch(function () {});
        });

        document.getElementById('preview-care').addEventListener('click', function () { if (currentData) document.getElementById('care-overlay').classList.remove('hidden'); });
        document.getElementById('close-care').addEventListener('click', function () { document.getElementById('care-overlay').classList.add('hidden'); });
        document.getElementById('care-overlay').addEventListener('click', function (event) { if (event.target.id === 'care-overlay') event.currentTarget.classList.add('hidden'); });
        document.getElementById('accept-care').addEventListener('click', function () {
          this.classList.add('accepted');
          this.textContent = currentLanguage === 'ar' ? '✓ تم قبول المهمة — بدأت نافذة الراحة' : '✓ Task accepted — protected recovery window started';
        });

        document.getElementById('voice').addEventListener('click', function () {
          var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) { toast(currentLanguage === 'ar' ? 'التسجيل الصوتي غير مدعوم هنا—يمكنكِ الكتابة أو تجربة الحالة' : 'Voice input is not supported here — type or choose a demo case'); return; }
          var button = this; var recognition = new SpeechRecognition();
          recognition.lang = currentLanguage === 'ar' ? 'ar-SA' : 'en-US'; recognition.interimResults = true;
          button.classList.add('recording'); button.querySelector('b').textContent = currentLanguage === 'ar' ? 'أستمع إليكِ…' : 'Listening…';
          recognition.onresult = function (event) { checkin.value = Array.from(event.results).map(function (result) { return result[0].transcript; }).join(''); };
          recognition.onend = function () { button.classList.remove('recording'); button.querySelector('b').textContent = translations[currentLanguage]['voice-label']; };
          recognition.start();
        });
      }());
    </script>
  </body>
</html>`

const htmlHeaders = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=300',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(self)',
  'content-security-policy': "default-src 'self'; connect-src 'self' https://api.openai.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
}

export { deterministicSafety }

export default {
  async fetch(request, env, ctx) {
    void ctx
    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/api/analyze') {
      return analyzeRequest(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return jsonResponse({ ok: true, aiConfigured: Boolean(env.OPENAI_API_KEY) })
    }

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return new Response(page, { headers: htmlHeaders })
    }

    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  },
}
