// 1. Nosso banco de dados simulado (Nome do produto sempre em minúsculo)
const catalogo = {
    "cimento": 35.00,
    "tijolo": 1.20,
    "areia": 80.00,
    "argamassa": 22.50,
    "telha": 3.50
};

// 2. O carrinho de compras começa vazio
let carrinho = {};
let interacaoIniciada = false;

// 3. Ativando o Reconhecimento de Voz do Navegador (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'pt-BR';          // Configura para entender Português
recognition.continuous = false;      // Para de ouvir assim que o usuário faz uma pausa
recognition.interimResults = false;  // Só entrega o resultado quando a frase estiver finalizada

// 4. Capturando os elementos do HTML para atualizar a tela
const textoStatus = document.getElementById('status-texto');
const iconeStatus = document.getElementById('status-icone');
function falar(texto, funcaoDepoisDeFalar) {
    // Atualiza a tela para Azul (Falando)
    alterarStatus('falando', 'Site falando...');

    // Cria a mensagem de voz
    const mensagem = new SpeechSynthesisUtterance(texto);
    mensagem.lang = 'pt-BR'; // Garante o sotaque em português

    // O SEGREDO DA ACESSIBILIDADE: O evento 'onend' detecta quando o robô terminou de falar
    mensagem.onend = () => {
        if (funcaoDepoisDeFalar) {
            funcaoDepoisDeFalar(); // Só liga o microfone DEPOIS que o site se calar
        }
    };

    // Executa a voz de fato
    window.speechSynthesis.speak(mensagem);
}

// Função auxiliar para mudar a cor da bolinha e o texto na tela
function alterarStatus(classe, texto) {
    iconeStatus.className = classe; // Aplica .escutando, .falando ou .aguardando do CSS
    textoStatus.innerText = texto;
}
// Ativa o microfone e muda a bolinha para Verde (Pulsando)
function ouvirUsuario() {
    alterarStatus('escutando', 'Ouvindo comando...');
    recognition.start(); // Abre o microfone
}

// Quando o navegador transforma o áudio em texto com sucesso:
recognition.onresult = (event) => {
    // Pega o texto capturado, transforma em minúsculo e remove espaços extras
    const comando = event.results[0][0].transcript.toLowerCase().trim();
    
    alterarStatus('aguardando', `Processando: "${comando}"`);
    processarComando(comando); // Envia o texto para o processador
};

// Se o usuário não falar nada ou o microfone falhar:
recognition.onerror = () => {
    // O site avisa que não entendeu e chama a função 'ouvirUsuario' de novo
    falar("Não consegui ouvir. Por favor, repita o que deseja.", ouvirUsuario);
};
function processarComando(comando) {
    // Comando de Saída: Se falar "fechar", "finalizar" ou "pedido"
    if (comando.includes("fechar") || comando.includes("finalizar") || comando.includes("pedido")) {
        finalizarOrcamento();
        return;
    }

    // Busca se alguma palavra do catálogo está na frase dita pelo usuário
    let produtoEncontrado = null;
    for (let produto in catalogo) {
        if (comando.includes(produto)) {
            produtoEncontrado = produto;
            break;
        }
    }

    if (produtoEncontrado) {
        // EXPRESSÃO REGULAR: Procura números na frase (Ex: "quero 10 cimentos" extrai o 10)
        const numeros = comando.match(/\d+/);
        const quantidade = numeros ? parseInt(numeros[0]) : 1; // Se não disser número, assume 1

        // Adiciona ou incrementa no carrinho
        if (!carrinho[produtoEncontrado]) {
            carrinho[produtoEncontrado] = 0;
        }
        carrinho[produtoEncontrado] += quantidade;

        atualizarInterfaceVisual();

        // LOOP DE CONVERSA: O site confirma o item e volta a ouvir o usuário imediatamente
        falar(`Adicionado ${quantidade} de ${produtoEncontrado}. O que mais deseja adicionar?`, ouvirUsuario);
    } else {
        // Se o usuário falar algo fora do catálogo (Ex: "quero uma melancia")
        falar("Produto não encontrado. Temos cimento, tijolo, areia, argamassa e telha. O que deseja?", ouvirUsuario);
    }
}
function atualizarInterfaceVisual() {
    const listaHtml = document.getElementById('lista-itens');
    const totalHtml = document.getElementById('total');
    listaHtml.innerHTML = ''; // Limpa a lista antiga
    let total = 0;

    for (let produto in carrinho) {
        const qtd = carrinho[produto];
        const subtotal = qtd * catalogo[produto];
        total += subtotal;

        const li = document.createElement('li');
        li.innerText = `${qtd}x ${produto} - R$ ${subtotal.toFixed(2)}`;
        listaHtml.appendChild(li);
    }
    totalHtml.innerText = `Total: R$ ${total.toFixed(2)}`;
}

function finalizarOrcamento() {
    let total = 0;
    for (let produto in carrinho) {
        total += carrinho[produto] * catalogo[produto];
    }
    
    if (total === 0) {
        falar("Seu carrinho está vazio. O orçamento foi cancelado. Até logo!");
    } else {
        // O site dita o valor total para o usuário cego ouvir o desfecho
        falar(`Orçamento finalizado com sucesso. O valor total é de ${total} reais. Obrigado por escolher nossa loja!`);
    }
    
    // Reseta o sistema para uma próxima utilização
    interacaoIniciada = false;
    alterarStatus('aguardando', 'Atendimento finalizado.');
}

// INÍCIO DE TUDO: O navegador exige que o usuário clique na tela antes de ativar som/microfone
document.body.addEventListener('click', () => {
    if (!interacaoIniciada) {
        interacaoIniciada = true;
        falar("Bem-vindo ao orçamento por voz da Loja de Construção. Diga o nome do produto e a quantidade, ou diga fechar pedido para encerrar. O que deseja adicionar?", ouvirUsuario);
    }
});
