package app.laleo.tentativa;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Devolutiva ao profissional (Passo 2): agrega as tentativas em métricas que
 * orientam a terapia — acerto de produção (proxy de PCC), acurácia por fonema e
 * por posição na palavra, e a distribuição de erros. Onde o fono já revisou, a
 * verdade é a dele ({@link TipoErroFono}); senão, usa o veredito automático.
 */
@RestController
@RequestMapping("/api/relatorio")
public class RelatorioController {

    public record ResumoPosicao(String posicao, long avaliaveis, long corretas) {
    }

    public record ResumoFonema(String fonema, long tentativas, double notaMedia,
            long producoesAvaliaveis, long producoesCorretas, List<ResumoPosicao> porPosicao) {
    }

    public record Relatorio(long totalTentativas, long totalProducoes, long sessoes,
            Double percentualProducaoCorreta, Map<String, Long> vereditosAuto,
            Map<String, Long> errosFono, List<ResumoFonema> porFonema) {
    }

    private final TentativaRepository tentativas;

    public RelatorioController(TentativaRepository tentativas) {
        this.tentativas = tentativas;
    }

    @GetMapping
    public Relatorio relatorio(@RequestParam(value = "criancaId", required = false) Long criancaId) {
        List<Tentativa> todas = criancaId == null
                ? tentativas.findAll()
                : tentativas.findByCriancaId(criancaId);

        List<Tentativa> producoes = todas.stream().filter(RelatorioController::eProducao).toList();

        long sessoes = todas.stream()
                .map(Tentativa::getSessaoId)
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .count();

        long avaliaveis = producoes.stream().filter(RelatorioController::avaliavel).count();
        long corretas = producoes.stream().filter(RelatorioController::correta).count();
        Double percentualCorreto = avaliaveis == 0 ? null : arredondar(100.0 * corretas / avaliaveis);

        Map<String, Long> vereditosAuto = producoes.stream()
                .filter(t -> t.getResultadoAuto() != null)
                .collect(Collectors.groupingBy(t -> t.getResultadoAuto().name(),
                        TreeMap::new, Collectors.counting()));

        Map<String, Long> errosFono = todas.stream()
                .filter(t -> t.getTipoErroFono() != null)
                .collect(Collectors.groupingBy(t -> t.getTipoErroFono().name(),
                        TreeMap::new, Collectors.counting()));

        Map<String, List<Tentativa>> porFonema = todas.stream()
                .collect(Collectors.groupingBy(Tentativa::getFonemaAlvo, TreeMap::new, Collectors.toList()));

        List<ResumoFonema> resumoFonemas = porFonema.entrySet().stream()
                .map(e -> resumoDoFonema(e.getKey(), e.getValue()))
                .toList();

        return new Relatorio(todas.size(), producoes.size(), sessoes, percentualCorreto,
                vereditosAuto, errosFono, resumoFonemas);
    }

    private static ResumoFonema resumoDoFonema(String fonema, List<Tentativa> lista) {
        double notaMedia = arredondar(lista.stream().mapToInt(Tentativa::getNotaGeral).average().orElse(0));
        List<Tentativa> producoes = lista.stream().filter(RelatorioController::eProducao).toList();
        long avaliaveis = producoes.stream().filter(RelatorioController::avaliavel).count();
        long corretas = producoes.stream().filter(RelatorioController::correta).count();

        Map<String, List<Tentativa>> porPosicao = producoes.stream()
                .filter(RelatorioController::avaliavel)
                .collect(Collectors.groupingBy(
                        t -> t.getPosicaoAlvo() == null ? "INDEFINIDA" : t.getPosicaoAlvo(),
                        TreeMap::new, Collectors.toList()));

        List<ResumoPosicao> posicoes = porPosicao.entrySet().stream()
                .map(e -> new ResumoPosicao(e.getKey(), e.getValue().size(),
                        e.getValue().stream().filter(RelatorioController::correta).count()))
                .toList();

        return new ResumoFonema(fonema, lista.size(), notaMedia, avaliaveis, corretas, posicoes);
    }

    private static boolean eProducao(Tentativa t) {
        return "PRODUCAO".equals(t.getOrigem());
    }

    /** Onde o fono revisou, a verdade é a dele; senão, o veredito automático (sem INDETERMINADO). */
    private static boolean avaliavel(Tentativa t) {
        if (t.getTipoErroFono() != null) {
            return true;
        }
        return t.getResultadoAuto() == ResultadoAuto.CORRETO || t.getResultadoAuto() == ResultadoAuto.ALTERADO;
    }

    private static boolean correta(Tentativa t) {
        if (t.getTipoErroFono() != null) {
            return t.getTipoErroFono() == TipoErroFono.CORRETO;
        }
        return t.getResultadoAuto() == ResultadoAuto.CORRETO;
    }

    private static double arredondar(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
