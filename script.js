/* =====================================================
   Studio HouseZ — script.js
   Menu, serviços, agendamento (40 em 40 min) e chatbot
   ===================================================== */

/* ===== CONFIGURAÇÃO ===== */
const WHATSAPP = '5511959631200';

const SERVICOS = [
  { nome: 'Corte', preco: 49.99 },
  { nome: 'Corte + Barba', preco: 94.99 },
  { nome: 'Barba Simples', preco: 40.00 },
  { nome: 'Barba Terapia', preco: 60.00 },
  { nome: 'Botox Capilar', preco: 60.00 },
  { nome: 'Esfoliação', preco: 20.00 },
  { nome: 'Esfoliação com Máscara', preco: 35.00 },
  { nome: 'Freestyle Simples', preco: 10.00 },
  { nome: 'Luzes', preco: 130.00 },
  { nome: 'Relaxamento / Progressiva', preco: 50.00 },
];

/* Horários: terça(2) a sábado(6), 10h–12h e 13h–20h, de 40 em 40 min */
const DIAS_FECHADOS = [0, 1]; // domingo e segunda
const BLOCOS = [
  { inicio: 10 * 60, fim: 12 * 60 },   // 10:00 até 12:00
  { inicio: 13 * 60, fim: 20 * 60 },   // 13:00 até 20:00
];
const INTERVALO = 40; // minutos

/* Horários ocupados (simulação).
   Para marcar um horário como ocupado de verdade, adicione aqui
   no formato 'AAAA-MM-DD|HH:MM'. Ex.: '2026-10-20|10:00' */
const OCUPADOS_FIXOS = [];

function formatarPreco(v) {
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

function dataParaChave(data) {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function minutosParaHora(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/* ===== MENU CELULAR ===== */
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

menuBtn.addEventListener('click', () => menu.classList.toggle('aberto'));
document.querySelectorAll('#menu a').forEach(link => {
  link.addEventListener('click', () => menu.classList.remove('aberto'));
});

/* ===== LISTA DE SERVIÇOS ===== */
const listaServicos = document.getElementById('lista-servicos');

SERVICOS.forEach((s, i) => {
  const card = document.createElement('div');
  card.className = 'card-servico';
  card.innerHTML = `
    <h3>${s.nome}</h3>
    <span class="preco">${formatarPreco(s.preco)}</span>
    <button class="btn btn-ouro" data-servico="${i}">Agendar</button>
  `;
  listaServicos.appendChild(card);
});

/* Botão "Agendar" do serviço: seleciona o serviço e rola até o agendamento */
listaServicos.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-servico]');
  if (!btn) return;
  selectServico.value = btn.dataset.servico;
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
});

/* ===== AGENDAMENTO ===== */
const selectServico = document.getElementById('agenda-servico');
const inputData = document.getElementById('agenda-data');
const aviso = document.getElementById('agenda-aviso');
const gradeHorarios = document.getElementById('grade-horarios');
const inputNome = document.getElementById('agenda-nome');
const btnConfirmar = document.getElementById('btn-confirmar');

let horarioEscolhido = null;

/* Preenche o select de serviços */
SERVICOS.forEach((s, i) => {
  const op = document.createElement('option');
  op.value = i;
  op.textContent = `${s.nome} — ${formatarPreco(s.preco)}`;
  selectServico.appendChild(op);
});

/* Data mínima: hoje */
const hoje = new Date();
inputData.min = dataParaChave(hoje);
inputData.value = dataParaChave(hoje);

/* Gera os horários livres de um dia.
   Retorna lista de strings 'HH:MM'. Ocupados e horários que já
   passaram (se o dia for hoje) nem aparecem. */
function horariosLivres(data) {
  if (DIAS_FECHADOS.includes(data.getDay())) return null; // dia fechado

  const chave = dataParaChave(data);
  const agora = new Date();
  const ehHoje = chave === dataParaChave(agora);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const livres = [];
  BLOCOS.forEach(bloco => {
    for (let t = bloco.inicio; t + INTERVALO <= bloco.fim; t += INTERVALO) {
      const hora = minutosParaHora(t);
      if (ehHoje && t <= minutosAgora) continue;              // já passou
      if (OCUPADOS_FIXOS.includes(`${chave}|${hora}`)) continue; // ocupado
      livres.push(hora);
    }
  });
  return livres;
}

function mostrarHorarios() {
  horarioEscolhido = null;
  gradeHorarios.innerHTML = '';
  aviso.textContent = '';

  if (!inputData.value) return;
  const data = new Date(inputData.value + 'T00:00:00');

  if (DIAS_FECHADOS.includes(data.getDay())) {
    aviso.textContent = 'Fechamos aos domingos e segundas. Escolha de terça a sábado.';
    return;
  }

  const livres = horariosLivres(data);

  if (!livres || livres.length === 0) {
    gradeHorarios.innerHTML = '<p class="sem-horarios">Sem horários livres neste dia. Tente outra data.</p>';
    return;
  }

  livres.forEach(hora => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.textContent = hora;
    b.addEventListener('click', () => {
      document.querySelectorAll('.slot.selecionado').forEach(x => x.classList.remove('selecionado'));
      b.classList.add('selecionado');
      horarioEscolhido = hora;
    });
    gradeHorarios.appendChild(b);
  });
}

inputData.addEventListener('change', mostrarHorarios);
mostrarHorarios();

/* Confirmar: abre o WhatsApp com a mensagem pronta */
btnConfirmar.addEventListener('click', () => {
  const servico = SERVICOS[selectServico.value];
  const nome = inputNome.value.trim();

  if (!inputData.value) { aviso.textContent = 'Escolha um dia.'; return; }
  if (!horarioEscolhido) { aviso.textContent = 'Escolha um horário disponível.'; return; }
  if (!nome) { aviso.textContent = 'Digite seu nome para confirmar.'; inputNome.focus(); return; }

  const dataBonita = inputData.value.split('-').reverse().join('/');
  const msg =
    `Olá, David! Quero agendar no Studio HouseZ:\n` +
    `• Serviço: ${servico.nome} (${formatarPreco(servico.preco)})\n` +
    `• Dia: ${dataBonita}\n` +
    `• Horário: ${horarioEscolhido}\n` +
    `• Nome: ${nome}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
});

/* ===== CHATBOT ===== */
const chatBtn = document.getElementById('chat-btn');
const chat = document.getElementById('chat');
const chatFechar = document.getElementById('chat-fechar');
const chatMsgs = document.getElementById('chat-msgs');
const chatOpcoes = document.getElementById('chat-opcoes');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function listaPrecosTexto() {
  return SERVICOS.map(s => `• ${s.nome}: ${formatarPreco(s.preco)}`).join('\n');
}

const respostas = {
  inicio: {
    texto: 'Olá! Bem-vindo ao Studio HouseZ 💈\nPosso te ajudar com:',
    opcoes: ['Ver preços', 'Agendar horário', 'Horário de atendimento', 'Formas de pagamento', 'Endereço', 'Falar com o David'],
  },
  precos: {
    texto: 'Nossos serviços:\n' + listaPrecosTexto(),
    opcoes: ['Agendar horário', 'Voltar ao início'],
  },
  agendar: {
    texto: 'Para agendar, use a seção "Agende seu horário" aqui no site: escolha o serviço, o dia e um horário livre (de 40 em 40 min). A confirmação vai direto pro WhatsApp do David.',
    opcoes: ['Ver preços', 'Voltar ao início'],
  },
  horarios: {
    texto: 'Atendemos de terça a sábado:\n• 10h às 12h\n• 13h às 20h\n\nFechamos aos domingos e segundas.',
    opcoes: ['Agendar horário', 'Voltar ao início'],
  },
  pagamento: {
    texto: 'Aceitamos:\n• Pix\n• Cartão de crédito\n• Cartão de débito\n• Dinheiro',
    opcoes: ['Ver preços', 'Voltar ao início'],
  },
  endereco: {
    texto: 'Estamos na Rua Pérola, 371. Te esperamos lá!',
    opcoes: ['Agendar horário', 'Voltar ao início'],
  },
  david: {
    texto: 'Vou te levar direto pro WhatsApp do David 👇',
    acao: () => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá, David! Vim pelo site do Studio HouseZ.')}`, '_blank'),
    opcoes: ['Voltar ao início'],
  },
  padrao: {
    texto: 'Não entendi muito bem 😅 Escolha uma das opções abaixo ou fale direto com o David no WhatsApp.',
    opcoes: ['Ver preços', 'Agendar horário', 'Falar com o David', 'Voltar ao início'],
  },
};

const mapaOpcoes = {
  'Ver preços': 'precos',
  'Agendar horário': 'agendar',
  'Horário de atendimento': 'horarios',
  'Formas de pagamento': 'pagamento',
  'Endereço': 'endereco',
  'Falar com o David': 'david',
  'Voltar ao início': 'inicio',
};

function addMsg(texto, quem) {
  const div = document.createElement('div');
  div.className = 'msg ' + quem;
  div.textContent = texto;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function mostrarOpcoes(opcoes) {
  chatOpcoes.innerHTML = '';
  opcoes.forEach(op => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = op;
    b.addEventListener('click', () => responder(mapaOpcoes[op], op));
    chatOpcoes.appendChild(b);
  });
}

function responder(chave, textoUsuario) {
  if (textoUsuario) addMsg(textoUsuario, 'user');
  const r = respostas[chave] || respostas.padrao;
  mostrarOpcoes([]);
  setTimeout(() => {
    addMsg(r.texto, 'bot');
    if (r.acao) r.acao();
    mostrarOpcoes(r.opcoes);
  }, 500);
}

let chatIniciado = false;
chatBtn.addEventListener('click', () => {
  chat.classList.add('aberto');
  chatBtn.style.display = 'none';
  if (!chatIniciado) {
    chatIniciado = true;
    addMsg(respostas.inicio.texto, 'bot');
    mostrarOpcoes(respostas.inicio.opcoes);
  }
});

chatFechar.addEventListener('click', () => {
  chat.classList.remove('aberto');
  chatBtn.style.display = 'block';
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = chatInput.value.trim();
  if (!texto) return;
  chatInput.value = '';
  addMsg(texto, 'user');
  mostrarOpcoes([]);
  setTimeout(() => {
    addMsg(respostas.padrao.texto, 'bot');
    mostrarOpcoes(respostas.padrao.opcoes);
  }, 500);
});
