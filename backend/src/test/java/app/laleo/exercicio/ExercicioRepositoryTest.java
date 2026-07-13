package app.laleo.exercicio;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-exercicio")
@ActiveProfiles("test")
class ExercicioRepositoryTest {

    @Autowired
    private ExercicioRepository repository;

    @Test
    void filtraPorFonemaOrdenandoPorDificuldade() {
        repository.save(new Exercicio("Barata", "R", 2, "dica"));
        repository.save(new Exercicio("Rato", "R", 1, "dica"));
        repository.save(new Exercicio("Sapo", "S", 1, "dica"));

        List<Exercicio> doR = repository.findByFonemaAlvoOrderByDificuldadeAsc("R");

        assertThat(doR).hasSize(2);
        assertThat(doR.get(0).getPalavra()).isEqualTo("Rato");
    }
}
