package app.laleo.crianca;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FigurinhaRepository extends JpaRepository<Figurinha, Long> {

    List<Figurinha> findByCriancaIdOrderByGanhaEmAsc(Long criancaId);
}
