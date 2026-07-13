package app.laleo.crianca;

import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Recompensas fundamentadas em docs/metodologia.md (seção Gamificação):
 * pontos (estrelas) por desempenho e colecionável surpresa em camadas —
 * a cada ESTRELAS_POR_FIGURINHA estrelas, uma figurinha aleatória ainda
 * não colecionada. Recompensa variável prende mais a atenção que prêmio
 * previsível, e o álbum dá um objetivo de longo prazo visível.
 */
@Service
public class GamificacaoService {

    public static final int ESTRELAS_POR_FIGURINHA = 5;
    public static final int NOTA_MINIMA_ESTRELA = 70;

    public record FigurinhaGanha(String emoji, String nome) {
    }

    public record Recompensa(int estrelas, FigurinhaGanha figurinha) {
    }

    static final List<FigurinhaGanha> CATALOGO = List.of(
            new FigurinhaGanha("🦁", "Leão"), new FigurinhaGanha("🐘", "Elefante"),
            new FigurinhaGanha("🦒", "Girafa"), new FigurinhaGanha("🐬", "Golfinho"),
            new FigurinhaGanha("🦋", "Borboleta"), new FigurinhaGanha("🐢", "Tartaruga"),
            new FigurinhaGanha("🦜", "Arara"), new FigurinhaGanha("🐧", "Pinguim"),
            new FigurinhaGanha("🦊", "Raposa"), new FigurinhaGanha("🐼", "Panda"),
            new FigurinhaGanha("🦄", "Unicórnio"), new FigurinhaGanha("🐙", "Polvo"),
            new FigurinhaGanha("🦖", "Dinossauro"), new FigurinhaGanha("🐝", "Abelha"),
            new FigurinhaGanha("🦉", "Coruja"), new FigurinhaGanha("🐠", "Peixinho"),
            new FigurinhaGanha("🌈", "Arco-íris"), new FigurinhaGanha("🚀", "Foguete"),
            new FigurinhaGanha("🏰", "Castelo"), new FigurinhaGanha("🎈", "Balão"),
            new FigurinhaGanha("🍦", "Sorvete"), new FigurinhaGanha("⚽", "Bola"),
            new FigurinhaGanha("🎸", "Violão"), new FigurinhaGanha("👑", "Coroa"));

    private final CriancaRepository criancas;
    private final FigurinhaRepository figurinhas;
    private final Random sorteio = new Random();

    public GamificacaoService(CriancaRepository criancas, FigurinhaRepository figurinhas) {
        this.criancas = criancas;
        this.figurinhas = figurinhas;
    }

    /**
     * Registra o desempenho e devolve o estado de recompensas da criança.
     * Nota ≥ 70 vale uma estrela; a cada 5 estrelas, figurinha surpresa.
     */
    @Transactional
    public Optional<Recompensa> registrar(Long criancaId, int nota) {
        if (criancaId == null) {
            return Optional.empty();
        }
        Crianca crianca = criancas.findById(criancaId).orElse(null);
        if (crianca == null) {
            return Optional.empty();
        }

        FigurinhaGanha nova = null;
        if (nota >= NOTA_MINIMA_ESTRELA) {
            crianca.ganharEstrela();
            criancas.save(crianca);
            if (crianca.getEstrelas() % ESTRELAS_POR_FIGURINHA == 0) {
                nova = sortearFigurinha(criancaId);
            }
        }
        return Optional.of(new Recompensa(crianca.getEstrelas(), nova));
    }

    private FigurinhaGanha sortearFigurinha(Long criancaId) {
        Set<String> possuidas = figurinhas.findByCriancaIdOrderByGanhaEmAsc(criancaId).stream()
                .map(Figurinha::getEmoji)
                .collect(Collectors.toSet());
        List<FigurinhaGanha> faltantes = CATALOGO.stream()
                .filter(f -> !possuidas.contains(f.emoji()))
                .toList();
        if (faltantes.isEmpty()) {
            return null; // álbum completo!
        }
        FigurinhaGanha sorteada = faltantes.get(sorteio.nextInt(faltantes.size()));
        figurinhas.save(new Figurinha(criancaId, sorteada.emoji(), sorteada.nome()));
        return sorteada;
    }
}
