package app.laleo.meta;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Meta terapêutica definida pelo fonoaudiólogo: um fonema-alvo em treino para
 * uma criança. O app usa as metas para priorizar os exercícios daquele som,
 * fechando o ciclo "o fono define o alvo, a criança pratica em casa".
 */
@Entity
public class Meta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long criancaId;

    private String fonema;

    private Instant criadaEm;

    protected Meta() {
    }

    public Meta(Long criancaId, String fonema) {
        this.criancaId = criancaId;
        this.fonema = fonema;
        this.criadaEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getCriancaId() {
        return criancaId;
    }

    public String getFonema() {
        return fonema;
    }

    public Instant getCriadaEm() {
        return criadaEm;
    }
}
