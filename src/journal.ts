export type Observation = { id: string; date: string; title: string; place: string; senses: string; surprise: string; question?: string; photo?: string }
export type Question = { id: string; date: string; title: string; observationId?: string }
export type Exploration = { id: string; date: string; questionId: string; notes: string[]; photo?: string; resumeStep?: number }
export type Journal = { observations: Observation[]; questions: Question[]; explorations: Exploration[] }
export const steps = ['What do we already think?', 'What can we observe?', 'What could we try?', 'What materials do we need?', 'What should we look for?', 'What did we discover?', 'What new question emerged?', 'What could we draw or make? How did exploring feel?']
export const hints = ['Take turns sharing a guess. What made you think of it?', 'Choose something nearby you can look at or listen to together.', 'Try changing one thing and see what happens.', 'Start with things you already have at home.', 'What might stay the same? What could change?', 'Describe what happened in your own words.', 'Did something you saw make you wonder again?', 'A sketch, a few words, or a quiet moment are all welcome.']
export function dateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return dateKey(date)
}
export function readable(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}
const sample: Journal = {
  observations: [
    {id:'o1', date:daysAgo(2), title:'Rain beads on a leaf', place:'On the balcony', senses:'The drops looked like tiny glass marbles. They rolled off when we tilted the leaf.', surprise:'One leaf stayed dry after we shook it.'},
    {id:'o2', date:daysAgo(5), title:'A feather on the path', place:'At the park', senses:'It had a soft grey edge and a white stripe down the middle.', surprise:'It spun as it fell.'},
  ],
  questions: [
    {id:'q1', date:daysAgo(1), title:'Why do birds fly together?'},
    {id:'q2', date:daysAgo(2), title:'Where does rain go after it lands?'},
    {id:'q3', date:daysAgo(3), title:'Why do some leaves have different shapes?'},
    {id:'q4', date:daysAgo(4), title:'What happens to a shadow when we move the light?'},
  ],
  explorations: [{id:'e1', date:daysAgo(4), questionId:'q4', notes:['We guessed the shadow would move.', 'We looked at the edge of the shadow.', 'We moved the torch closer to a toy.', 'A toy, a torch and a wall.', 'We watched the size of the shadow.', 'The shadow grew as the torch got closer to the toy.', 'Can two lights make two shadows?', 'We drew around the toy’s shadow.']}],
}
const key = 'learning-compass.journal.v1'
export const journalStore = {
  read(): Journal {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : sample
  },
  write(journal: Journal) { localStorage.setItem(key, JSON.stringify(journal)) },
}
export async function prepareImage(file: File) {
  const image = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image processing unavailable')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.78)
  } finally { image.close() }
}
