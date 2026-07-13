package app.laleo.tentativa;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Registro de uma tentativa da criança em um exercício.
 * Guardamos apenas as notas — nunca o áudio (LGPD).
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
}
