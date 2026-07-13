package app.laleo.exercicio;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.laleo.tentativa.Tentativa;
import app.laleo.tentativa.TentativaRepository;
import jakarta.validation.constraints.NotBlank;

/**
 * Resposta dos exercícios de escolha (pares mínimos, rima).
 * Acerto vale 100 e erro 30 no progresso do fonema — mantém a régua
 * dos exercícios de produção.
 */
@RestController
@RequestMapping("/api/exercicios/{exercicioId}/respostas")
public class RespostaController {

    public record Resposta(@NotBlank String escolha) {
    }

    public record Resultado(boolean correta, String respostaCorreta) {
    }

    private final ExercicioRepository exercicios;
    private final TentativaRepository tentativas;

    public RespostaController(ExercicioRepository exercicios, TentativaRepository tentativas) {
        this.exercicios = exercicios;
        this.tentativas = tentativas;
    }

    @PostMapping
    public ResponseEntity<Resultado> responder(@PathVariable Long exercicioId, @RequestBody Resposta resposta) {
        Exercicio exercicio = exercicios.findById(exercicioId).orElse(null);
        if (exercicio == null) {
            return ResponseEntity.notFound().build();
        }
        if (exercicio.getRespostaCorreta() == null) {
            return ResponseEntity.badRequest().build();
        }
        boolean correta = exercicio.getRespostaCorreta().equalsIgnoreCase(resposta.escolha().trim());
        tentativas.save(new Tentativa(exercicioId, exercicio.getFonemaAlvo(), correta ? 100 : 30));
        return ResponseEntity.ok(new Resultado(correta, exercicio.getRespostaCorreta()));
    }
}
