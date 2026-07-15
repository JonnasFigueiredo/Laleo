package app.laleo.adulto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Autenticação da área dos adultos. O PIN é verificado aqui (hash SHA-256
 * no banco) e o sucesso emite um token opaco que os endpoints sensíveis
 * exigem ({@link app.laleo.config.SegurancaAdultoConfig}). Os tokens vivem
 * em memória: reiniciar o servidor pede o PIN de novo — comportamento
 * desejável para um portão de responsáveis.
 */
@Service
public class AdultoAuthService {

    private final PinAdultoRepository pins;
    private final Set<String> tokens = ConcurrentHashMap.newKeySet();

    public AdultoAuthService(PinAdultoRepository pins) {
        this.pins = pins;
    }

    public boolean pinExiste() {
        return pins.count() > 0;
    }

    /**
     * Cria o PIN (primeira vez) ou verifica o existente. Devolve um token
     * de sessão em caso de sucesso; vazio se o PIN não confere.
     */
    public Optional<String> entrarOuCriar(String pin) {
        String hash = hash(pin);
        Optional<PinAdulto> salvo = pins.findAll().stream().findFirst();
        if (salvo.isEmpty()) {
            pins.save(new PinAdulto(hash));
        } else if (!MessageDigest.isEqual(
                salvo.get().getHash().getBytes(StandardCharsets.UTF_8),
                hash.getBytes(StandardCharsets.UTF_8))) {
            return Optional.empty();
        }
        String token = UUID.randomUUID().toString();
        tokens.add(token);
        return Optional.of(token);
    }

    public boolean tokenValido(String token) {
        return token != null && tokens.contains(token);
    }

    /** Apaga o PIN (o adulto quer trocá-lo) e derruba as sessões abertas. */
    public void redefinir() {
        pins.deleteAll();
        tokens.clear();
    }

    static String hash(String pin) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(("laleo:" + pin).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
