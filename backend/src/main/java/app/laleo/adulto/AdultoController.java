package app.laleo.adulto;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.NotBlank;

/** Portão da área dos adultos: cria/verifica o PIN e emite o token de sessão. */
@RestController
@RequestMapping("/api/adulto/pin")
public class AdultoController {

    public record Pin(@NotBlank String pin) {
    }

    private final AdultoAuthService auth;

    public AdultoController(AdultoAuthService auth) {
        this.auth = auth;
    }

    /** O cliente pergunta se já existe PIN para decidir entre "criar" e "digitar". */
    @GetMapping
    public Map<String, Boolean> existe() {
        return Map.of("existe", auth.pinExiste());
    }

    /** Cria (primeira vez) ou verifica o PIN. 401 se não confere. */
    @PostMapping
    public ResponseEntity<Map<String, String>> entrar(@RequestBody Pin corpo) {
        return auth.entrarOuCriar(corpo.pin().trim())
                .map(token -> ResponseEntity.ok(Map.of("token", token)))
                .orElse(ResponseEntity.status(401).build());
    }

    /** Troca de PIN: exige sessão válida, apaga o PIN e derruba os tokens. */
    @DeleteMapping
    public ResponseEntity<Void> redefinir(@RequestHeader(value = "X-Laleo-Token", required = false) String token) {
        if (!auth.tokenValido(token)) {
            return ResponseEntity.status(401).build();
        }
        auth.redefinir();
        return ResponseEntity.noContent().build();
    }
}
