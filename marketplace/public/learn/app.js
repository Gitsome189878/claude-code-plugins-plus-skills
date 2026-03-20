/**
 * Crash Course Learning App
 * Uses the Anthropic Claude API directly from the browser.
 * API key stored in localStorage — never sent anywhere except api.anthropic.com
 */

// ─── State ──────────────────────────────────────────────────────────────────

const state = {
  apiKey: '',
  currentTopic: '',
  currentMode: null,       // 'quick-brief' | 'interactive' | 'crash-course'
  conversationHistory: [],  // for interactive mode
  interactiveDone: false,
};

// ─── DOM refs ───────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const screens = {
  home: $('home-screen'),
  modeSelector: $('mode-selector-screen'),
  results: $('results-screen'),
};

// ─── Screen navigation ──────────────────────────────────────────────────────

function showScreen(name) {
  Object.values(screens).forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  screens[name].classList.remove('hidden');
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target === 'home-screen') {
      showScreen('home');
      resetResults();
    }
  });
});

function resetResults() {
  $('results-content').innerHTML = '';
  $('results-title').textContent = '';
  $('results-mode-badge').textContent = '';
  $('module-nav').classList.add('hidden');
  $('module-nav-list').innerHTML = '';
  $('module-filter').classList.add('hidden');
  $('module-filter').value = '';
  state.conversationHistory = [];
  state.interactiveDone = false;
}

// ─── Settings ───────────────────────────────────────────────────────────────

function loadApiKey() {
  state.apiKey = localStorage.getItem('claude_api_key') || '';
}

$('settings-btn').addEventListener('click', () => {
  $('api-key-input').value = state.apiKey;
  $('settings-overlay').classList.remove('hidden');
});

$('save-settings-btn').addEventListener('click', () => {
  const key = $('api-key-input').value.trim();
  if (key) {
    state.apiKey = key;
    localStorage.setItem('claude_api_key', key);
  }
  $('settings-overlay').classList.add('hidden');
});

$('cancel-settings-btn').addEventListener('click', () => {
  $('settings-overlay').classList.add('hidden');
});

$('settings-overlay').addEventListener('click', (e) => {
  if (e.target === $('settings-overlay')) $('settings-overlay').classList.add('hidden');
});

// ─── Main query buttons ──────────────────────────────────────────────────────

$('quick-answer-btn').addEventListener('click', () => {
  const query = $('main-query').value.trim();
  if (!query) { alert('Please type your question first.'); return; }
  if (!ensureApiKey()) return;
  state.currentTopic = query;
  $('mode-selector-topic-display').textContent = `"${query}"`;
  showScreen('modeSelector');
});

$('crash-course-btn').addEventListener('click', () => {
  const query = $('main-query').value.trim();
  if (!query) { alert('Please type your topic first.'); return; }
  if (!ensureApiKey()) return;
  state.currentTopic = query;
  state.currentMode = 'crash-course';
  startCrashCourse(query);
});

// ─── Mode selector ──────────────────────────────────────────────────────────

$('quick-brief-btn').addEventListener('click', () => {
  state.currentMode = 'quick-brief';
  startQuickBrief(state.currentTopic);
});

$('interactive-btn').addEventListener('click', () => {
  state.currentMode = 'interactive';
  startInteractive(state.currentTopic);
});

// ─── API key guard ──────────────────────────────────────────────────────────

function ensureApiKey() {
  if (!state.apiKey) {
    $('api-key-input').value = '';
    $('settings-overlay').classList.remove('hidden');
    alert('Please enter your Claude API key in settings first.');
    return false;
  }
  return true;
}

// ─── Claude API call ─────────────────────────────────────────────────────────

async function callClaude({ system, messages, onChunk, maxTokens = 4096 }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': state.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const text = parsed.delta.text;
            fullText += text;
            if (onChunk) onChunk(text, fullText);
          }
        } catch { /* ignore parse errors in SSE stream */ }
      }
    }
  }

  return fullText;
}

// ─── Loading helpers ─────────────────────────────────────────────────────────

function showLoading(msg = 'Researching your question...') {
  $('loading-message').textContent = msg;
  $('loading-overlay').classList.remove('hidden');
}
function hideLoading() {
  $('loading-overlay').classList.add('hidden');
}

// ─── Quick Brief ─────────────────────────────────────────────────────────────

async function startQuickBrief(topic) {
  showLoading('Researching your question...');
  showScreen('results');
  resetResults();
  $('results-title').textContent = topic;
  $('results-mode-badge').textContent = 'Quick Brief';

  const contentArea = $('results-content');
  const block = document.createElement('div');
  block.className = 'content-block';
  block.innerHTML = '<h2>Your Answer</h2><div class="streaming-content"></div>';
  contentArea.appendChild(block);
  const streamEl = block.querySelector('.streaming-content');

  const system = `You are a knowledgeable, warm helper. The user has asked a question and wants a clear, compiled answer.

Your response must be formatted in clean Markdown:
1. Start with a 1-2 sentence direct answer in **bold**.
2. Then write 3-5 paragraphs covering the main aspects. Use plain language. Bold the most important phrase in each paragraph.
3. Add a "Key Points" section as a bullet list.
4. Add a "Sources" section with 3-5 real, relevant URLs formatted as markdown links. Only include URLs you are confident exist and are relevant.

Be warm, clear, and concise. Never use condescending phrases like "simply" or "obviously". Write for a curious person of any age.`;

  try {
    let accumulated = '';
    await callClaude({
      system,
      messages: [{ role: 'user', content: `Please answer this question clearly: ${topic}` }],
      onChunk: (chunk, full) => {
        accumulated = full;
        streamEl.innerHTML = markdownToHtml(full);
      },
      maxTokens: 1500,
    });
    hideLoading();

    // Add "Go deeper" offer
    const deeper = document.createElement('div');
    deeper.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-3);';
    deeper.innerHTML = `<p style="color: var(--text-3); font-size: 0.95rem;">Want to learn more?</p>
      <button class="btn-primary" id="go-deeper-btn" style="margin-top: 0.5rem;">Generate Full Crash Course on this topic</button>`;
    block.appendChild(deeper);
    $('go-deeper-btn').addEventListener('click', () => {
      state.currentMode = 'crash-course';
      startCrashCourse(topic);
    });

  } catch (err) {
    hideLoading();
    streamEl.innerHTML = `<p style="color: red;">Error: ${err.message}</p><p>Check your API key in settings and try again.</p>`;
  }
}

// ─── Interactive mode ─────────────────────────────────────────────────────────

function startInteractive(topic) {
  showScreen('results');
  resetResults();
  $('results-title').textContent = topic;
  $('results-mode-badge').textContent = 'Interactive';
  hideLoading();

  // Build chat UI
  const contentArea = $('results-content');
  const chatArea = document.createElement('div');
  chatArea.className = 'chat-area';
  chatArea.innerHTML = `
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-area">
      <input type="text" class="chat-input" id="chat-input" placeholder="Type your answer..." />
      <button class="btn-primary" id="chat-send-btn">Send</button>
    </div>
  `;
  contentArea.appendChild(chatArea);

  const systemPrompt = `You are a warm, patient helper conducting an interactive conversation to understand the user's specific situation regarding: "${topic}".

Your goal is to ask 3-5 targeted follow-up questions ONE AT A TIME. Wait for each answer before asking the next.

After collecting enough context (usually after 3-4 exchanges), provide a specific, targeted answer based on what the user told you. Structure your final answer with:
- A direct explanation addressing their specific situation
- What this might mean for them
- Practical next steps
- 2-3 relevant source links

Start with one warm, open-ended first question about their specific situation. Keep questions short and conversational — not clinical.`;

  state.conversationHistory = [];

  async function sendMessage(userText) {
    addChatBubble(userText, 'user');
    state.conversationHistory.push({ role: 'user', content: userText });

    const typingBubble = addChatBubble('...', 'assistant');
    $('chat-input').disabled = true;
    $('chat-send-btn').disabled = true;

    try {
      let responseText = '';
      await callClaude({
        system: systemPrompt,
        messages: state.conversationHistory,
        onChunk: (chunk, full) => {
          responseText = full;
          typingBubble.innerHTML = markdownToHtml(full);
        },
        maxTokens: 800,
      });
      state.conversationHistory.push({ role: 'assistant', content: responseText });

      // Check if this looks like a final answer (has sources/next steps sections)
      const isFinal = responseText.toLowerCase().includes('sources') ||
                      responseText.toLowerCase().includes('next step') ||
                      state.conversationHistory.filter(m => m.role === 'user').length >= 4;

      if (isFinal && !state.interactiveDone) {
        state.interactiveDone = true;
        const deeper = document.createElement('div');
        deeper.style.cssText = 'margin-top: 1rem; text-align: center;';
        deeper.innerHTML = `<button class="btn-secondary small" id="interactive-deeper-btn">Generate Full Crash Course on this topic</button>`;
        $('chat-messages').appendChild(deeper);
        $('interactive-deeper-btn').addEventListener('click', () => {
          state.currentMode = 'crash-course';
          startCrashCourse(topic);
        });
        $('chat-input').disabled = true;
        $('chat-send-btn').disabled = true;
        return;
      }

    } catch (err) {
      typingBubble.innerHTML = `<span style="color: red;">Error: ${err.message}</span>`;
    }

    $('chat-input').disabled = false;
    $('chat-send-btn').disabled = false;
    $('chat-input').focus();
  }

  // Start the conversation
  sendMessage(topic);

  $('chat-send-btn').addEventListener('click', () => {
    const text = $('chat-input').value.trim();
    if (!text) return;
    $('chat-input').value = '';
    sendMessage(text);
  });
  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      $('chat-send-btn').click();
    }
  });
}

function addChatBubble(text, role) {
  const messages = $('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = markdownToHtml(text);
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

// ─── Crash Course ─────────────────────────────────────────────────────────────

async function startCrashCourse(topic) {
  showLoading('Planning your crash course...');
  showScreen('results');
  resetResults();
  $('results-title').textContent = `Crash Course: ${topic}`;
  $('results-mode-badge').textContent = 'Full Crash Course';

  const contentArea = $('results-content');

  // Step 1: Generate module plan
  const planSystem = `You are a curriculum designer. Given a topic, output ONLY a JSON array of module titles (strings) for a structured crash course.
Scale: 5 modules for simple topics, up to 12 for complex ones.
The modules should progress from foundational → mechanism → components → nuance → application → next steps.
Output ONLY valid JSON, nothing else. Example: ["What is X?", "How X works", "Key components of X", ...]`;

  let modules = [];
  try {
    const planText = await callClaude({
      system: planSystem,
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
      maxTokens: 500,
    });
    // Extract JSON array from response
    const jsonMatch = planText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      modules = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    hideLoading();
    contentArea.innerHTML = `<div class="content-block"><p style="color: red;">Error planning course: ${err.message}</p></div>`;
    return;
  }

  if (!modules.length) {
    hideLoading();
    contentArea.innerHTML = `<div class="content-block"><p style="color: red;">Could not generate a module plan. Please try again.</p></div>`;
    return;
  }

  // Build nav sidebar
  const nav = $('module-nav');
  const navList = $('module-nav-list');
  nav.classList.remove('hidden');
  $('module-filter').classList.remove('hidden');

  modules.forEach((title, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#module-${i + 1}`;
    a.textContent = title;
    a.dataset.module = i + 1;
    li.appendChild(a);
    navList.appendChild(li);
  });

  // Add table of contents block
  const tocBlock = document.createElement('div');
  tocBlock.className = 'content-block';
  tocBlock.innerHTML = `<h2>Table of Contents</h2><ol>${modules.map((t, i) =>
    `<li><a href="#module-${i + 1}" style="color: var(--primary); text-decoration: none;">${t}</a></li>`
  ).join('')}</ol>`;
  contentArea.appendChild(tocBlock);

  hideLoading();

  // Generate each module sequentially with streaming
  const moduleSystem = `You are a patient, knowledgeable teacher writing a module for a crash course on: "${topic}".

Write in warm, conversational language. Imagine explaining to a curious family member.
Never use condescending phrases. Define every technical term you use. Use analogies.

Format your response in clean Markdown with these sections:
## [Module title]

### Summary
[2 sentences]

### Key Concepts
- **Term:** definition
- **Term:** definition

### Explanation
[3-6 paragraphs, each 3-4 sentences]

### Example
[1 concrete, relatable real-world example, 2-4 sentences]

### Sources
- [Source name](URL) — [1 sentence on what this source covers]`;

  for (let i = 0; i < modules.length; i++) {
    const moduleTitle = modules[i];
    const moduleNum = i + 1;

    const block = document.createElement('div');
    block.className = 'content-block';
    block.id = `module-${moduleNum}`;
    block.innerHTML = `<div class="streaming-content"><p style="color: var(--text-3);">Writing module ${moduleNum}...</p></div>`;
    contentArea.appendChild(block);

    const streamEl = block.querySelector('.streaming-content');

    // Highlight current nav item
    document.querySelectorAll('.module-nav ol li a').forEach((a, idx) => {
      a.classList.toggle('active', idx === i);
    });

    const previousModules = modules.slice(0, i).join(', ');

    try {
      await callClaude({
        system: moduleSystem,
        messages: [{
          role: 'user',
          content: `Write Module ${moduleNum}: "${moduleTitle}"${previousModules ? `\n\nPrevious modules covered: ${previousModules}` : ''}. Do not repeat what was already covered.`
        }],
        onChunk: (chunk, full) => {
          streamEl.innerHTML = markdownToHtml(full);
        },
        maxTokens: 1200,
      });

      // Add action buttons after module renders
      const actions = document.createElement('div');
      actions.style.cssText = 'margin-top: 1.2rem; display: flex; gap: 0.5rem; flex-wrap: wrap;';

      const sourcesBtn = document.createElement('button');
      sourcesBtn.className = 'sources-toggle';
      sourcesBtn.textContent = '📎 Sources';
      sourcesBtn.addEventListener('click', () => {
        const sourcesList = block.querySelector('.sources-list');
        if (sourcesList) sourcesList.classList.toggle('visible');
      });

      const modifyBtn = document.createElement('button');
      modifyBtn.className = 'modify-module-btn';
      modifyBtn.textContent = '✏️ Modify this module';
      modifyBtn.addEventListener('click', () => {
        const form = block.querySelector('.modify-module-form');
        if (form) form.classList.toggle('visible');
      });

      actions.appendChild(sourcesBtn);
      actions.appendChild(modifyBtn);

      // Modify form
      const modifyForm = document.createElement('div');
      modifyForm.className = 'modify-module-form';
      modifyForm.innerHTML = `
        <textarea rows="3" placeholder="Add context, ask for more detail, or request a different angle..."></textarea>
        <div class="modify-module-form-actions">
          <button class="btn-primary small-update-btn">Update module</button>
          <button class="btn-secondary cancel-modify-btn">Cancel</button>
        </div>
      `;
      modifyForm.querySelector('.cancel-modify-btn').addEventListener('click', () => {
        modifyForm.classList.remove('visible');
      });
      modifyForm.querySelector('.small-update-btn').addEventListener('click', async () => {
        const additionalContext = modifyForm.querySelector('textarea').value.trim();
        if (!additionalContext) return;
        modifyForm.classList.remove('visible');
        streamEl.innerHTML = `<p style="color: var(--text-3);">Updating module...</p>`;

        try {
          const currentContent = streamEl.innerText.substring(0, 500);
          await callClaude({
            system: moduleSystem,
            messages: [{
              role: 'user',
              content: `Rewrite Module ${moduleNum}: "${moduleTitle}" with this additional context: ${additionalContext}\n\nKeep the same structure but incorporate the new information.`
            }],
            onChunk: (chunk, full) => {
              streamEl.innerHTML = markdownToHtml(full);
            },
            maxTokens: 1200,
          });
        } catch (err) {
          streamEl.innerHTML += `<p style="color: red;">Update failed: ${err.message}</p>`;
        }
      });

      block.appendChild(actions);
      block.appendChild(modifyForm);

    } catch (err) {
      streamEl.innerHTML = `<p style="color: red;">Error generating module ${moduleNum}: ${err.message}</p>`;
    }
  }

  // All done — deactivate nav highlights, scroll to top of content
  document.querySelectorAll('.module-nav ol li a').forEach(a => a.classList.remove('active'));

  // Module filter
  $('module-filter').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.module-nav ol li').forEach(li => {
      const text = li.textContent.toLowerCase();
      li.style.display = !query || text.includes(query) ? '' : 'none';
    });
  });

  // Intersection observer for active nav highlighting
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.module-nav ol li a').forEach(a => {
          a.classList.toggle('active', a.dataset.module === id.replace('module-', ''));
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  document.querySelectorAll('[id^="module-"]').forEach(el => observer.observe(el));
}

// ─── Export ───────────────────────────────────────────────────────────────────

$('export-btn').addEventListener('click', () => {
  const title = $('results-title').textContent;
  const content = $('results-content').innerHTML;
  const printWin = window.open('', '_blank');
  printWin.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.7; color: #1a1a1a; font-size: 1.1rem; }
      h2 { font-size: 1.6rem; margin-top: 2rem; border-bottom: 2px solid #eee; padding-bottom: 0.4rem; }
      h3 { font-size: 1.2rem; margin-top: 1.2rem; }
      ul, ol { padding-left: 1.5rem; }
      li { margin-bottom: 0.3rem; }
      a { color: #4a7c59; }
      .content-block { margin-bottom: 2rem; }
      .sources-toggle, .modify-module-btn, .modify-module-form, .btn-primary, .btn-secondary { display: none !important; }
      @media print { body { margin: 1cm; } }
    </style>
  </head><body>
    <h1>${title}</h1>
    ${content}
  </body></html>`);
  printWin.document.close();
  printWin.print();
});

// ─── Markdown to HTML (minimal, safe) ────────────────────────────────────────

function markdownToHtml(md) {
  // We process line by line for a simple safe renderer
  let html = '';
  const lines = md.split('\n');
  let inUl = false, inOl = false;

  function closeList() {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    if (line.startsWith('### ')) { closeList(); html += `<h3>${inline(line.slice(4))}</h3>`; continue; }
    if (line.startsWith('## ')) { closeList(); html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (line.startsWith('# ')) { closeList(); html += `<h2>${inline(line.slice(2))}</h2>`; continue; }

    // Unordered list
    if (/^[-*] /.test(line)) {
      if (!inUl) { closeList(); html += '<ul>'; inUl = true; }
      html += `<li>${inline(line.slice(2))}</li>`;
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      if (!inOl) { closeList(); html += '<ol>'; inOl = true; }
      html += `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`;
      continue;
    }

    closeList();

    // Blank line
    if (!line.trim()) { html += ''; continue; }

    // Paragraph
    html += `<p>${inline(line)}</p>`;
  }

  closeList();
  return html;
}

function inline(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

loadApiKey();
showScreen('home');

// Prompt for API key on first load if not set
if (!state.apiKey) {
  setTimeout(() => {
    $('settings-overlay').classList.remove('hidden');
  }, 500);
}
