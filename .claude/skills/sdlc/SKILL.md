---
name: sdlc
description: Run the AI SDLC team (Product, Architect, Developer, QA, Reviewer, DevOps) on a feature request in the current repo, with human approval gates on spec, design and merge. Use when the user types /sdlc or asks the SDLC team to build a feature.
argument-hint: "<feature request in plain English>"
disable-model-invocation: true
---
# AI SDLC team

You are the **orchestrator**. You run the stages below in order, pass work between the specialist subagents as files, run the tests yourself, and stop at every human gate. Subagents never call each other; every hand-off goes through the run folder.

Feature request: $ARGUMENTS

If the request is empty, ask the user what to build and stop.

## 0. Prepare

1. Confirm the current directory is a git repo with no uncommitted changes (`git status --porcelain`). If it is dirty, stop and ask the user to commit or stash. If it is not a git repo, ask before running `git init`.
2. Note the current branch as BASE.
3. Make RUN_ID = `YYYYMMDD-HHMM-<short-slug-of-request>`. Create `.ai-sdlc/runs/RUN_ID/` and make sure `.ai-sdlc/` is listed in `.git/info/exclude` so run files are never committed.
4. Write the request to `.ai-sdlc/runs/RUN_ID/request.md`.
5. Create branch `ai/RUN_ID` from BASE.

Below, RUN = `.ai-sdlc/runs/RUN_ID`.

## 1. Product → spec

Call subagent **sdlc-product** with the request. Save its final message to `RUN/spec.md`.

**Gate 1 (spec).** Show the user the spec in full and ask: approve, edit (they edit `RUN/spec.md` or tell you what to change), or stop. Use AskUserQuestion. Do not continue without approval. If they stop, tell them how to resume: run `/sdlc resume RUN_ID`.

## 2. Architect → design

Call **sdlc-architect** with the approved `RUN/spec.md` contents. Save its final message to `RUN/design.md`. Take the test command from its "Stack" section; if missing, work it out from the repo.

**Gate 2 (design).** Show the design and ask for approval as in Gate 1. Re-read `RUN/design.md` after approval, since the user may have edited it.

## 3. Build loop (max 3 rounds)

Repeat up to 3 times:

1. Call **sdlc-developer**: give it the paths of `RUN/spec.md` and `RUN/design.md` and, from round 2 on, `RUN/test-output.txt`, `RUN/test-report.md` and any `RUN/review.md` "Must fix" items to fix.
2. Call **sdlc-qa**: give it `RUN/spec.md` and tell it to write its report to `RUN/test-report.md`.
3. **Run the test command yourself** and save the output to `RUN/test-output.txt`. This is the objective check; do not rely on an agent's word.
4. If the suite passes AND `RUN/test-report.md` contains `OVERALL: PASS`, commit all changes on the branch (`ai-sdlc(RUN_ID): implement + tests`) and go to step 4.

If it still fails after 3 rounds, stop and report what is failing, with the paths to the output and report.

## 4. Review (can send back once)

Save `git diff BASE...HEAD` to `RUN/diff.patch`. Call **sdlc-reviewer** with the spec, test report and diff paths. Save its final message to `RUN/review.md`.

If `VERDICT: CHANGES` and this is the first review, go back to step 3 (a fresh 3 rounds) with the review as feedback. After the second review, carry on regardless; the human decides at the merge gate.

## 5. DevOps → PR text

Call **sdlc-devops** with the paths of the spec, design, test report and review. Save its message to `RUN/pr.md`.

## 6. Gate 3 (merge)

Show the user `RUN/pr.md`, the review verdict, the test result and `git diff --stat BASE...HEAD`. Ask which they want:
- **Open a PR**: push the branch and run `gh pr create --base BASE --head ai/RUN_ID --title <first line> --body-file <rest>`. Only if the repo has a remote and `gh` is installed and authenticated.
- **Merge locally**: `git checkout BASE && git merge --no-ff ai/RUN_ID`.
- **Leave it** on the branch for them to look at.

Never push, open a PR or merge without that explicit choice.

## Rules for you as orchestrator

- Keep `RUN/state.md` up to date: current stage, round numbers, gate approvals with times, and a one-line log entry per step. `/sdlc resume RUN_ID` reads it, checks out the branch and continues from the recorded stage.
- Do not do a specialist's job yourself. If an agent's output is malformed, call it again once with the problem pointed out.
- Between stages, tell the user in one line what is happening (e.g. "Spec approved. Architect is designing…").
- At the end, summarise: branch, files changed, ACs passing, review verdict, and where the run files are.
