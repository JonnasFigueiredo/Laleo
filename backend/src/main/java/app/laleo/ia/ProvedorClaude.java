package app.laleo.ia;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

/**
 * Conversa via API da Anthropic (SDK oficial). Ativado quando a chave está
 * configurada (env LALEO_IA_CHAVE). A chave nunca sai do backend.
 */
@Service
@Primary
@ConditionalOnProperty("laleo.ia.chave")
public class ProvedorClaude implements ProvedorIA {

    private final AnthropicClient cliente;
    private final String modelo;

    public ProvedorClaude(@Value("${laleo.ia.chave}") String chave,
            @Value("${laleo.ia.modelo:claude-opus-4-8}") String modelo) {
        this.cliente = AnthropicOkHttpClient.builder().apiKey(chave).build();
        this.modelo = modelo;
    }

    @Override
    public String responder(String sistema, List<MensagemIA> historico) {
        MessageCreateParams.Builder params = MessageCreateParams.builder()
                .model(modelo)
                .maxTokens(300L)
                .system(sistema);

        for (MensagemIA mensagem : historico) {
            if (mensagem.papel() == MensagemIA.Papel.CRIANCA) {
                params.addUserMessage(mensagem.texto());
            } else {
                params.addAssistantMessage(mensagem.texto());
            }
        }

        Message resposta = cliente.messages().create(params.build());

        boolean recusou = resposta.stopReason()
                .map(r -> r.toString().toLowerCase().contains("refusal"))
                .orElse(false);
        if (recusou) {
            return "Hmm, sobre isso eu não sei conversar. Vamos falar de outra coisa divertida?";
        }

        return resposta.content().stream()
                .flatMap(bloco -> bloco.text().stream())
                .map(texto -> texto.text())
                .collect(Collectors.joining(" "))
                .trim();
    }
}
