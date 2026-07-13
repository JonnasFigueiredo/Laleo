package app.laleo.ia;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

/**
 * Respostas locais usadas quando não há chave de IA configurada (ou quando
 * o provedor real falha). Mantém o app funcional e seguro em qualquer
 * situação — as respostas são fixas e infantis.
 */
@Service
public class ProvedorDemo implements ProvedorIA {

    private static final String[] GENERICAS = {
            "Que legal! Me conta mais!",
            "Adorei conversar com você! O que mais você gosta de fazer?",
            "Uau! E você sabe que eu adoro treinar sons? Vamos brincar de repetir palavras?",
            "Você fala muito bem! Vamos treinar mais uma palavrinha juntos?",
    };

    @Override
    public String responder(String sistema, List<MensagemIA> historico) {
        String ultimaFala = historico.isEmpty() ? ""
                : historico.get(historico.size() - 1).texto().toLowerCase(Locale.ROOT);

        if (ultimaFala.contains("oi") || ultimaFala.contains("olá") || ultimaFala.contains("ola")) {
            return "Oi! Que alegria falar com você! Como foi seu dia?";
        }
        if (ultimaFala.contains("tchau") || ultimaFala.contains("adeus")) {
            return "Tchau, tchau! Volte logo para a gente brincar de novo!";
        }
        if (ultimaFala.contains("nome")) {
            return "Eu sou seu amiguinho do Laleo! Adoro brincar com palavras e sons!";
        }
        if (ultimaFala.contains("brinca") || ultimaFala.contains("jogo") || ultimaFala.contains("jogar")) {
            return "Eu adoro brincar! Minha brincadeira favorita é repetir palavras engraçadas. Quer tentar?";
        }

        // Determinístico para testes: varia com o tamanho da fala
        return GENERICAS[Math.abs(ultimaFala.length()) % GENERICAS.length];
    }
}
