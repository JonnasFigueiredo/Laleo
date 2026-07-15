package app.laleo.tentativa;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ClassificadorAutoTest {

    @Test
    void posicaoDoFonemaNaPalavra() {
        assertThat(ClassificadorAuto.posicao("Rato", "R")).isEqualTo("INICIAL");
        assertThat(ClassificadorAuto.posicao("Amor", "R")).isEqualTo("FINAL");
        assertThat(ClassificadorAuto.posicao("Cachorro", "CH")).isEqualTo("MEDIAL");
        // acentos e caixa não atrapalham
        assertThat(ClassificadorAuto.posicao("Pé", "P")).isEqualTo("INICIAL");
    }

    @Test
    void posicaoNulaQuandoFonemaNaoAparece() {
        assertThat(ClassificadorAuto.posicao("Bola", "R")).isNull();
        assertThat(ClassificadorAuto.posicao("", "R")).isNull();
    }

    @Test
    void transcricaoIgualAoAlvoEhCorreto() {
        assertThat(ClassificadorAuto.classificar("Rato", "R", "rato")).isEqualTo(ResultadoAuto.CORRETO);
        // pequenas diferenças com o fonema presente ainda contam como acerto
        assertThat(ClassificadorAuto.classificar("Cachorro", "CH", "cachoro"))
                .isEqualTo(ResultadoAuto.CORRETO);
    }

    @Test
    void producaoDiferenteEhAlterado() {
        // criança apagou o R inicial: "ato" para "rato"
        assertThat(ClassificadorAuto.classificar("Rato", "R", "ato")).isEqualTo(ResultadoAuto.ALTERADO);
        // trocou o som: "tato" para "rato"
        assertThat(ClassificadorAuto.classificar("Rato", "R", "tato")).isEqualTo(ResultadoAuto.ALTERADO);
    }

    @Test
    void normalizacaoPreservaEspacosComoNoSpeechService() {
        // Alvos com mais de uma palavra: a mesma normalização do pontuacao.mjs,
        // senão a nota do serviço e o veredito daqui divergem
        assertThat(ClassificadorAuto.normalizar("Céu  Azul!")).isEqualTo("ceu azul");
        assertThat(ClassificadorAuto.classificar("Céu azul", "S", "ceu azul"))
                .isEqualTo(ResultadoAuto.CORRETO);
    }

    @Test
    void semTranscricaoEhIndeterminado() {
        assertThat(ClassificadorAuto.classificar("Rato", "R", "")).isEqualTo(ResultadoAuto.INDETERMINADO);
        assertThat(ClassificadorAuto.classificar("Rato", "R", null)).isEqualTo(ResultadoAuto.INDETERMINADO);
    }
}
