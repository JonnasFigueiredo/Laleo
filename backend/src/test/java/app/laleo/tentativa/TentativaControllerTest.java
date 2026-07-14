package app.laleo.tentativa;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;
import app.laleo.exercicio.TipoExercicio;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-tentativa")
@ActiveProfiles("test")
class TentativaControllerTest {

    @Autowired
    private TentativaController controller;

    @Autowired
    private ExercicioRepository exercicios;

    @Autowired
    private TentativaRepository tentativas;

    @Test
    void producaoPersisteEnriquecimentoClinico() throws IOException {
        Exercicio ex = exercicios.save(new Exercicio("Rato", "R", 1, "É o ratinho!"));
        var audio = new MockMultipartFile("audio", "gravacao.wav", "audio/wav", new byte[5000]);

        controller.analisar(ex.getId(), 7L, "sessao-abc", audio);

        List<Tentativa> salvas = tentativas.findByCriancaId(7L);
        assertThat(salvas).hasSize(1);
        Tentativa t = salvas.get(0);
        assertThat(t.getOrigem()).isEqualTo("PRODUCAO");
        assertThat(t.getTipoExercicio()).isEqualTo("OUCA_E_REPITA");
        assertThat(t.getPalavraAlvo()).isEqualTo("Rato");
        assertThat(t.getPosicaoAlvo()).isEqualTo("INICIAL");
        assertThat(t.getSessaoId()).isEqualTo("sessao-abc");
        assertThat(t.getTranscricao()).isNotBlank();
        assertThat(t.getNotaFonema()).isNotNull();
        // mock/serviço devolve a própria palavra como transcrição → veredito CORRETO
        assertThat(t.getResultadoAuto()).isEqualTo(ResultadoAuto.CORRETO);
        // o fono ainda não revisou
        assertThat(t.getTipoErroFono()).isNull();
    }
}
