import { createRoot } from "react-dom/client"
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { BookOpen, ChevronRight, Compass, Eye, House, Leaf, MessageCircle, Plus, Sprout, Sun, Telescope, Upload } from 'lucide-react'
import { dateKey, hints, journalStore, prepareImage, readable, steps } from './journal'
import type { Exploration, Journal, Observation, Question } from './journal'
import './style.css'

const routes = [
  ['today', 'Today', House], ['observe', 'Observe', Eye], ['wonder', 'Wonder', MessageCircle],
  ['explore', 'Explore', Telescope], ['library', 'Library', BookOpen],
] as const
const prompts = [
  ['Follow a shadow', 'Look at the shadows around your home today. Can you find one that changes shape? What do you think is making it change?'],
  ['Listen to the wind', 'Stand quietly near a window or outdoors. Which sounds come and go? What moves just before you hear them?'],
  ['Look closely at a leaf', 'Pick two fallen leaves. How are their edges, colours and lines alike? Where do they differ?'],
  ['Watch a drop of water', 'Put a drop of water on a plate and another on a leaf. What do you notice when you tilt each one?'],
]
const getRoute = () => location.hash.slice(1) || 'today'
const readText = (data: FormData, key: string) => String(data.get(key) ?? '').trim()
const makeQuestion = (title: string, date = dateKey()) => ({ id: crypto.randomUUID(), title, date })
const kinds = ['All', 'Observations', 'Questions', 'Explorations', 'Discoveries', 'Photos & drawings'] as const
type Kind = typeof kinds[number]

function PageHeading({ label, title, children }: {label: string; title: string; children: ReactNode}) {
  return <header className="page-heading"><p className="eyebrow">{label}</p><h1>{title}</h1><p>{children}</p></header>
}
function Field({ name, label, placeholder, multiline, required, type = 'text', value }: {name: string; label: string; placeholder?: string; multiline?: boolean; required?: boolean; type?: string; value?: string}) {
  return <label className="field"><span>{label}</span>{multiline ? <textarea name={name} placeholder={placeholder} required={required} defaultValue={value} rows={3}/> : <input name={name} type={type} defaultValue={value} placeholder={placeholder} required={required}/>}</label>
}
function PhotoField({ initialPhoto = '', onChange }: {initialPhoto?: string; onChange: (photo: string, pending: boolean) => void}) {
  const [photo, setPhoto] = useState(initialPhoto)
  const [error, setError] = useState('')
  const sequence = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  async function change(event: ChangeEvent<HTMLInputElement>) {
    const version = ++sequence.current
    const file = event.target.files?.[0]
    setError('')
    if (!file) return
    onChange(photo, true)
    try {
      const result = await prepareImage(file)
      if (version !== sequence.current) return
      setPhoto(result)
      onChange(result, false)
    } catch {
      if (version !== sequence.current) return
      setError('This image could not be opened. Try a JPEG or PNG.')
      event.target.value = ''
      onChange(photo, false)
    }
  }
  return <div className="photo-field">
    <label className="field"><span><Upload size={17}/> Add a photo or a picture of a drawing <small>(optional)</small></span><input ref={input} type="file" accept="image/*" onChange={change}/></label>
    {error && <p role="alert">{error}</p>}
    {photo && <><img className="entry-photo" src={photo} alt="Selected journal attachment"/><button type="button" className="text-link" onClick={() => {sequence.current++; if (input.current) input.current.value = ''; setPhoto(''); onChange('', false)}}>Remove image</button></>}
  </div>
}
function Form({ children, action, save, attachments = false, initialPhoto, extraActions, reset = false }: {
  children: ReactNode
  action: string
  save: (data: FormData, photo?: string, intent?: string) => void
  attachments?: boolean
  initialPhoto?: string
  extraActions?: (pending: boolean) => ReactNode
  reset?: boolean
}) {
  const [error, setError] = useState('')
  const [image, setImage] = useState({photo:initialPhoto ?? '', pending:false})
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (image.pending) return
    setError('')
    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
      save(new FormData(event.currentTarget), image.photo || undefined, submitter?.value)
      if (reset) event.currentTarget.reset()
    }
    catch (error) {
      setError(error instanceof DOMException ? 'The browser could not save this entry. Try removing the image or freeing some browser storage.' : error instanceof Error ? error.message : 'This entry could not be saved.')
    }
  }
  return <form className="journal-form" onSubmit={submit}>{children}
    {attachments && <PhotoField initialPhoto={initialPhoto} onChange={(photo, pending) => setImage({photo, pending})}/>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="form-actions">
      <button className="button" disabled={image.pending}>{action}</button>
      {extraActions?.(image.pending)}
    </div>
  </form>
}
function ObservationForm({ entry, save }: {
  entry?: Observation
  save: (entry: Observation) => void
}) {
  return <Form action={entry ? 'Save changes' : 'Save observation'} attachments initialPhoto={entry?.photo} save={(data, photo) => {
    const title = readText(data, 'title')
    if (!title) throw new Error('Tell us what you noticed.')
    save({
      id:entry?.id ?? crypto.randomUUID(), title, photo, date:readText(data, 'date') || dateKey(),
      question:readText(data, 'question'), place:readText(data, 'place'),
      senses:readText(data, 'senses'), surprise:readText(data, 'surprise'),
    })
  }}>
    <Field name="title" label="What did we notice?" placeholder="A tiny trail of ants crossed the wall." value={entry?.title} required/>
    <details className="observation-details" open={Boolean(entry)}>
      <summary>Add details <span>(optional)</span><ChevronRight size={17}/></summary>
      <div>
        <div className="field-row"><Field name="place" label="Where did we notice it?" placeholder="On the garden wall" value={entry?.place}/><Field name="date" label="Date" type="date" value={entry?.date ?? dateKey()}/></div>
        <Field name="senses" label="What did it look, sound, feel or behave like?" multiline value={entry?.senses}/>
        <Field name="surprise" label="What surprised us?" multiline value={entry?.surprise}/>
        <Field name="question" label="Did a question come up?" placeholder="Where were the ants going?" value={entry?.question}/>
      </div>
    </details>
  </Form>
}

function ExplorationForm({ entry, save }: {
  entry?: Exploration
  save: (notes: string[], photo: string | undefined, resumeStep?: number) => void
}) {
  const [step, setStep] = useState(entry?.resumeStep ?? 0)
  const [notes, setNotes] = useState(() => steps.map((_, index) => entry?.notes[index] ?? ''))
  const prompt = useRef<HTMLTextAreaElement>(null)
  const final = step === steps.length - 1

  function move(next: number) {
    setStep(next)
    prompt.current?.focus()
  }

  return <Form action={final ? 'Finish' : 'Save for later'} attachments initialPhoto={entry?.photo}
    save={(_, photo, intent) => save(
      notes.map(note => note.trim()), photo, final && intent !== 'pause' ? undefined : step,
    )}
    extraActions={pending => final && <button className="secondary-button" value="pause" disabled={pending}>Save for later</button>}>
    <p className="eyebrow">Step {step + 1} of {steps.length}</p>
    <label className="field">
      <span>{steps[step]}</span>
      <textarea ref={prompt} rows={4} aria-describedby="exploration-hint" value={notes[step]} onChange={event => {
        const value = event.target.value
        setNotes(current => current.map((note, index) => index === step ? value : note))
      }}/>
    </label>
    <p className="step-hint" id="exploration-hint">{hints[step]}</p>
    <div className="form-actions">
      <button className="secondary-button" type="button" disabled={step === 0} onClick={() => move(step - 1)}>Back</button>
      {!final && <>
        <button className="secondary-button" type="button" onClick={() => move(step + 1)}>Next</button>
        <button className="text-link" type="button" onClick={() => move(step + 1)}>Skip</button>
      </>}
    </div>
  </Form>
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [journal, setJournal] = useState(() => journalStore.read())
  const [filter, setFilter] = useState<Kind>('All')
  const [message, setMessage] = useState('')
  const main = useRef<HTMLElement>(null)
  const [section, selected] = route.split('/')
  const question = journal.questions.find(item => item.id === selected)
  const draft = journal.explorations.find(item => item.questionId === question?.id && item.resumeStep !== undefined)
  const date = new Date()
  const [promptTitle, prompt] = prompts[(date.getDate() - 1) % prompts.length]
  const carrying = journal.questions.filter(item => !journal.explorations.some(exploration => exploration.questionId === item.id && exploration.resumeStep === undefined))
  useEffect(() => {
    function change() {
      const next = getRoute()
      setRoute(next)
      if (next.startsWith('library/')) setFilter('All')
      main.current?.focus()
      window.scrollTo(0, 0)
    }
    function sync(event: StorageEvent) { if (event.key?.startsWith('learning-compass.')) setJournal(journalStore.read()) }
    window.addEventListener('hashchange', change)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('hashchange', change); window.removeEventListener('storage', sync) }
  }, [])
  useEffect(() => {
    if (section === 'library' && selected) document.getElementById('entry-' + selected)?.scrollIntoView({ block: 'nearest' })
  }, [section, selected])
  function commit(update: (latest: Journal) => Journal, next: string, notice: string) {
    const updated = update(journalStore.read())
    journalStore.write(updated)
    setJournal(updated)
    setFilter('All')
    setMessage(notice)
    location.hash = next
  }
  function saveExploration(question: Question, entry: Exploration | undefined, notes: string[], photo: string | undefined, resumeStep?: number) {
    if (resumeStep === undefined && !notes.some(Boolean) && !photo) throw new Error('Add a note or picture before finishing.')
    const id = entry?.id ?? crypto.randomUUID()
    commit(latest => {
      const previous = latest.explorations.find(item => item.id === id)
      const anotherDraft = latest.explorations.some(item => item.questionId === question.id && item.id !== id && item.resumeStep !== undefined)
      if (!previous && anotherDraft) throw new Error('A draft was saved in another tab. Reopen this question to continue it.')
      const followUp = resumeStep === undefined && notes[6] && notes[6] !== previous?.notes[6]
        ? makeQuestion(notes[6])
        : resumeStep === undefined && notes[6] && previous?.resumeStep !== undefined
          ? makeQuestion(notes[6])
          : undefined
      const exploration = { ...previous, id, questionId:question.id, date:previous?.date ?? dateKey(), notes, photo, resumeStep }
      return {
        ...latest,
        explorations: previous ? latest.explorations.map(item => item.id === id ? exploration : item) : [exploration, ...latest.explorations],
        questions: followUp ? [followUp, ...latest.questions] : latest.questions,
      }
    }, 'library/' + id, resumeStep === undefined ? 'Exploration saved.' : 'Exploration saved for later.')
  }
  const questionRows = (items: Journal['questions']) => <div className="question-rows">{items.map(item => <a className="question-row" key={item.id} href={'#explore/' + item.id}><MessageCircle size={17}/><span>{item.title}{journal.explorations.some(entry => entry.questionId === item.id && entry.resumeStep !== undefined) && <small className="draft-label">In progress</small>}</span><ChevronRight size={17}/></a>)}</div>
  const entries = [
    ...journal.observations.map(item => ({...item, kind:'Observations', label:'Observation', summary:item.senses || item.place, detail:<><p>{item.place}</p><p>{item.senses}</p>{item.surprise && <p><strong>What surprised us</strong> {item.surprise}</p>}{item.question && <p><strong>What we wondered</strong> {item.question}</p>}</>})),
    ...journal.questions.map(item => ({...item, photo:undefined, kind:'Questions', label:'Question', summary:'', detail:<a className="text-link" href={'#explore/' + item.id}>Explore this question</a>})),
    ...journal.explorations.flatMap(item => {
      const title = journal.questions.find(question => question.id === item.questionId)?.title ?? 'Our exploration'
      const entry = {...item, title, kind:'Explorations', label:item.resumeStep === undefined ? 'Exploration' : 'Exploration in progress', summary:item.notes[5] || item.notes.find(Boolean) || '', detail:<><dl>{steps.map((step, i) => item.notes[i] && <div key={step}><dt>{step}</dt><dd>{item.notes[i]}</dd></div>)}</dl>{item.resumeStep !== undefined && <a className="text-link" href={'#explore/' + item.questionId}>Resume exploration</a>}</>}
      return item.resumeStep === undefined && item.notes[5] ? [entry, {...entry, photo:undefined, id:item.id + '-discovery', kind:'Discoveries', label:'Discovery', title:item.notes[5], summary:title}] : [entry]
    }),
  ].sort((a, b) => b.date.localeCompare(a.date))
  const recent = entries.filter(item => ['Discoveries','Observations'].includes(item.kind)).slice(0, 3)
  return <>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#today"><span className="brand-icon"><Compass size={24} strokeWidth={1.45}/></span><span>Learning Compass<small>A FAMILY FIELD JOURNAL</small></span></a>
      <nav aria-label="Main navigation">{routes.map(([id, label, Icon]) => <a key={id} href={'#'+id} aria-current={section === id ? 'page' : undefined}><Icon size={17}/>{label}</a>)}</nav>
    </div></header>
    <main ref={main} tabIndex={-1} className="shell">
      {message && <div className="notice" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}
      {section === 'today' && <>
        <header className="welcome"><p className="eyebrow"><Sun size={15}/>{date.toLocaleDateString('en', {weekday:'long',month:'long',day:'numeric'})}</p><h1>Hello, curious family.</h1><p>What might we notice together today?</p></header>
        <section className="hero" aria-labelledby="daily-title">
          <div className="hero-copy"><p className="eyebrow"><Sun size={16}/> Today’s wonder</p><h2 id="daily-title">{promptTitle}</h2><p>{prompt}</p><a className="button" href="#observe"><Eye size={18}/> Begin noticing</a></div>
          <img src="/meadow.jpg" alt="Soft morning light across a grassy meadow"/>
        </section>
        <div className="home-grid">
          <section className="home-questions"><div className="section-bar"><h2>Questions we’re carrying</h2><a className="text-link" href="#wonder"><Plus size={16}/> Add a question</a></div>
            {carrying.length ? questionRows(carrying.slice(0,3)) : <p>What did you wonder about today?</p>}
          </section>
          <aside className="activity"><img src="/leaves.jpg" alt="Green leaves in soft light"/><div><p className="eyebrow"><Leaf size={14}/> A small thing to try</p><h2>A leaf’s hidden lines</h2><p>Place a fallen leaf under paper and rub gently with the side of a crayon. Look closely at the pattern that appears.</p><a className="text-link" href="#observe">Record what you notice</a></div></aside>
        </div>
        <section className="recent"><div className="section-bar"><h2>Recent discoveries</h2><a className="text-link" href="#library">Open the library <ChevronRight size={16}/></a></div><div className="recent-grid">{recent.map(item => <a key={item.id} href={'#library/' + item.id}><Sprout size={20}/><span className="eyebrow">{item.label} · {readable(item.date)}</span><h3>{item.title}</h3></a>)}</div></section>
      </>}
      {section === 'observe' && <>
        <PageHeading label="Observe" title="Make a field note">Slow down and put what you noticed into your own words.</PageHeading>
        <ObservationForm save={observation => {
          const { question, date, id } = observation
          commit(latest => ({
            ...latest,
            observations:[observation, ...latest.observations],
            questions:question ? [{...makeQuestion(question, date), observationId:id}, ...latest.questions] : latest.questions,
          }), 'library/' + id, 'Observation saved.')
        }}/>
      </>}
      {section === 'wonder' && <>
        <PageHeading label="Wonder" title="Keep a question">Write down a question in your child’s own words. You can come back to it anytime.</PageHeading>
        <Form action="Save question" reset save={(data) => {
          const title = readText(data,'title')
          if (!title) throw new Error('Write the question you want to keep.')
          commit(latest => ({...latest, questions:[makeQuestion(title), ...latest.questions]}), 'wonder', 'Question saved.')
        }}><Field name="title" label="What are we wondering?" placeholder="Why do some leaves have different shapes?" required/></Form>
        <section className="collection"><h2>Our questions</h2>{questionRows(journal.questions)}</section>
      </>}
      {section === 'explore' && <>
        <PageHeading label="Explore" title={question?.title ?? 'Follow a question'}>{question ? 'Try one small thing together. You can save your notes and return to the question later.' : 'Pick a question to explore together.'}</PageHeading>
        {question ? <ExplorationForm key={draft?.id ?? question.id} entry={draft}
          save={(notes, photo, resumeStep) => saveExploration(question, draft, notes, photo, resumeStep)}/> : questionRows(journal.questions)}
      </>}
      {section === 'library' && <>
        <PageHeading label="Discovery library" title="Our field journal">Revisit the things you noticed, the questions you kept and what you found along the way.</PageHeading>
        <div className="filters" aria-label="Filter journal">{kinds.map(kind => <button key={kind} aria-pressed={filter === kind} onClick={() => {setFilter(kind); if (selected) location.hash = 'library'}}>{kind}</button>)}</div>
        <section className="timeline" aria-label="Journal entries">
          {entries.filter(entry => filter === 'All' || (filter === 'Photos & drawings' ? entry.photo : entry.kind === filter)).map(entry => <details id={'entry-' + entry.id} key={entry.id + (entry.id === selected ? '-selected' : '')} open={entry.id === selected || undefined}><summary><span className="eyebrow">{entry.label} · {readable(entry.date)}</span><strong>{entry.title}</strong><ChevronRight size={19}/></summary><div className="entry-detail">{entry.detail}{entry.photo && <img className="entry-photo" src={entry.photo} alt={'Journal attachment for ' + entry.title}/>}</div></details>)}
          {filter === 'Photos & drawings' && !entries.some(entry => entry.photo) && <p>Photos and pictures of drawings you attach to entries will appear here.</p>}
        </section>
      </>}
      {!routes.some(([id]) => id === section) && <PageHeading label="Field journal" title="Page not found"><a href="#today">Return to Today</a></PageHeading>}
    </main>
    <footer><div><Compass size={18}/> Learning Compass</div><span>Your journal entries are saved in this browser.</span></footer>
  </>
}

createRoot(document.getElementById('root')!).render(<App/>)
