package app.laleo.crianca;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-gamificacao")
@ActiveProfiles("test")
class GamificacaoServiceTest {

    @Autowired
    private GamificacaoService gamificacao;

    @Autowired
    private CriancaRepository criancas;

    @Autowired
    private FigurinhaRepository figurinhas;

    @Test
    void ganhaEstrelaComNotaAltaEFigurinhaACada5() {
        Crianca ana = criancas.save(new Crianca("Ana", "🦊"));

        for (int i = 1; i <= 4; i++) {
            var r = gamificacao.registrar(ana.getId(), 90);
            assertThat(r.get().estrelas()).isEqualTo(i);
            assertThat(r.get().figurinha()).isNull();
        }

        var quinta = gamificacao.registrar(ana.getId(), 100);
        assertThat(quinta.get().estrelas()).isEqualTo(5);
        assertThat(quinta.get().figurinha()).isNotNull();
        assertThat(figurinhas.findByCriancaIdOrderByGanhaEmAsc(ana.getId())).hasSize(1);
    }

    @Test
    void notaBaixaNaoDaEstrelaMasDevolveOTotal() {
        Crianca bia = criancas.save(new Crianca("Bia", "🐼"));

        var r = gamificacao.registrar(bia.getId(), 30);

        assertThat(r.get().estrelas()).isZero();
        assertThat(r.get().figurinha()).isNull();
    }

    @Test
    void semCriancaNaoHaRecompensa() {
        assertThat(gamificacao.registrar(null, 100)).isEmpty();
        assertThat(gamificacao.registrar(99999L, 100)).isEmpty();
    }

    @Test
    void figurinhasNaoRepetemAteCompletarOAlbum() {
        Crianca cai = criancas.save(new Crianca("Cai", "🦖"));

        // 24 figurinhas × 5 estrelas = 120 acertos esvaziam o catálogo
        for (int i = 0; i < GamificacaoService.CATALOGO.size() * GamificacaoService.ESTRELAS_POR_FIGURINHA; i++) {
            gamificacao.registrar(cai.getId(), 100);
        }

        var todas = figurinhas.findByCriancaIdOrderByGanhaEmAsc(cai.getId());
        assertThat(todas).hasSize(GamificacaoService.CATALOGO.size());
        assertThat(todas.stream().map(Figurinha::getEmoji).distinct()).hasSize(GamificacaoService.CATALOGO.size());
    }
}
