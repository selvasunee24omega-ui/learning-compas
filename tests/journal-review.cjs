const assert = require('node:assert/strict')
const { chromium } = require('playwright-core')
const path = require('node:path')

const base = process.env.JOURNAL_TEST_URL || 'http://localhost:4190/'
const key = 'learning-compass.journal.v1'
const notes = ['A guess', 'Something moved', 'Move the light', 'A lamp', 'The wall', 'It grew', '', 'We drew it']
const seed = {
  observations: [{ id: 'o', date: '2026-11-18', title: 'A shadow', place: 'Window', senses: 'Long', surprise: '' }],
  questions: [{ id: 'q', date: '2026-11-18', title: 'Why did it move?', observationId: 'o' }],
  explorations: [
    { id: 'completed', date: '2026-11-18', questionId: 'q', notes },
    { id: 'draft', date: '2026-11-19', questionId: 'q', resumeStep: 7, notes: [...notes.slice(0, 6), 'Can we make two shadows?', notes[7]] },
    { id: 'legacy', date: '2026-11-17', questionId: 'q', notes: [...notes.slice(0, 6), 'What if it rains?', notes[7]] },
  ],
}

async function check(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 850 } })
  context.setDefaultTimeout(10000)
  try {
    const editor = await context.newPage()
    const other = await context.newPage()
    const go = (page, route) => page.goto(base + '#' + route)
    const button = (page, name) => page.getByRole('button', { name, exact: true })
    const read = () => editor.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    const record = async id => (await read()).explorations.find(item => item.id === id)
    const prompt = page => page.locator('textarea')
    const jump = (page, index) => page.getByLabel('Jump to a prompt').selectOption(String(index))
    const notice = async (page, message) => {
      if (message.startsWith('Exploration ')) await page.waitForURL(/#library\//)
      await page.getByRole('status').filter({ hasText: message }).waitFor()
    }

    await go(editor, 'library')
    await editor.evaluate(([key, seed]) => localStorage.setItem(key, JSON.stringify(seed)), [key, seed])
    await editor.reload()
    await editor.getByText('This version cannot restore a journal', { exact: false }).waitFor()
    await go(editor, 'explore/q/completed')
    await prompt(editor).fill('An edited guess')
    await jump(editor, 6)
    assert.equal(await prompt(editor).evaluate(element => element === document.activeElement), true)
    await prompt(editor).fill('Where else could we look?')
    await jump(editor, 3)
    await button(editor, 'Save changes').click()
    await notice(editor, 'Exploration updated.')
    const completed = await record('completed')
    assert.deepEqual(completed.notes, ['An edited guess', ...notes.slice(1, 6), 'Where else could we look?', notes[7]])
    assert.deepEqual(await record('draft'), seed.explorations[1])
    assert.deepEqual(await record('legacy'), seed.explorations[2])

    await go(editor, 'explore/q/completed')
    await jump(editor, 6)
    await prompt(editor).fill('Where else could we look today?')
    await button(editor, 'Save changes').click()
    await notice(editor, 'Exploration updated.')
    assert.equal((await record('completed')).followUpQuestionId, completed.followUpQuestionId)
    assert.equal((await read()).questions.length, 2)
    assert.equal((await read()).questions.find(item => item.id === completed.followUpQuestionId).title, 'Where else could we look today?')

    await go(editor, 'explore/q/legacy')
    await jump(editor, 6)
    await prompt(editor).fill('What if it rains again?')
    await button(editor, 'Save changes').click()
    await notice(editor, 'Exploration updated.')
    assert.equal((await read()).questions.length, 2)

    await go(editor, 'explore/q')
    await go(other, 'explore/q')
    await prompt(editor).fill('We traced it on paper.')
    await prompt(other).fill('An unsaved note in the other tab.')
    await editor.evaluate(() => {
      const decode = window.createImageBitmap.bind(window)
      window.createImageBitmap = async (...args) => {
        await new Promise(resolve => { window.releaseImageForTest = resolve })
        return decode(...args)
      }
    })
    await editor.locator('input[type=file]').setInputFiles(path.join(__dirname, '../public/leaves.jpg'))
    await notice(editor, 'Preparing image')
    assert.equal(await button(editor, 'Finish').isDisabled(), true)
    assert.equal(await button(editor, 'Save for later').isDisabled(), true)
    await button(editor, 'Back').click()
    assert.equal(await button(editor, 'Save for later').isDisabled(), true)
    await button(editor, 'Next').click()
    assert.deepEqual(await record('draft'), seed.explorations[1])
    await editor.evaluate(() => window.releaseImageForTest())
    await editor.getByAltText('Selected journal attachment').waitFor()

    // Hold both submits at the lock so each tab attempts to finish the same draft.
    await editor.evaluate(key => {
      navigator.locks.request(key, () => new Promise(resolve => { window.releaseSaveForTest = resolve }))
    }, key)
    await editor.waitForFunction(() => Boolean(window.releaseSaveForTest))
    const waitForQueuedSaves = count => editor.waitForFunction(async ([key, count]) => {
      const { pending } = await navigator.locks.query()
      return pending.filter(lock => lock.name === key).length === count
    }, [key, count])
    await button(editor, 'Finish').click()
    await waitForQueuedSaves(1)
    await button(other, 'Finish').click()
    await waitForQueuedSaves(2)
    await editor.evaluate(() => window.releaseSaveForTest())
    await notice(editor, 'Exploration saved.')
    await other.bringToFront()
    await other.locator('[role=alert]').filter({ hasText: 'changed in another tab' }).waitFor()
    assert.equal(await prompt(other).inputValue(), 'An unsaved note in the other tab.')
    assert.equal((await read()).questions.filter(item => item.title === 'Can we make two shadows?').length, 1)
    const finished = await record('draft')
    assert.equal(finished.resumeStep, undefined)
    assert.equal(finished.notes[7], 'We traced it on paper.')
    assert.match(finished.photo, /^data:image\/jpeg/)

    await editor.bringToFront()
    await go(editor, 'explore/q/draft')
    await button(editor, 'Remove image').click()
    await editor.evaluate(key => {
      const setItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('Test quota exceeded', 'QuotaExceededError')
        return setItem.call(this, name, value)
      }
      window.restoreStorageForTest = () => { Storage.prototype.setItem = setItem }
    }, key)
    await prompt(editor).fill('Keep this text when storage is full.')
    await button(editor, 'Save changes').click()
    await editor.locator('[role=alert]').filter({ hasText: 'freeing some browser storage' }).waitFor()
    assert.equal(await prompt(editor).inputValue(), 'Keep this text when storage is full.')
    assert.deepEqual(await record('draft'), finished)
    await editor.evaluate(() => window.restoreStorageForTest())
    await button(editor, 'Save changes').click()
    await notice(editor, 'Exploration updated.')
    await editor.reload()
    assert.equal((await record('draft')).photo, undefined)
    assert.equal((await record('draft')).notes[0], 'Keep this text when storage is full.')
    assert.deepEqual((await read()).observations, seed.observations)
    assert.deepEqual((await read()).questions.find(item => item.id === 'q'), seed.questions[0])
    assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    console.log('Review regression checks passed at ' + width + ' px.')
  } finally {
    await context.close()
  }
}

;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH })
  try {
    for (const width of [390, 1280]) await check(browser, width)
  } finally {
    await browser.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
