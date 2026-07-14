package app.laleo.exercicio;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import app.laleo.tentativa.TentativaRepository;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-resposta")
@ActiveProfiles("test")
class RespostaControllerTest {

    @Autowired
    private RespostaController controller;

    @Autowired
    private ExercicioRepository exercicios;

    @Autowired
    private TentativaRepository tentativas;

    @Test
    void acertoValecemErroVale30EAmbosViramTentativa() {
        Exercicio par = exercicios.save(new Exercicio("Rato", "R", 1, "dica",
                TipoExercicio.PARES_MINIMOS, "rato|🐀;pato|🦆", "rato"));

        var acerto = controller.responder(par.getId(), null, null, new RespostaController.Resposta("RATO"));
        var erro = controller.responder(par.getId(), null, null, new RespostaController.Resposta("pato"));

        assertThat(acerto.getBody().correta()).isTrue();
        assertThat(erro.getBody().correta()).isFalse();
        assertThat(erro.getBody().respostaCorreta()).isEqualTo("rato");
        assertThat(tentativas.findByFonemaAlvo("R")).hasSize(2)
                .extracting("notaGeral").containsExactlyInAnyOrder(100, 30);
    }

    @Test
    void exercicioSemRespostaCorretaRetorna400() {
        Exercicio escuta = exercicios.save(new Exercicio("Sons do S", "S", 1, "dica",
                TipoExercicio.ESCUTA, "sapo;sino", null));

        var resposta = controller.responder(escuta.getId(), null, null, new RespostaController.Resposta("sapo"));

        assertThat(resposta.getStatusCode().value()).isEqualTo(400);
    }
}
