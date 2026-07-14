package app.laleo.tentativa;

/**
 * Classificação clínica do erro, atribuída pelo fonoaudiólogo ao revisar o
 * áudio (Passo 2 do roadmap). São as categorias de processo fonológico que
 * orientam a terapia — a máquina não as infere sozinha, justamente por não
 * ser confiável fazê-lo a partir da transcrição (ver {@link ResultadoAuto}).
 */
public enum TipoErroFono {
    /** Produção adequada ao alvo. */
    CORRETO,
    /** O som-alvo foi apagado (ex.: "ato" para "rato"). */
    OMISSAO,
    /** O som-alvo foi trocado por outro (ex.: "tato" para "rato"). */
    SUBSTITUICAO,
    /** O som saiu, mas distorcido (ex.: R gutural, sigmatismo). */
    DISTORCAO,
    /** Houve acréscimo de som (ex.: "aritmo" para "ritmo"). */
    ADICAO
}
