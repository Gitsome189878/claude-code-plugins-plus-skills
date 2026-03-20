# Crash Course Learning

**Turn any question or topic into a structured crash course or quick answer.**

Built for anyone who wants to learn something without the frustration of trawling through endless Google results. Type your question, choose how deep you want to go, and get a clear, well-organised answer — all in one place.

---

## Commands

### `/crash-course <topic>`

Generates a full structured crash course on any topic — researched from the web, organised into numbered modules from basics to advanced, saved as a readable markdown file.

**What you get:**
- 5–12 learning modules (scaled to topic complexity)
- Each module: summary, key concepts, explanation, real example, sources
- Table of contents at the top
- Saved to `crash-course-[topic].md`

**Example:**
```
/crash-course how does the human immune system work
/crash-course type 2 diabetes
/crash-course the history of the internet
```

---

### `/minor-query <question>`

Quick answer to a specific question. Two sub-modes:

**Quick Brief** — Searches the web and compiles a clear 3-5 paragraph summary with source links. Best for factual questions.

**Interactive** — Asks you 3-5 follow-up questions to understand your specific situation, then gives a targeted answer. Best for personal questions (health, finance, decisions).

**Example:**
```
/minor-query what causes knee pain in older adults
/minor-query why do I feel tired after eating
/minor-query is it safe to take ibuprofen with paracetamol
```

---

## Auto-Activation (Skill)

The **crash-course-generator** skill auto-activates when you say things like:
- "Teach me about [topic]"
- "I want to learn [topic]"
- "How does [X] work?"
- "Help me understand [X]"
- "Crash course on [X]"

It will present you with the two modes and route accordingly.

---

## Agents

Two specialist agents power the research and content behind the scenes:

| Agent | Role |
|-------|------|
| `topic-researcher` | Runs web searches, evaluates source credibility, extracts facts |
| `module-architect` | Structures research into logical learning modules |

---

## Example Output

A crash course on "how vaccines work" might produce:

```
# Crash Course: How Vaccines Work

## Table of Contents
1. What is a vaccine and why do we need them?
2. How your immune system fights infection (the basics)
3. How vaccines train your immune system
4. Types of vaccines: live, inactivated, mRNA, and more
5. How vaccines are developed and tested
6. Common questions and misconceptions
7. The impact of vaccines on public health
```

Each module contains a plain-English explanation, a concrete example, and source links.

---

## Install

```bash
/plugin add crash-course-learning
```

---

## Author

Built with care for anyone who wants to learn — at any age, at any pace.
