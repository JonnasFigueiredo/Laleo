package app.laleo.tentativa;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;
import app.laleo.fala.AnaliseFala;
import app.laleo.fala.FalaService;

@RestController
@RequestMapping("/api/exercicios/{exercicioId}/tentativas")
public class TentativaController {

    private final ExercicioRepository exercicios;
    private final TentativaRepository tentativas;
    private final FalaService falaService;

    public TentativaController(ExercicioRepository exercicios, TentativaRepository tentativas,
            FalaService falaService) {
        this.exercicios = exercicios;
        this.tentativas = tentativas;
        this.falaService = falaService;
    }

    /**
     * Recebe a gravação da criança, analisa e persiste só as notas.
     * O áudio é processado em memória e descartado.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnaliseFala> analisar(@PathVariable Long exercicioId,
            @RequestPart("audio") MultipartFile audio) throws IOException {
        Exercicio exercicio = exercicios.findById(exercicioId).orElse(null);
        if (exercicio == null) {
            return ResponseEntity.notFound().build();
        }
        AnaliseFala analise = falaService.analisar(audio.getBytes(), exercicio.getPalavra(),
                exercicio.getFonemaAlvo());
        tentativas.save(new Tentativa(exercicioId, exercicio.getFonemaAlvo(), analise.notaGeral()));
        return ResponseEntity.ok(analise);
    }
}
