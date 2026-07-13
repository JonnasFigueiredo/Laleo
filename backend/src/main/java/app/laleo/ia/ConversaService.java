package app.laleo.ia;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

/**
 * Orquestra a conversa livre com o amiguinho, aplicando os guardrails
 * infantis independentemente do provedor de IA usado:
 * - persona e regras rígidas no prompt de sistema
 * - histórico curto (a conversa não acumula contexto sem limite)
 * - saída sanitizada (tamanho, links) antes de chegar à criança
 * - fallback para o provedor demo se o provedor real falhar
 */
@Service
public class ConversaService {

    private static final Logger log = LoggerFactory.getLogger(ConversaService.class);

    private static final int MAX_TURNOS_HISTORICO = 8;
    private static final int MAX_TAMANHO_RESPOSTA = 280;
    private static final Duration VALIDADE_CONVERSA = Duration.ofMinutes(30);

    private record Conversa(Deque<MensagemIA> mensagens, Instant criadaEm) {
    }

    private final ProvedorIA provedor;
    private final ProvedorDemo reserva;
    private final Map<String, Conversa> conversas = new ConcurrentHashMap<>();

    public ConversaService(ObjectProvider<ProvedorIA> provedor, ProvedorDemo reserva) {
        // Com chave configurada o @Primary é o Claude; sem chave, sobra o demo
        this.provedor = provedor.getIfAvailable(() -> reserva);
        this.reserva = reserva;
    }

    public String conversar(String conversaId, String nomeAmigo, String falaDaCrianca) {
        limparConversasAntigas();
        Conversa conversa = conversas.computeIfAbsent(conversaId,
                id -> new Conversa(new ArrayDeque<>(), Instant.now()));

        synchronized (conversa) {
            conversa.mensagens().addLast(new MensagemIA(MensagemIA.Papel.CRIANCA, falaDaCrianca));
            while (conversa.mensagens().size() > MAX_TURNOS_HISTORICO) {
                conversa.mensagens().removeFirst();
            }
            // O histórico enviado deve começar com a criança (regra das APIs de chat)
            while (!conversa.mensagens().isEmpty()
                    && conversa.mensagens().peekFirst().papel() != MensagemIA.Papel.CRIANCA) {
                conversa.mensagens().removeFirst();
            }

            String resposta;
            try {
                resposta = provedor.responder(promptSistema(nomeAmigo), List.copyOf(conversa.mensagens()));
            } catch (Exception e) {
                log.warn("Provedor de IA falhou ({}); usando respostas demo", e.getMessage());
                resposta = reserva.responder(promptSistema(nomeAmigo), List.copyOf(conversa.mensagens()));
            }

            resposta = sanitizar(resposta);
            conversa.mensagens().addLast(new MensagemIA(MensagemIA.Papel.AMIGO, resposta));
            return resposta;
        }
    }

    /** Persona + regras de segurança infantil. Vale para QUALQUER provedor. */
    static String promptSistema(String nomeAmigo) {
        return """
                Você é %s, um amiguinho virtual dentro do Laleo, um aplicativo brasileiro que ajuda \
                crianças pequenas (3 a 10 anos) a treinar a fala. Você conversa por voz: o que você \
                escrever será falado em voz alta para a criança. A fala da criança foi transcrita \
                automaticamente e pode conter pequenos erros — interprete com generosidade.

                REGRAS OBRIGATÓRIAS:
                - Responda SEMPRE em português brasileiro, com no máximo 2 frases curtas.
                - Use vocabulário simples de criança pequena. Seja alegre, gentil e encorajador.
                - Você é um personagem de faz de conta. Se perguntarem, diga que é um amiguinho \
                de brinquedo que vive no aplicativo.
                - NUNCA peça nem repita dados pessoais (nome completo, endereço, escola, telefone, \
                senhas). Se a criança contar, mude de assunto com carinho, sem repetir o dado.
                - NUNCA fale de temas assustadores, violentos, adultos, dinheiro ou marcas.
                - Se a criança contar algo preocupante (dor, medo, alguém que faz mal, um "segredo \
                ruim"), responda com carinho e diga para ela contar AGORA para um adulto de \
                confiança, como o papai, a mamãe ou a professora.
                - Sempre que fizer sentido, puxe a conversa para sons e palavras divertidas de \
                repetir, que é a sua brincadeira favorita.
                - Termine suas falas com uma pergunta simples para a criança continuar conversando.
                """.formatted(nomeAmigo);
    }

    /** Última barreira antes da voz: limita tamanho e remove links/contatos. */
    static String sanitizar(String resposta) {
        if (resposta == null || resposta.isBlank()) {
            return "Deu um branco aqui! Me conta de novo?";
        }
        String limpa = resposta
                .replaceAll("https?://\\S+", "")
                .replaceAll("www\\.\\S+", "")
                .replaceAll("\\S+@\\S+", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (limpa.length() > MAX_TAMANHO_RESPOSTA) {
            int corte = limpa.lastIndexOf('.', MAX_TAMANHO_RESPOSTA);
            limpa = corte > 40 ? limpa.substring(0, corte + 1) : limpa.substring(0, MAX_TAMANHO_RESPOSTA);
        }
        return limpa.isBlank() ? "Deu um branco aqui! Me conta de novo?" : limpa;
    }

    private void limparConversasAntigas() {
        Instant limite = Instant.now().minus(VALIDADE_CONVERSA);
        conversas.entrySet().removeIf(e -> e.getValue().criadaEm().isBefore(limite));
    }
}
