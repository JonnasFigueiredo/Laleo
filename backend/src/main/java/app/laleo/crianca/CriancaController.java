package app.laleo.crianca;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.laleo.audio.ArmazenamentoAudio;
import app.laleo.tentativa.Tentativa;
import app.laleo.tentativa.TentativaRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/criancas")
public class CriancaController {

    public record NovaCrianca(@NotBlank @Size(max = 20) String nome, @NotBlank @Size(max = 8) String emoji) {
    }

    public record Consentimento(boolean consentido) {
    }

    private final CriancaRepository criancas;
    private final FigurinhaRepository figurinhas;
    private final TentativaRepository tentativas;
    private final ArmazenamentoAudio armazenamentoAudio;

    public CriancaController(CriancaRepository criancas, FigurinhaRepository figurinhas,
            TentativaRepository tentativas, ArmazenamentoAudio armazenamentoAudio) {
        this.criancas = criancas;
        this.figurinhas = figurinhas;
        this.tentativas = tentativas;
        this.armazenamentoAudio = armazenamentoAudio;
    }

    @GetMapping
    public List<Crianca> listar() {
        return criancas.findAll();
    }

    @PostMapping
    public Crianca criar(@Valid @RequestBody NovaCrianca nova) {
        return criancas.save(new Crianca(nova.nome().trim(), nova.emoji().trim()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Crianca> buscar(@PathVariable Long id) {
        return criancas.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Consentimento do responsável para guardar as gravações localmente. Ao
     * desligar, apaga as gravações já guardadas (LGPD — direito ao apagamento).
     */
    @PostMapping("/{id}/consentimento-audio")
    public ResponseEntity<Crianca> consentimentoAudio(@PathVariable Long id,
            @RequestBody Consentimento corpo) {
        Crianca crianca = criancas.findById(id).orElse(null);
        if (crianca == null) {
            return ResponseEntity.notFound().build();
        }
        crianca.setAudioConsentido(corpo.consentido());
        criancas.save(crianca);
        if (!corpo.consentido()) {
            for (Tentativa t : tentativas.findByCriancaId(id)) {
                if (t.isTemAudio()) {
                    armazenamentoAudio.apagar(t.getId());
                    t.setTemAudio(false);
                    tentativas.save(t);
                }
            }
        }
        return ResponseEntity.ok(crianca);
    }

    /** Álbum: figurinhas ganhas + total do catálogo (para mostrar as faltantes). */
    @GetMapping("/{id}/figurinhas")
    public Map<String, Object> album(@PathVariable Long id) {
        List<Figurinha> ganhas = figurinhas.findByCriancaIdOrderByGanhaEmAsc(id);
        return Map.of(
                "ganhas", ganhas,
                "totalCatalogo", GamificacaoService.CATALOGO.size());
    }
}
