---
name: crash-course-generator
description: |
  Auto-activates when the user expresses a desire to learn something or asks for help
  understanding a topic. Trigger phrases include: "teach me about", "I want to learn",
  "crash course on", "explain X from the basics", "how does X work", "help me understand",
  "I don't understand X", "can you explain", "what is X and how does it work", "I need to
  know about", "learn everything about". Presents the user with two paths: Minor Query
  (for quick specific questions) or Full Crash Course (for comprehensive learning).
allowed-tools: Read, Write, WebSearch, WebFetch, Task, AskUserQuestion, TodoWrite, Skill
version: 1.0.0
author: Gitsome189878
license: MIT
tags: [learning, education, research, study, crash-course, modules, knowledge]
compatible-with: claude-code
---

# Crash Course Generator

When a user expresses a desire to learn about something or asks for help understanding a topic, this skill kicks in to present them with a structured choice between two powerful learning modes.

## Activation

This skill activates when you detect any of these signals in the user's message:
- "teach me about [X]"
- "I want to learn [X]"
- "crash course on [X]"
- "explain [X] from the basics / from scratch"
- "how does [X] work"
- "help me understand [X]"
- "I don't understand [X]"
- "can you explain [X]"
- "what is [X] and how does it work"
- "I need to know about [X]"
- User asks a question about a topic they clearly want to fully understand (not just a one-liner fact)

## What to Do

### Step 1: Extract the Topic

Identify the core topic or question from the user's message.

If the topic is clear: proceed.
If it's ambiguous: ask one simple clarifying question: "Just to make sure I focus on the right thing — are you asking about [X] or more about [Y]?"

### Step 2: Present the Two Modes

Use AskUserQuestion to let the user choose:

**Mode 1 — Minor Query** (for a specific question or concern):
> Best when you have a specific question and want a clear, reliable answer quickly. You can choose a compiled summary with sources, or an interactive session where I ask you questions to narrow down the best answer for your specific situation.

**Mode 2 — Full Crash Course** (for comprehensive learning):
> Best when you want to really understand a topic — from the basics all the way through. I'll research it thoroughly and organise everything into numbered modules you can read at your own pace.

Present as: "How would you like to explore [topic]?"

### Step 3: Route to the Right Command

**If Minor Query chosen:** Follow the `/minor-query` command flow — ask if they want Quick Brief or Interactive, then proceed accordingly.

**If Full Crash Course chosen:** Follow the `/crash-course` command flow — clarify any angle preferences, research thoroughly, write complete modules.

## Tone

Be warm and encouraging. The user has just said they want to learn something — that's a great instinct. Make them feel like they've come to exactly the right place.

Do not be robotic or overly formal. This skill is designed to feel like having a knowledgeable friend who is happy to explain anything.

## Examples of What This Produces

### Minor Query → Quick Brief
> User: "What causes high blood pressure?"
> → 4-paragraph compiled answer + 3 source links, saved to file

### Minor Query → Interactive
> User: "I've been having a dull ache in my knee for a few weeks"
> → 4 follow-up questions → targeted 3-paragraph explanation with next steps

### Full Crash Course
> User: "Teach me about the human digestive system"
> → 9 modules: What it is → Mouth & oesophagus → Stomach → Small intestine → Large intestine → Liver, pancreas & gallbladder → The gut microbiome → Common issues → How to support digestive health
> Saved as `crash-course-human-digestive-system.md`
