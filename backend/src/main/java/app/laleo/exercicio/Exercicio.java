package app.laleo.exercicio;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Um exercício de fala. O tipo define a interação (ver docs/metodologia.md):
 * ouça-e-repita usa só palavra/dica; os tipos de escolha (pares mínimos, rima)
 * usam opcoes + respostaCorreta; escuta usa opcoes como sequência de palavras.
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

    @Enumerated(EnumType.STRING)
    private TipoExercicio tipo;

    /**
     * Para PARES_MINIMOS/RIMA: cartões "palavra|emoji" separados por ';'
     * (ex.: "rato|🐀;pato|🦆"). Para ESCUTA: palavras da sequência separadas por ';'.
     */
    private String opcoes;

    /** Palavra correta nos tipos de escolha; null nos demais. */
    private String respostaCorreta;

    protected Exercicio() {
    }

    public Exercicio(String palavra, String fonemaAlvo, int dificuldade, String dica) {
        this(palavra, fonemaAlvo, dificuldade, dica, TipoExercicio.OUCA_E_REPITA, null, null);
    }

    public Exercicio(String palavra, String fonemaAlvo, int dificuldade, String dica,
            TipoExercicio tipo, String opcoes, String respostaCorreta) {
        this.palavra = palavra;
        this.fonemaAlvo = fonemaAlvo;
        this.dificuldade = dificuldade;
        this.dica = dica;
        this.tipo = tipo;
        this.opcoes = opcoes;
        this.respostaCorreta = respostaCorreta;
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

    public TipoExercicio getTipo() {
        return tipo;
    }

    public String getOpcoes() {
        return opcoes;
    }

    public String getRespostaCorreta() {
        return respostaCorreta;
    }
}
