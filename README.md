# IT0049 Reviewer

A reviewer website for **IT0049 Web System Technologies**, built from the Module 1–8 slides:

| Track | Modules |
|---|---|
| CodeIgniter 4 | M1 Foundations · M2 Data Layer · M3 Forms, Validation, File Upload and CRUD · M4 Authentication and Sessions |
| Laravel | M5 Foundations · M6 Data Layer · M7 Forms, Validation and File Upload · M8 Full CRUD, Auth and Email Notifications |

The course builds one task manager twice, first in CodeIgniter and then in Laravel, and the reviewer follows the same path.

## What's inside

- **63 lessons.** Each one has:
  - a plain-language explanation
  - the code from the slides, where you can click any line marked with a dot to read its note
  - a request-path rail (Browser → Route → Filter/Middleware → Controller → Model → View). On the auth lessons you can run the request as a guest or as a logged-in user.
  - a quick check, common mistakes, and a link to the same idea in the other framework
- **Practice exams** drawing from **255 questions** (192 in the question banks plus 63 lesson quick checks):
  - five question types: multiple choice, true/false, identification, fill in the code, and put in order
  - Midterm (M1–M4), Finals (M5–M8) or any mix of modules
  - optional timer, with feedback after each question or at the end
  - a results page and "Retry what I missed"
- **CI ↔ Laravel translator**: 21 concepts side by side, with a "hide one side" self-test.
- **Flashcards**: 150 cards built from the cheat sheets, using simple Leitner boxes.
- **Cheat sheets and glossary**: printable, plus search across everything.
- **Home dashboard**:
  - a daily goal measured in study points (2 per correct answer, 1 per attempt, 5 per lesson, 1 per flashcard)
  - a streak and a 7-day activity strip
  - the course map with a mastery level per module (Not started → Learning → Practicing → Exam-ready) and the exact targets for the next level
  - weak spots
- **Encouragement where it counts**:
  - a one-click "Mark done and continue"
  - toasts when you finish a lesson, a module or the daily goal
  - a counter for correct answers in a row
  - personal bests per exam scope
  - results that tell you what to do next
- **Keyboard shortcuts**: 1–4 to choose, Enter to check and continue; on flashcards, Space to flip and 1/2/3 to rate.
- **Light and dark themes** and three text sizes.

Progress is stored in the browser's `localStorage` only. There is no backend, no account and no tracking. Anything marked **Added for clarity** is not in the slides. These are small fills where a slide was cut off or skipped a step, such as the M8 `destroy()` method.

## Run it locally

No install step is needed. You need Node 18 or newer.

```bash
npm run check   # validates all content (lessons, questions, notes, links)
npm run dev     # serves ./public at http://localhost:5180
```

Any static server works too, for example `npx serve public`.

## Deploy on Render (free static site)

Static sites are free on Render. This repo includes a Blueprint in `render.yaml`.

1. Sign in at [dashboard.render.com](https://dashboard.render.com) and connect your GitHub account.
2. Click **New → Blueprint**, pick this repository, and click **Apply**. Render reads `render.yaml` and creates one static site named `websys-reviewer`.
3. Wait for the first deploy. The site is served at `https://websys-reviewer.onrender.com` (or a similar name if that one is taken).

To set it up by hand instead, use **New → Static Site** with these settings:

| Setting | Value |
|---|---|
| Branch | `main` |
| Build command | `node scripts/check.mjs` |
| Publish directory | `public` |

Every push to `main` redeploys the site. The build command is the content validator, so a broken question or lesson stops the deploy instead of shipping. Static sites have no server and don't sleep, so the free tier has no cold starts.

## Project layout

```
public/
  index.html                 app shell
  assets/css/app.css         design tokens (light/dark), layout, components
  assets/js/app.js           hash router and event delegation
  assets/js/views/           home, learn, practice, cards, compare, reference, settings
  assets/js/content/m1–m8.js lessons and question banks, one file per module
  assets/js/content/translator.js, reference.js
scripts/check.mjs            content validator (also Render's build command)
scripts/dev-server.mjs       local preview server
render.yaml                  Render Blueprint
```

### Adding or fixing content

Each module file exports its lessons and its `quiz` array. Code notes attach to a line by matching text (`['->find($id)', 'Title', 'Body']`) or by line number. Run `npm run check` after editing. It reports any note that matches no line, any wrong answer index, and any broken lesson or concept link.
