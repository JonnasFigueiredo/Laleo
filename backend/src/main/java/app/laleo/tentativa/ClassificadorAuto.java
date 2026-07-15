package app.laleo.tentativa;

import java.text.Normalizer;

/**
 * Classificação automática (heurística, de baixa confiança) da produção da
 * criança a partir da transcrição do ASR. Só emite CORRETO / ALTERADO /
 * INDETERMINADO — de propósito, porque a transcrição ortográfica não permite
 * separar de forma confiável omissão, substituição e distorção. A tipificação
 * fina fica com o fonoaudiólogo ({@link TipoErroFono}).
 */
public final class ClassificadorAuto {

    /** Acima disso, com o grafema-alvo presente, tratamos como acerto. */
    private static final double LIMIAR_ACERTO = 0.8;

    private ClassificadorAuto() {
    }

    public static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }
        // Mesma normalização do speech-service (pontuacao.mjs): preserva espaços
        // simples, para os dois lados calcularem a MESMA similaridade em alvos
        // com mais de uma palavra — divergir aqui gera nota e veredito em conflito
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase()
                .replaceAll("[^a-z0-9 ]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /** INICIAL / MEDIAL / FINAL, ou null se o grafema-alvo não aparece na palavra. */
    public static String posicao(String palavraAlvo, String fonemaAlvo) {
        String palavra = normalizar(palavraAlvo);
        String grafema = normalizar(fonemaAlvo);
        if (palavra.isEmpty() || grafema.isEmpty()) {
            return null;
        }
        int i = palavra.indexOf(grafema);
        if (i < 0) {
            return null;
        }
        if (i == 0) {
            return "INICIAL";
        }
        if (i + grafema.length() >= palavra.length()) {
            return "FINAL";
        }
        return "MEDIAL";
    }

    public static ResultadoAuto classificar(String palavraAlvo, String fonemaAlvo, String transcricao) {
        String alvo = normalizar(palavraAlvo);
        String dito = normalizar(transcricao);
        String grafema = normalizar(fonemaAlvo);
        if (dito.isEmpty()) {
            return ResultadoAuto.INDETERMINADO;
        }
        if (dito.equals(alvo)) {
            return ResultadoAuto.CORRETO;
        }
        boolean grafemaPresente = !grafema.isEmpty() && dito.contains(grafema);
        if (similaridade(alvo, dito) >= LIMIAR_ACERTO && grafemaPresente) {
            return ResultadoAuto.CORRETO;
        }
        return ResultadoAuto.ALTERADO;
    }

    static double similaridade(String a, String b) {
        if (a.isEmpty() && b.isEmpty()) {
            return 1.0;
        }
        int distancia = levenshtein(a, b);
        return 1.0 - (double) distancia / Math.max(a.length(), b.length());
    }

    private static int levenshtein(String a, String b) {
        int m = a.length();
        int n = b.length();
        int[] linha = new int[n + 1];
        for (int j = 0; j <= n; j++) {
            linha[j] = j;
        }
        for (int i = 1; i <= m; i++) {
            int diagonal = linha[0];
            linha[0] = i;
            for (int j = 1; j <= n; j++) {
                int anterior = linha[j];
                int custo = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                linha[j] = Math.min(Math.min(linha[j] + 1, linha[j - 1] + 1), diagonal + custo);
                diagonal = anterior;
            }
        }
        return linha[n];
    }
}
