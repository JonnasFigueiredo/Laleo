package app.laleo.tentativa;

import java.time.Instant;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.laleo.audio.ArmazenamentoAudio;

/**
 * Fila de revisão do fonoaudiólogo (Passo 2). Lista as produções da criança
 * — com transcrição do ASR e veredito automático — e recebe a classificação
 * clínica ({@link TipoErroFono}). Cada rótulo do fono vira também dado de
 * referência para medir e melhorar o ASR (Passo 3).
 */
@RestController
@RequestMapping("/api/tentativas")
public class RevisaoController {

    /** Uma tentativa como o fono a vê na fila de revisão. */
    public record TentativaResumo(Long id, Long exercicioId, String tipoExercicio, String origem,
            String fonemaAlvo, String palavraAlvo, String posicaoAlvo, String transcricao,
            int notaGeral, Integer notaFonema, ResultadoAuto resultadoAuto, TipoErroFono tipoErroFono,
            String sessaoId, Instant criadaEm, boolean temAudio) {

        static TentativaResumo de(Tentativa t) {
            return new TentativaResumo(t.getId(), t.getExercicioId(), t.getTipoExercicio(),
                    t.getOrigem(), t.getFonemaAlvo(), t.getPalavraAlvo(), t.getPosicaoAlvo(),
                    t.getTranscricao(), t.getNotaGeral(), t.getNotaFonema(), t.getResultadoAuto(),
                    t.getTipoErroFono(), t.getSessaoId(), t.getCriadaEm(), t.isTemAudio());
        }
    }

    public record Classificacao(TipoErroFono tipoErroFono) {
    }

    private static final int LIMITE_PADRAO = 50;

    private final TentativaRepository tentativas;
    private final ArmazenamentoAudio armazenamentoAudio;

    public RevisaoController(TentativaRepository tentativas, ArmazenamentoAudio armazenamentoAudio) {
        this.tentativas = tentativas;
        this.armazenamentoAudio = armazenamentoAudio;
    }

    /** Produções da criança, mais recentes primeiro (fila de revisão). */
    @GetMapping
    public List<TentativaResumo> listar(@RequestParam("criancaId") Long criancaId,
            @RequestParam(value = "limite", required = false) Integer limite) {
        int max = limite == null || limite <= 0 ? LIMITE_PADRAO : limite;
        return tentativas.findByCriancaIdAndOrigemOrderByCriadaEmDesc(criancaId, "PRODUCAO").stream()
                .limit(max)
                .map(TentativaResumo::de)
                .toList();
    }

    /** Gravação guardada (só existe com consentimento) — o fono ouve na revisão. */
    @GetMapping(value = "/{id}/audio", produces = "audio/wav")
    public ResponseEntity<byte[]> audio(@PathVariable Long id) {
        Tentativa t = tentativas.findById(id).orElse(null);
        if (t == null || !t.isTemAudio()) {
            return ResponseEntity.notFound().build();
        }
        byte[] wav = armazenamentoAudio.ler(id);
        if (wav == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("audio/wav")).body(wav);
    }

    /** O fono classifica (ou corrige) o erro de uma tentativa. */
    @PostMapping("/{id}/classificacao")
    public ResponseEntity<TentativaResumo> classificar(@PathVariable Long id,
            @RequestBody Classificacao corpo) {
        Tentativa t = tentativas.findById(id).orElse(null);
        if (t == null) {
            return ResponseEntity.notFound().build();
        }
        t.setTipoErroFono(corpo.tipoErroFono());
        tentativas.save(t);
        return ResponseEntity.ok(TentativaResumo.de(t));
    }
}
