package app.laleo.exercicio;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExercicioRepository extends JpaRepository<Exercicio, Long> {

    List<Exercicio> findByFonemaAlvoOrderByDificuldadeAsc(String fonemaAlvo);

    boolean existsByPalavraAndTipo(String palavra, TipoExercicio tipo);
}
