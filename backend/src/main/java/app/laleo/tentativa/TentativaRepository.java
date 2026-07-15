package app.laleo.tentativa;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TentativaRepository extends JpaRepository<Tentativa, Long> {

    List<Tentativa> findByFonemaAlvo(String fonemaAlvo);

    List<Tentativa> findByCriancaId(Long criancaId);

    /** Fila de revisão do fono: produções mais recentes, com LIMIT no SQL. */
    List<Tentativa> findByCriancaIdAndOrigemOrderByCriadaEmDesc(Long criancaId, String origem,
            Pageable pageable);

    /** Exportação: todas as origens, mais recentes primeiro, com LIMIT no SQL. */
    List<Tentativa> findByCriancaIdOrderByCriadaEmDesc(Long criancaId, Pageable pageable);

    /** Tentativas com gravação guardada — alvo da deleção ao revogar consentimento. */
    List<Tentativa> findByCriancaIdAndTemAudioTrue(Long criancaId);

    /**
     * Revogação de consentimento: limpa a marcação em um único UPDATE (sem N+1).
     * flush antes (grava o audioConsentido=false pendente da mesma transação) e
     * clear depois (o contexto não fica com entidades desatualizadas pelo bulk).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Tentativa t set t.temAudio = false where t.criancaId = ?1 and t.temAudio = true")
    int limparAudio(Long criancaId);
}
