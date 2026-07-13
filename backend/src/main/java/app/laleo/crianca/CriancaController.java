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

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/criancas")
public class CriancaController {

    public record NovaCrianca(@NotBlank @Size(max = 20) String nome, @NotBlank @Size(max = 8) String emoji) {
    }

    private final CriancaRepository criancas;
    private final FigurinhaRepository figurinhas;

    public CriancaController(CriancaRepository criancas, FigurinhaRepository figurinhas) {
        this.criancas = criancas;
        this.figurinhas = figurinhas;
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

    /** Álbum: figurinhas ganhas + total do catálogo (para mostrar as faltantes). */
    @GetMapping("/{id}/figurinhas")
    public Map<String, Object> album(@PathVariable Long id) {
        List<Figurinha> ganhas = figurinhas.findByCriancaIdOrderByGanhaEmAsc(id);
        return Map.of(
                "ganhas", ganhas,
                "totalCatalogo", GamificacaoService.CATALOGO.size());
    }
}
