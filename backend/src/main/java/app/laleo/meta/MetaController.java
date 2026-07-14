package app.laleo.meta;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.NotBlank;

/**
 * Metas terapêuticas por criança (Passo 2). O fono adiciona/remove fonemas-alvo;
 * o app prioriza os exercícios desses sons na trilha.
 */
@RestController
@RequestMapping("/api/metas")
public class MetaController {

    public record NovaMeta(@NotBlank String fonema) {
    }

    private final MetaRepository metas;

    public MetaController(MetaRepository metas) {
        this.metas = metas;
    }

    @GetMapping
    public List<Meta> listar(@RequestParam("criancaId") Long criancaId) {
        return metas.findByCriancaIdOrderByCriadaEmDesc(criancaId);
    }

    @PostMapping
    public Meta criar(@RequestParam("criancaId") Long criancaId, @RequestBody NovaMeta nova) {
        String fonema = nova.fonema().trim().toUpperCase();
        // idempotente: não duplica a mesma meta para a criança
        return metas.findByCriancaIdOrderByCriadaEmDesc(criancaId).stream()
                .filter(m -> m.getFonema().equalsIgnoreCase(fonema))
                .findFirst()
                .orElseGet(() -> metas.save(new Meta(criancaId, fonema)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!metas.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        metas.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
