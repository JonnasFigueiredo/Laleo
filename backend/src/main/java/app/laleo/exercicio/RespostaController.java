package app.laleo.exercicio;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.laleo.crianca.GamificacaoService;
import app.laleo.tentativa.ClassificadorAuto;
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

    public record Resultado(boolean correta, String respostaCorreta, Integer estrelas,
            GamificacaoService.FigurinhaGanha figurinha) {
    }

    private final ExercicioRepository exercicios;
    private final TentativaRepository tentativas;
    private final GamificacaoService gamificacao;

    public RespostaController(ExercicioRepository exercicios, TentativaRepository tentativas,
            GamificacaoService gamificacao) {
        this.exercicios = exercicios;
        this.tentativas = tentativas;
        this.gamificacao = gamificacao;
    }

    @PostMapping
    public ResponseEntity<Resultado> responder(@PathVariable Long exercicioId,
            @RequestParam(value = "criancaId", required = false) Long criancaId,
            @RequestParam(value = "sessaoId", required = false) String sessaoId,
            @RequestBody Resposta resposta) {
        Exercicio exercicio = exercicios.findById(exercicioId).orElse(null);
        if (exercicio == null) {
            return ResponseEntity.notFound().build();
        }
        if (exercicio.getRespostaCorreta() == null) {
            return ResponseEntity.badRequest().build();
        }
        boolean correta = exercicio.getRespostaCorreta().equalsIgnoreCase(resposta.escolha().trim());
        int nota = correta ? 100 : 30;

        Tentativa tentativa = new Tentativa(exercicioId, criancaId, exercicio.getFonemaAlvo(), nota);
        tentativa.setTipoExercicio(exercicio.getTipo() == null ? null : exercicio.getTipo().name());
        // Tarefa de percepção (não produção): sem transcrição nem tipificação de erro
        tentativa.setOrigem("ESCOLHA");
        tentativa.setPalavraAlvo(exercicio.getPalavra());
        tentativa.setPosicaoAlvo(ClassificadorAuto.posicao(exercicio.getPalavra(), exercicio.getFonemaAlvo()));
        tentativa.setSessaoId(sessaoId);
        tentativas.save(tentativa);

        var recompensa = gamificacao.registrar(criancaId, nota);
        return ResponseEntity.ok(new Resultado(correta, exercicio.getRespostaCorreta(),
                recompensa.map(GamificacaoService.Recompensa::estrelas).orElse(null),
                recompensa.map(GamificacaoService.Recompensa::figurinha).orElse(null)));
    }
}
