package app.laleo.exercicio;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Um exercício de "ouça e repita": o avatar fala a palavra e a criança repete.
 * O fonema alvo é o som em treino (ex.: "R", "S", "CH", "LH").
 */
@Entity
public class Exercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String palavra;

    private String fonemaAlvo;

    /** 1 = fácil (palavra curta) ... 3 = difícil (frase) */
    private int dificuldade;

    /** Dica lúdica que o avatar fala antes do exercício. */
    private String dica;

    protected Exercicio() {
    }

    public Exercicio(String palavra, String fonemaAlvo, int dificuldade, String dica) {
        this.palavra = palavra;
        this.fonemaAlvo = fonemaAlvo;
        this.dificuldade = dificuldade;
        this.dica = dica;
    }

    public Long getId() {
        return id;
    }

    public String getPalavra() {
        return palavra;
    }

    public String getFonemaAlvo() {
        return fonemaAlvo;
    }

    public int getDificuldade() {
        return dificuldade;
    }

    public String getDica() {
        return dica;
    }
}
