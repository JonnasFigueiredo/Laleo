package app.laleo.fala;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Mock determinístico usado enquanto o speech-service real não existe.
 * A nota deriva do tamanho do áudio: gravações muito curtas (criança não
 * falou) pontuam baixo; o restante pontua entre 70 e 100, sempre positivo.
 */
@Service
@Profile("!prod")
public class FalaServiceMock implements FalaService {

    private static final int AUDIO_MINIMO_BYTES = 4_000;

    @Override
    public AnaliseFala analisar(byte[] audio, String palavraAlvo, String fonemaAlvo) {
        int notaGeral = calcularNota(audio);
        List<NotaFonema> fonemas = new ArrayList<>();
        for (String fonema : fonemasDa(palavraAlvo, fonemaAlvo)) {
            boolean alvo = fonema.equalsIgnoreCase(fonemaAlvo);
            // O fonema em treino recebe a nota mais baixa: é ele que a criança está aprendendo
            int nota = alvo ? notaGeral : Math.min(100, notaGeral + 10);
            fonemas.add(new NotaFonema(fonema, nota));
        }
        return new AnaliseFala(palavraAlvo, palavraAlvo.toLowerCase(), notaGeral, fonemas);
    }

    private int calcularNota(byte[] audio) {
        if (audio == null || audio.length < AUDIO_MINIMO_BYTES) {
            return 30;
        }
        // Determinístico para testes: varia com o conteúdo, nunca abaixo de 70
        int hash = Math.abs(Arrays.hashCode(audio));
        return 70 + hash % 31;
    }

    private List<String> fonemasDa(String palavra, String fonemaAlvo) {
        List<String> fonemas = new ArrayList<>();
        fonemas.add(fonemaAlvo.toUpperCase());
        String primeira = palavra.substring(0, 1).toUpperCase();
        if (!primeira.equalsIgnoreCase(fonemaAlvo)) {
            fonemas.add(primeira);
        }
        String vogais = palavra.toLowerCase().replaceAll("[^aeiou]", "");
        if (!vogais.isEmpty()) {
            fonemas.add(vogais.substring(0, 1).toUpperCase());
        }
        return fonemas;
    }
}
