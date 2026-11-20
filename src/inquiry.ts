export const routines = {
  noticing: { title: 'See–Think–Wonder', prompts: [
    'What catches your eye?', 'What does it remind you of?', 'What would you like to look at more closely?',
  ] },
  investigating: { title: 'Notice–Predict–Investigate', prompts: [
    'What do you notice happening?', 'What do you think might happen next?', 'How could we look again to check?',
  ] },
  predicting: { title: 'Predict–Observe–Explain', prompts: [
    'What do you think might happen if we change one thing?', 'What changed when you watched?', 'What did you see that helps explain the change?',
  ] },
  viewpoints: { title: 'Circle of Viewpoints', prompts: [
    'How might someone else see this?', 'What might matter to them?', 'What could you ask to find out how they feel?',
  ] },
  reflecting: { title: 'I Used to Think… Now I Think…', prompts: [
    'Has your thinking changed?', 'What did you see or hear that changed your mind?', 'How could you show your new idea in a drawing?',
  ] },
} as const

export type Routine = keyof typeof routines
export type Invitation = { id: string; routine: Routine; prompt: string; reason: string }
export type InquiryMoment = { invitation: Invitation; response: string; photo?: string; recordedAt: string }
export type InquiryInput = {
  words: string
  moments: readonly InquiryMoment[]
  override?: Routine
  skipped?: readonly string[]
}
export interface SuggestionEngine {
  suggest(input: InquiryInput): Invitation | null
}

const rules: { routine: Routine; pattern: RegExp; reason: string }[] = [
  { routine:'reflecting', pattern:/\b(used to think|now i think|changed my mind|thought .+ but|i was wrong)\b/i, reason:'The words suggest an idea may have changed.' },
  { routine:'viewpoints', pattern:/\b(fair|fairness|unfair|share|sharing|taking turns|left out|hurt feelings)\b/i, reason:'The words suggest more than one point of view could matter.' },
  { routine:'predicting', pattern:/\b(melt\w*|freez\w*|froze|shadow\w*|evaporat\w*|what (?:would|will) happen if|what if)\b/i, reason:'The words suggest a change you could watch or try.' },
  { routine:'investigating', pattern:/\b(why|how (?:do|does|can|did|come)|flock\w*|ants? .{0,25}carr\w*|carr\w* .{0,25}ants?)\b/i, reason:'The words suggest something happening that you could watch.' },
]

export const ruleBasedSuggestions: SuggestionEngine = {
  suggest({ words, moments, override, skipped = [] }) {
    const matched = [...moments].reverse().find(moment => rules.some(rule => rule.pattern.test(moment.response)))
    const match = (matched && rules.find(rule => rule.pattern.test(matched.response))) ?? rules.find(rule => rule.pattern.test(words))
    const routine = override ?? (match?.routine ?? 'noticing')
    const used = new Set([...skipped, ...moments.map(moment => moment.invitation.id)])
    const recordedObservation = moments.some(moment => moment.invitation.id === 'predicting-1')
    const index = routines[routine].prompts.findIndex((_, index) => {
      if (routine === 'predicting' && index === 2 && !recordedObservation) return false
      return !used.has(routine + '-' + index)
    })
    if (index >= 0) return {
      id: routine + '-' + index, routine, prompt: routines[routine].prompts[index],
      reason: override ? 'You chose this approach.' : match ? match.reason : 'Looking closely is a gentle place to start.',
    }
    if (used.has('quiet')) return null
    return { id:'quiet', routine, prompt:'Would you like to draw what you noticed or sit quietly with it for a moment?', reason:'A quiet pause gives the child room to decide where to go next.' }
  },
}
