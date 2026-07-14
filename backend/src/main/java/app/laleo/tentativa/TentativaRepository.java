package app.laleo.tentativa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TentativaRepository extends JpaRepository<Tentativa, Long> {

    List<Tentativa> findByFonemaAlvo(String fonemaAlvo);

    List<Tentativa> findByCriancaId(Long criancaId);

    /** Tentativas de produção da criança (mais recentes primeiro) — fila de revisão do fono. */
    List<Tentativa> findByCriancaIdAndOrigemOrderByCriadaEmDesc(Long criancaId, String origem);
}
