package app.laleo.exercicio;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercicios")
public class ExercicioController {

    private final ExercicioRepository repository;

    public ExercicioController(ExercicioRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Exercicio> listar(@RequestParam(required = false) String fonema) {
        if (fonema != null && !fonema.isBlank()) {
            return repository.findByFonemaAlvoOrderByDificuldadeAsc(fonema.toUpperCase());
        }
        return repository.findAll();
    }
}
