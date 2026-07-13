package app.laleo.crianca;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/** Figurinha colecionável ganhada por uma criança (recompensa surpresa). */
@Entity
public class Figurinha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long criancaId;

    private String emoji;

    private String nome;

    private Instant ganhaEm;

    protected Figurinha() {
    }

    public Figurinha(Long criancaId, String emoji, String nome) {
        this.criancaId = criancaId;
        this.emoji = emoji;
        this.nome = nome;
        this.ganhaEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getCriancaId() {
        return criancaId;
    }

    public String getEmoji() {
        return emoji;
    }

    public String getNome() {
        return nome;
    }

    public Instant getGanhaEm() {
        return ganhaEm;
    }
}
