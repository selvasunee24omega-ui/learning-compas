# Learning Compass

Learning Compass is a family field journal. Start with a daily wonder, record something you notice together, or choose a question to explore.

## Run it locally

Install Node.js 22 or later. In this folder, run:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to type-check the application and generate the static site in `dist/`.

## How it works

React renders the five screens, and Vite runs the development server. `src/journal.ts` contains the record types and browser storage adapter. `src/main.tsx` contains the screens, forms and navigation. Guided inquiry prompts are written into the app. Your notes and resized photos are stored in the browser that saved them. The journal begins with sample entries and stays separate across browsers, devices and site URLs. Clearing site data removes the entries saved there.

The Today photographs are from Unsplash (photo IDs 1470252649378-9c29740c9fa8 and 1501004318641-b39e6451bec6).
