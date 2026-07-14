package app.laleo.audio;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import app.laleo.crianca.Crianca;
import app.laleo.crianca.CriancaController;
import app.laleo.crianca.CriancaRepository;
import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;
import app.laleo.tentativa.RevisaoController;
import app.laleo.tentativa.TentativaController;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:teste-audio",
        "laleo.audio.dir=target/audio-teste" })
@ActiveProfiles("test")
class AudioConsentimentoTest {

    @Autowired
    private TentativaController producao;
    @Autowired
    private RevisaoController revisao;
    @Autowired
    private CriancaController criancaCtrl;
    @Autowired
    private CriancaRepository criancas;
    @Autowired
    private ExercicioRepository exercicios;

    @Test
    void audioSoComConsentimentoEApagadoAoRetirar() throws IOException {
        Crianca c = criancas.save(new Crianca("Teste", "🦄"));
        Exercicio ex = exercicios.save(new Exercicio("Rato", "R", 1, "dica"));
        var audio = new MockMultipartFile("audio", "g.wav", "audio/wav", new byte[5000]);

        // Sem consentimento: nada é guardado
        producao.analisar(ex.getId(), c.getId(), "s1", audio);
        var t1 = revisao.listar(c.getId(), null).get(0);
        assertThat(t1.temAudio()).isFalse();
        assertThat(revisao.audio(t1.id()).getStatusCode().value()).isEqualTo(404);

        // Com consentimento: a próxima gravação é guardada e pode ser ouvida
        criancaCtrl.consentimentoAudio(c.getId(), new CriancaController.Consentimento(true));
        producao.analisar(ex.getId(), c.getId(), "s1", audio);
        var comAudio = revisao.listar(c.getId(), null).stream()
                .filter(RevisaoController.TentativaResumo::temAudio)
                .findFirst()
                .orElseThrow();
        var resposta = revisao.audio(comAudio.id());
        assertThat(resposta.getStatusCode().value()).isEqualTo(200);
        assertThat(resposta.getBody()).isNotEmpty();

        // Retirar o consentimento apaga as gravações guardadas
        criancaCtrl.consentimentoAudio(c.getId(), new CriancaController.Consentimento(false));
        assertThat(revisao.audio(comAudio.id()).getStatusCode().value()).isEqualTo(404);
        assertThat(criancas.findById(c.getId()).orElseThrow().isAudioConsentido()).isFalse();
    }
}
