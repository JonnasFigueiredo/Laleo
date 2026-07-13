package app.laleo.ia;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import app.laleo.fala.TranscricaoClient;

/**
 * Conversa livre com o amiguinho. A criança fala (áudio WAV) ou, para
 * testes, envia texto. O áudio é transcrito pelo speech-service, o texto
 * vai ao provedor de IA com os guardrails do ConversaService, e o app
 * fala a resposta com a voz do avatar. Áudio processado em memória e
 * descartado; nenhuma transcrição é persistida.
 */
@RestController
@RequestMapping("/api/conversa")
public class ConversaController {

    public record Fala(String pergunta, String resposta) {
    }

    private final ConversaService conversa;
    private final TranscricaoClient transcricao;

    public ConversaController(ConversaService conversa, TranscricaoClient transcricao) {
        this.conversa = conversa;
        this.transcricao = transcricao;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Fala> falar(
            @RequestParam("conversaId") String conversaId,
            @RequestParam(value = "amigo", defaultValue = "Lalê") String amigo,
            @RequestParam(value = "texto", required = false) String texto,
            @RequestPart(value = "audio", required = false) MultipartFile audio) throws IOException {

        String pergunta = texto;
        if ((pergunta == null || pergunta.isBlank()) && audio != null) {
            pergunta = transcricao.transcrever(audio.getBytes());
        }
        if (pergunta == null || pergunta.isBlank()) {
            return ResponseEntity.unprocessableEntity().build();
        }

        String resposta = conversa.conversar(conversaId, amigo, pergunta.trim());
        return ResponseEntity.ok(new Fala(pergunta.trim(), resposta));
    }
}
