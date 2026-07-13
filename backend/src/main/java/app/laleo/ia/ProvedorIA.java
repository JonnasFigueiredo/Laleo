package app.laleo.ia;

import java.util.List;

/**
 * Abstração do modelo de linguagem. Implementações: ProvedorClaude (padrão
 * quando há chave) e ProvedorDemo (sem chave). Para plugar outro provedor
 * (Gemini, modelo local...), basta implementar esta interface e registrá-la
 * como bean.
 */
public interface ProvedorIA {

    /**
     * @param sistema   prompt de sistema com a persona e as regras infantis
     * @param historico diálogo até aqui, terminando na fala da criança
     * @return resposta do amiguinho
     */
    String responder(String sistema, List<MensagemIA> historico);
}
