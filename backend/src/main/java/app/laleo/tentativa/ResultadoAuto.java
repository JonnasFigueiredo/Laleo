package app.laleo.tentativa;

/**
 * Veredito automático (do ASR) sobre a produção da criança. É deliberadamente
 * grosseiro: distinguir omissão de substituição ou distorção a partir da
 * transcrição ortográfica não é confiável (ver docs/roadmap-clinico.md, Frente 3).
 * A classificação fina — o processo fonológico — cabe ao fonoaudiólogo na
 * revisão ({@link TipoErroFono}).
 */
public enum ResultadoAuto {
    /** A transcrição bate com a palavra-alvo (o som-alvo veio como esperado). */
    CORRETO,
    /** A produção saiu diferente do alvo — precisa de olhar humano para tipificar. */
    ALTERADO,
    /** Sem transcrição utilizável (silêncio, ruído, ASR sem confiança). */
    INDETERMINADO
}
