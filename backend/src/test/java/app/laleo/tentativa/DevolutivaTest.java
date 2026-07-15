package app.laleo.tentativa;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-devolutiva")
@ActiveProfiles("test")
class DevolutivaTest {

    @Autowired
    private TentativaController producao;
    @Autowired
    private RelatorioController relatorio;
    @Autowired
    private RevisaoController revisao;
    @Autowired
    private ExercicioRepository exercicios;

    @Test
    void relatorioAgregaProducoesEHonraORotuloDoFono() throws IOException {
        Exercicio ex = exercicios.save(new Exercicio("Rato", "R", 1, "É o ratinho!"));
        var audio = new MockMultipartFile("audio", "g.wav", "audio/wav", new byte[5000]);
        long crianca = 9L;
        producao.analisar(ex.getId(), crianca, "s1", audio);
        producao.analisar(ex.getId(), crianca, "s1", audio);

        // Sem revisão: as duas produções vêm como CORRETO (mock devolve a palavra)
        var antes = relatorio.relatorio(crianca);
        assertThat(antes.totalProducoes()).isEqualTo(2);
        assertThat(antes.sessoes()).isEqualTo(1);
        assertThat(antes.percentualProducaoCorreta()).isEqualTo(100.0);
        assertThat(antes.vereditosAuto()).containsEntry("CORRETO", 2L);

        // Fila de revisão lista as duas produções
        var fila = revisao.listar(crianca, null, null);
        assertThat(fila).hasSize(2);

        // O fono reclassifica uma como SUBSTITUICAO — a métrica passa a valer a verdade dele
        revisao.classificar(fila.get(0).id(), new RevisaoController.Classificacao(TipoErroFono.SUBSTITUICAO));

        var depois = relatorio.relatorio(crianca);
        assertThat(depois.percentualProducaoCorreta()).isEqualTo(50.0);
        assertThat(depois.errosFono()).containsEntry("SUBSTITUICAO", 1L);
        assertThat(depois.porFonema()).anySatisfy(f -> {
            assertThat(f.fonema()).isEqualTo("R");
            assertThat(f.producoesAvaliaveis()).isEqualTo(2);
            assertThat(f.producoesCorretas()).isEqualTo(1);
        });
    }
}
