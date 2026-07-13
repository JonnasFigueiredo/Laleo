package app.laleo.progresso;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.laleo.tentativa.Tentativa;
import app.laleo.tentativa.TentativaRepository;

@RestController
@RequestMapping("/api/progresso")
public class ProgressoController {

    public record ProgressoFonema(String fonema, long tentativas, double notaMedia) {
    }

    public record Progresso(long totalTentativas, List<ProgressoFonema> porFonema) {
    }

    private final TentativaRepository tentativas;

    public ProgressoController(TentativaRepository tentativas) {
        this.tentativas = tentativas;
    }

    @GetMapping
    public Progresso resumo(@RequestParam(value = "criancaId", required = false) Long criancaId) {
        List<Tentativa> todas = criancaId == null
                ? tentativas.findAll()
                : tentativas.findByCriancaId(criancaId);
        Map<String, List<Tentativa>> porFonema = new TreeMap<>();
        for (Tentativa t : todas) {
            porFonema.computeIfAbsent(t.getFonemaAlvo(), k -> new java.util.ArrayList<>()).add(t);
        }
        List<ProgressoFonema> resumo = porFonema.entrySet().stream()
                .map(e -> new ProgressoFonema(
                        e.getKey(),
                        e.getValue().size(),
                        e.getValue().stream().mapToInt(Tentativa::getNotaGeral).average().orElse(0)))
                .sorted(Comparator.comparing(ProgressoFonema::fonema))
                .toList();
        return new Progresso(todas.size(), resumo);
    }
}
