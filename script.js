const WEBHOOK_URL = "https://zayed333.app.n8n.cloud/webhook/b944a9d3-8af2-4189-91ef-60d5e93f17b5";

const log = document.getElementById('log');
const micBtn = document.getElementById('mic');
const muteBtn = document.getElementById('mute');
const voiceStatus = document.getElementById('voice-status');
const coreStage = document.getElementById('core-stage');
const bars = Array.from(document.querySelectorAll('#bars .bar'));

let muted = false;

function setCoreState(state){
  coreStage.classList.remove('speaking','thinking','listening');
  if(state === 'speaking'){ coreStage.classList.add('speaking'); }
  else if(state === 'thinking'){ coreStage.classList.add('thinking'); }
  else if(state === 'listening'){ coreStage.classList.add('listening'); }
  else { resetBars(); }
}

function resetBars(){
  bars.forEach(b => { b.setAttribute('height', 6); b.setAttribute('y', -3); });
}

let barAnimFrame;
function animateBarsWhileSpeaking(){
  bars.forEach(b => {
    const h = 4 + Math.random()*22;
    b.setAttribute('height', h);
    b.setAttribute('y', -h/2);
  });
  barAnimFrame = requestAnimationFrame(() => {
    setTimeout(animateBarsWhileSpeaking, 70);
  });
}
function stopBarAnim(){
  cancelAnimationFrame(barAnimFrame);
  resetBars();
}

function appendLine(role, text){
  const wrap = document.querySelector('.placeholder');
  if(wrap) wrap.remove();
  const div = document.createElement('div');
  div.className = 'line ' + role;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = role === 'you' ? 'YOU' : role === 'bot' ? 'OPS//GPT' : 'SYS';
  div.appendChild(tag);
  div.appendChild(document.createTextNode(text));
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function speak(text){
  if(muted || !('speechSynthesis' in window)){
    setCoreState('idle');
    voiceStatus.textContent = 'TAP TO SPEAK';
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 0.95;
  utter.onstart = () => { setCoreState('speaking'); animateBarsWhileSpeaking(); voiceStatus.textContent = 'SPEAKING'; };
  utter.onend = () => { stopBarAnim(); setCoreState('idle'); voiceStatus.textContent = 'TAP TO SPEAK'; };
  utter.onerror = () => { stopBarAnim(); setCoreState('idle'); voiceStatus.textContent = 'TAP TO SPEAK'; };
  window.speechSynthesis.speak(utter);
}

muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.classList.toggle('active', !muted);
  muteBtn.textContent = muted ? '🔇' : '🔊';
  if(muted) window.speechSynthesis.cancel();
});
muteBtn.classList.add('active');

function stripMarkdown(text){
  return text
    .replace(/^#{1,6}\s*/gm, '')          // headers ### Title
    .replace(/\*\*(.*?)\*\*/g, '$1')      // **bold**
    .replace(/\*(.*?)\*/g, '$1')          // *italic*
    .replace(/^\s*[-*+]\s+/gm, '')        // bullet list markers
    .replace(/^\s*\d+\.\s+/gm, '')        // numbered list markers
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')// inline/code blocks
    .replace(/\n{2,}/g, '. ')             // paragraph breaks -> pause
    .replace(/\n/g, ' ')                  // remaining newlines -> space
    .replace(/\s{2,}/g, ' ')              // collapse extra spaces
    .trim();
}

function extractReplyText(data){
  if(typeof data === 'string') return data;
  if(!data) return null;
  if(typeof data.output === 'string') return data.output;
  if(typeof data.reply === 'string') return data.reply;
  if(typeof data.text === 'string') return data.text;
  if(typeof data.message === 'string') return data.message;
  if(typeof data.answer === 'string') return data.answer;
  if(Array.isArray(data) && data.length){
    return extractReplyText(data[0]);
  }
  return null;
}

async function askOps(question){
  appendLine('you', question);
  setCoreState('thinking');
  voiceStatus.textContent = 'THINKING';
  micBtn.disabled = true;

  try{
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, question: question, chatInput: question })
    });

    if(!res.ok){
      throw new Error('Webhook responded with status ' + res.status);
    }

    let data;
    const ct = res.headers.get('content-type') || '';
    if(ct.includes('application/json')){
      data = await res.json();
    } else {
      data = await res.text();
    }

    const rawReply = extractReplyText(data) || (typeof data === 'string' ? data : JSON.stringify(data));
    const replyText = stripMarkdown(rawReply);

    appendLine('bot', replyText);
    speak(replyText);

  } catch(err){
    appendLine('sys', 'Connection failed — ' + err.message);
    setCoreState('idle');
    voiceStatus.textContent = 'TAP TO SPEAK';
  } finally {
    micBtn.disabled = false;
  }
}

// --- Voice input (Web Speech API) ---
const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if(SpeechRecognitionCtor){
  recognition = new SpeechRecognitionCtor();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    setCoreState('listening');
    voiceStatus.textContent = 'LISTENING...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if(transcript) askOps(transcript);
  };

  recognition.onerror = (event) => {
    appendLine('sys', 'Voice input error — ' + event.error);
    setCoreState('idle');
    voiceStatus.textContent = 'TAP TO SPEAK';
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    if(!coreStage.classList.contains('thinking') && !coreStage.classList.contains('speaking')){
      setCoreState('idle');
      voiceStatus.textContent = 'TAP TO SPEAK';
    }
  };

  micBtn.addEventListener('click', () => {
    if(isListening){
      recognition.stop();
      return;
    }
    window.speechSynthesis.cancel();
    try{ recognition.start(); } catch(e){ /* already started */ }
  });
} else {
  micBtn.disabled = true;
  voiceStatus.textContent = 'VOICE UNSUPPORTED';
  appendLine('sys', 'This browser does not support voice input. Try Chrome or Edge.');
}

setCoreState('idle');
