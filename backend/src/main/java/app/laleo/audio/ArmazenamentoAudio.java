package app.laleo.audio;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Guarda as gravações localmente (só com consentimento do responsável), para o
 * fono ouvir na revisão. Fica em disco no próprio aparelho/servidor — nunca sai
 * para um serviço externo. A pasta é ignorada pelo git (dados/). Um arquivo WAV
 * por tentativa, nomeado pelo id.
 */
@Component
public class ArmazenamentoAudio {

    private static final Logger log = LoggerFactory.getLogger(ArmazenamentoAudio.class);

    private final Path pasta;

    public ArmazenamentoAudio(@Value("${laleo.audio.dir:dados/audio}") String dir) {
        this.pasta = Path.of(dir);
    }

    public void salvar(Long tentativaId, byte[] wav) {
        try {
            Files.createDirectories(pasta);
            Files.write(arquivo(tentativaId), wav);
        } catch (IOException e) {
            // Não deixa a criança sem resposta se o disco falhar: loga e segue
            log.warn("Não consegui guardar o áudio da tentativa {}: {}", tentativaId, e.getMessage());
        }
    }

    public boolean existe(Long tentativaId) {
        return Files.exists(arquivo(tentativaId));
    }

    public byte[] ler(Long tentativaId) {
        try {
            Path a = arquivo(tentativaId);
            return Files.exists(a) ? Files.readAllBytes(a) : null;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public void apagar(Long tentativaId) {
        try {
            Files.deleteIfExists(arquivo(tentativaId));
        } catch (IOException e) {
            log.warn("Não consegui apagar o áudio da tentativa {}: {}", tentativaId, e.getMessage());
        }
    }

    private Path arquivo(Long tentativaId) {
        return pasta.resolve(tentativaId + ".wav");
    }
}
