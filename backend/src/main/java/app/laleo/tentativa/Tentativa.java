package app.laleo.tentativa;

import java.time.Instant;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Registro de uma tentativa da criança em um exercício. Guarda as notas e os
 * dados que o fonoaudiólogo precisa para analisar (transcrição do ASR, posição
 * do fonema, veredito automático), mas nunca o áudio no fluxo padrão (LGPD).
 * A retenção de áudio para revisão é separada e consentida (ver roadmap).
 *
 * Campos de enriquecimento são anuláveis: tentativas antigas seguem válidas.
 */
@Entity
public class Tentativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long exercicioId;

    /** Perfil da criança; null em tentativas antigas ou sem perfil. */
    private Long criancaId;

    private String fonemaAlvo;

    private int notaGeral;

    private Instant criadaEm;

    // ── Enriquecimento clínico (Passo 1 do roadmap) ─────────────────────

    /** Tipo do exercício (OUCA_E_REPITA, PARES_MINIMOS, RIMA, ESCUTA). */
    private String tipoExercicio;

    /** PRODUCAO (gravou a fala) ou ESCOLHA (tarefa de percepção). */
    private String origem;

    /** Palavra-alvo trabalhada. */
    private String palavraAlvo;

    /** Posição do fonema-alvo na palavra: INICIAL, MEDIAL ou FINAL. */
    private String posicaoAlvo;

    /** O que o ASR ouviu (só em produções); evidência bruta para o fono. */
    private String transcricao;

    /** Nota do fonema-alvo (0–100), separada da nota geral da palavra. */
    private Integer notaFonema;

    /** Veredito automático do ASR — grosseiro por natureza. */
    @Enumerated(EnumType.STRING)
    private ResultadoAuto resultadoAuto;

    /** Tipificação clínica do erro; preenchida pelo fono na revisão. */
    @Enumerated(EnumType.STRING)
    private TipoErroFono tipoErroFono;

    /** Agrupa tentativas de uma mesma sessão de brincadeira. */
    private String sessaoId;

    /** Há gravação guardada localmente para esta tentativa (só com consentimento). */
    @ColumnDefault("false")
    private boolean temAudio;

    protected Tentativa() {
    }

    public Tentativa(Long exercicioId, Long criancaId, String fonemaAlvo, int notaGeral) {
        this.exercicioId = exercicioId;
        this.criancaId = criancaId;
        this.fonemaAlvo = fonemaAlvo;
        this.notaGeral = notaGeral;
        this.criadaEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getExercicioId() {
        return exercicioId;
    }

    public Long getCriancaId() {
        return criancaId;
    }

    public String getFonemaAlvo() {
        return fonemaAlvo;
    }

    public int getNotaGeral() {
        return notaGeral;
    }

    public Instant getCriadaEm() {
        return criadaEm;
    }

    public String getTipoExercicio() {
        return tipoExercicio;
    }

    public void setTipoExercicio(String tipoExercicio) {
        this.tipoExercicio = tipoExercicio;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public String getPalavraAlvo() {
        return palavraAlvo;
    }

    public void setPalavraAlvo(String palavraAlvo) {
        this.palavraAlvo = palavraAlvo;
    }

    public String getPosicaoAlvo() {
        return posicaoAlvo;
    }

    public void setPosicaoAlvo(String posicaoAlvo) {
        this.posicaoAlvo = posicaoAlvo;
    }

    public String getTranscricao() {
        return transcricao;
    }

    public void setTranscricao(String transcricao) {
        this.transcricao = transcricao;
    }

    public Integer getNotaFonema() {
        return notaFonema;
    }

    public void setNotaFonema(Integer notaFonema) {
        this.notaFonema = notaFonema;
    }

    public ResultadoAuto getResultadoAuto() {
        return resultadoAuto;
    }

    public void setResultadoAuto(ResultadoAuto resultadoAuto) {
        this.resultadoAuto = resultadoAuto;
    }

    public TipoErroFono getTipoErroFono() {
        return tipoErroFono;
    }

    public void setTipoErroFono(TipoErroFono tipoErroFono) {
        this.tipoErroFono = tipoErroFono;
    }

    public String getSessaoId() {
        return sessaoId;
    }

    public void setSessaoId(String sessaoId) {
        this.sessaoId = sessaoId;
    }

    public boolean isTemAudio() {
        return temAudio;
    }

    public void setTemAudio(boolean temAudio) {
        this.temAudio = temAudio;
    }
}
