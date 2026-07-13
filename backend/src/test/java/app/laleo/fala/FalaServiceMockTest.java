package app.laleo.fala;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FalaServiceMockTest {

    private final FalaServiceMock service = new FalaServiceMock();

    @Test
    void audioMuitoCurtoPontuaBaixo() {
        AnaliseFala analise = service.analisar(new byte[100], "Rato", "R");

        assertThat(analise.notaGeral()).isEqualTo(30);
        assertThat(analise.palavraAlvo()).isEqualTo("Rato");
    }

    @Test
    void audioNormalPontuaEntre70e100() {
        byte[] audio = new byte[10_000];
        audio[0] = 42;

        AnaliseFala analise = service.analisar(audio, "Coelho", "LH");

        assertThat(analise.notaGeral()).isBetween(70, 100);
        assertThat(analise.fonemas()).isNotEmpty();
        assertThat(analise.fonemas().get(0).fonema()).isEqualTo("LH");
    }

    @Test
    void resultadoEDeterministicoParaOMesmoAudio() {
        byte[] audio = "gravacao de teste".getBytes();

        AnaliseFala primeira = service.analisar(audio, "Sapo", "S");
        AnaliseFala segunda = service.analisar(audio, "Sapo", "S");

        assertThat(primeira.notaGeral()).isEqualTo(segunda.notaGeral());
    }
}
