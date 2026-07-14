package app.laleo.meta;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MetaRepository extends JpaRepository<Meta, Long> {

    List<Meta> findByCriancaIdOrderByCriadaEmDesc(Long criancaId);

    boolean existsByCriancaIdAndFonema(Long criancaId, String fonema);
}
