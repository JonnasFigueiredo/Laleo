package app.laleo.fala;

import java.util.List;

/**
 * Resultado da análise de uma gravação contra a palavra alvo.
 * Contrato espelhado do speech-service (ver speech-service/CONTRATO.md).
 */
public record AnaliseFala(
        String palavraAlvo,
        String transcricao,
        int notaGeral,
        List<NotaFonema> fonemas) {
}
