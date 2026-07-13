package app.laleo.tentativa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TentativaRepository extends JpaRepository<Tentativa, Long> {

    List<Tentativa> findByFonemaAlvo(String fonemaAlvo);
}
