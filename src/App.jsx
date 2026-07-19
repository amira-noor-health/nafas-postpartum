import { useMemo, useState } from 'react'
import './App.css'

const demoText = 'من أمس جرح القيصرية يوجعني أكثر، ونمت ثلاث ساعات فقط. أبكي بدون سبب وأشعر أني أم فاشلة. الطفل يرضع طول الوقت وما أكلت إلا مرة واحدة اليوم.'
const dimensions = [
  { label: 'الجسد والألم', value: 78, tone: 'high', icon: '✦' }, { label: 'النوم والطاقة', value: 86, tone: 'high', icon: '☾' },
  { label: 'المزاج', value: 67, tone: 'mid', icon: '◌' }, { label: 'التغذية', value: 58, tone: 'mid', icon: '◇' },
  { label: 'الرضاعة', value: 44, tone: 'low', icon: '◡' }, { label: 'الدعم', value: 72, tone: 'high', icon: '⌂' },
]
const steps = [
  { time: 'الآن', title: 'افحصي حرارتك والجرح', detail: 'هل يوجد احمرار منتشر، إفرازات، تباعد في الجرح أو حرارة 38° فأكثر؟', owner: 'أنتِ', icon: '01' },
  { time: 'خلال ساعة', title: 'وجبة وماء قبل أي مهمة', detail: 'كوب ماء ووجبة سهلة تحتوي بروتينًا وكربوهيدرات.', owner: 'سلمان يحضّرها', icon: '02' },
  { time: 'اليوم', title: 'تواصلي مع مقدم الرعاية', detail: 'لأن ألم الجرح يزداد بدل أن يتحسن. جهزنا لك ملخصًا قصيرًا.', owner: 'أنتِ', icon: '03' },
  { time: '7:00 م', title: 'نافذة نوم محمية', detail: '90 دقيقة دون مسؤولية الطفل أو أسئلة منزلية.', owner: 'سلمان مع الطفل', icon: '04' },
]

function Logo() {
  return <div className="brand"><span className="brand-mark">نَ</span><div><strong>نَفَس</strong><small>تعافيكِ… مسؤولية مشتركة</small></div></div>
}

function App() {
  const [screen, setScreen] = useState('home')
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [lang, setLang] = useState('AR')
  const [aiData, setAiData] = useState(null)
  const firstName = useMemo(() => 'ليان', [])

  function notify(message) { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  function runDemo() { setText(demoText); setLoading(true); window.setTimeout(() => { setLoading(false); setScreen('results') }, 1200) }
  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setRecording(!recording); notify('التسجيل غير مدعوم هنا—اكتبي رسالتك أو جرّبي الحالة التجريبية'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-SA'; recognition.interimResults = true; setRecording(true)
    recognition.onresult = (event) => setText(Array.from(event.results).map(r => r[0].transcript).join(''))
    recognition.onend = () => setRecording(false); recognition.start()
  }
  async function analyze() {
    if (!text.trim()) return notify('احكي لي أولًا… أو اختاري الحالة التجريبية')
    setLoading(true)
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!response.ok) throw new Error('analysis unavailable')
      setAiData(await response.json())
      setScreen('results')
    } catch {
      notify('يعمل العرض الآمن الآن؛ تعذّر الاتصال بالتحليل المباشر')
      setScreen('results')
    } finally { setLoading(false) }
  }

  return (
    <div className="app" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
      <header><Logo /><div className="header-actions"><button className="lang" onClick={() => setLang(lang === 'AR' ? 'EN' : 'AR')}>{lang === 'AR' ? 'EN' : 'ع'}</button><button className="avatar" aria-label="الملف الشخصي">ل</button></div></header>
      {screen === 'home' && <main className="home">
        <div className="eyebrow"><span></span> اليوم 12 بعد الولادة</div>
        <h1>مساء الخير يا {firstName}<br/><em>كيف حالكِ فعلًا؟</em></h1>
        <p className="intro">لا تحتاجين لترتيب كلامكِ. احكي بطريقتك، وسنحوّل ما تمرّين به إلى خطوات صغيرة وآمنة.</p>
        <section className="checkin-card">
          <div className="prompt"><span className="pulse-dot"></span> احكي لي… كيف كان يومك؟</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="مثلاً: لم أنم جيدًا، جرحي يؤلمني، وأشعر أن كل شيء فوق طاقتي…" />
          <div className="voice-row"><button className={`mic ${recording ? 'recording' : ''}`} onClick={startVoice}><span>⌁</span>{recording ? 'أستمع إليكِ…' : 'تحدثي بدلًا من الكتابة'}</button><span className="private">⌾ خاص وآمن</span></div>
          <button className="primary" onClick={analyze}>{loading ? <><i className="spinner"></i> أفهم ما تحتاجينه…</> : 'افهمي يومي'}</button>
        </section>
        <button className="demo" onClick={runDemo}>▶ جرّبي حالة أم بعد قيصرية <small>عرض سريع للمسابقة</small></button>
        <div className="trust-row"><div><b>لا أحكام</b><span>مساحة آمنة لكِ</span></div><div><b>لا تشخيص</b><span>إرشاد ودعم آمن</span></div><div><b>أنتِ تقررين</b><span>لا مشاركة دون إذنك</span></div></div>
      </main>}
      {screen === 'results' && <main className="results">
        <button className="back" onClick={() => setScreen('home')}>→ تسجيل جديد</button>
        <div className="results-head"><div><div className="eyebrow"><span></span> استمعتُ إليكِ</div><h1>هذا ما يحتاج<br/><em>انتباهنا اليوم</em></h1></div><div className="score"><strong>68</strong><span>عبء التعافي<br/>اليوم</span></div></div>
        <section className="safety-card"><div className="safety-icon">!</div><div><span className="safety-label">فحص سلامة مهم</span><h2>ألم الجرح يزداد منذ أمس</h2><p>هذا لا يعني بالضرورة وجود مشكلة، لكنه يستحق فحصًا قصيرًا قبل أن نكمل خطتكِ.</p></div><button onClick={() => notify('للعرض: لا توجد حرارة أو إفرازات — نوصي بالتواصل اليوم')}>ابدئي 3 أسئلة <span>←</span></button></section>
        <section className="insight"><span className="quote">“</span><div><b>ما فهمته منكِ {aiData?.model && <span className="ai-badge">GPT‑5.6 مباشر</span>}</b><p>{aiData?.acknowledgement || <>أنتِ تتعاملين مع ألم متزايد، نقص شديد في النوم، وقلة الطعام—وفي الوقت نفسه تلومين نفسكِ. هذا ليس فشلًا منكِ؛ هذا <strong>عبء تعافٍ أكبر من الموارد المتاحة لكِ اليوم.</strong></>}</p></div></section>
        <section className="load-section"><div className="section-title"><div><small>خريطة عبء التعافي</small><h2>الصورة الكاملة، لا عَرَض واحد</h2></div><span>اليوم ▾</span></div><div className="load-grid">{(aiData?.dimensions || dimensions).map((d, i) => { const value = d.score ?? d.value; const tone = value >= 70 ? 'high' : value >= 50 ? 'mid' : 'low'; return <div className="load-item" key={d.id || d.label}><div className={`dim-icon ${tone}`}>{d.icon || dimensions[i]?.icon || '◌'}</div><div className="dim-copy"><b>{d.label}</b><div className="bar"><i className={tone} style={{width: `${value}%`}}></i></div></div><strong>{value}</strong></div>})}</div></section>
        <section className="plan-section"><div className="section-title"><div><small>خطة الـ24 ساعة</small><h2>أقل عدد من الخطوات، أكبر قدر من الراحة</h2></div><span className="pill">{(aiData?.plan || steps).length} خطوات فقط</span></div><div className="steps">{(aiData?.plan || steps).map((s, i) => <article key={s.icon || i}><span className="step-num">{s.icon || String(i + 1).padStart(2, '0')}</span><div><small>{s.time}</small><h3>{s.title}</h3><p>{s.detail}</p><b className="owner">↗ {s.owner}</b></div></article>)}</div></section>
        <section className="support-card"><div><small>نقل العبء، لا إضافة نصيحة</small><h2>جهزنا مهمة واضحة لسلمان</h2><p>“{aiData?.supportTask || 'خذ الطفل من 7:00 إلى 8:30، وأحضر لليان وجبة وماء. هذه نافذة نوم محمية—اتخذ القرارات الصغيرة بنفسك.'}”</p></div><button onClick={() => notify('تم تجهيز الرسالة—لن تُشارك إلا بعد موافقتكِ')}>مراجعة ومشاركة ←</button></section>
        <div className="bottom-actions"><button className="doctor" onClick={() => setScreen('summary')}>▤ ملخص لمقدم الرعاية</button><button className="primary" onClick={() => notify('تم حفظ خطة اليوم بأمان')}>احفظي خطتي</button></div>
      </main>}
      {screen === 'summary' && <main className="summary-page">
        <button className="back" onClick={() => setScreen('results')}>→ العودة للخطة</button>
        <div className="summary-sheet"><div className="sheet-head"><Logo/><span>ملخص زيارة • 18 يوليو 2026</span></div><h1>ملخص تعافٍ بعد الولادة</h1><p className="disclaimer">أُنشئ هذا الملخص من إفادة الأم لتسهيل التواصل، ولا يمثل تشخيصًا طبيًا.</p>
          <div className="patient"><div><small>الاسم</small><b>ليان أحمد</b></div><div><small>مرحلة التعافي</small><b>اليوم 12 بعد قيصرية</b></div><div><small>سبب التواصل</small><b>ازدياد ألم الجرح</b></div></div>
          <section><h3>ما ذكرته الأم مباشرة</h3><blockquote>{demoText}</blockquote></section>
          <section><h3>نقاط تحتاج تقييمًا</h3><ul>{(aiData?.providerSummary?.organizedConcerns || ['ازدياد ألم جرح القيصرية منذ يوم واحد.','نوم متقطع بإجمالي يقارب 3 ساعات.','تناول وجبة واحدة خلال اليوم.','بكاء وشعور بالفشل دون إفادة حالية عن أفكار إيذاء.']).map(item => <li key={item}>{item}</li>)}</ul></section>
          <section><h3>معلومات ما زالت غير مكتملة</h3><div className="unknowns">{(aiData?.providerSummary?.unknowns || ['درجة الحرارة','شكل الجرح','شدة النزيف','درجة الألم /10']).map(item => <span key={item}>{item}</span>)}</div></section>
          <div className="separation"><span>✓</span><p><b>فصل المصدر عن الاستنتاج</b><br/>يعرض نَفَس كلمات الأم كما هي، ويفصلها بوضوح عن الملاحظات والأسئلة غير المكتملة.</p></div>
          <button className="primary" onClick={() => notify('تم تجهيز نسخة آمنة للعرض أو الطباعة')}>مشاركة الملخص بأمان</button>
        </div>
      </main>}
      <footer><span>نَفَس لا يقدم تشخيصًا أو بديلًا عن الرعاية الطبية.</span><b>في الطوارئ، اتصلي بخدمات الطوارئ المحلية فورًا.</b></footer>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  )
}
export default App
