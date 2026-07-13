package app.laleo.fala;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/**
 * Transcrição pura (sem nota de pronúncia) para a conversa livre.
 * Sem fallback silencioso: se o speech-service estiver fora do ar, a
 * conversa por voz não funciona e o erro sobe para o controlador.
 */
@Service
public class TranscricaoClient {

    public record Transcricao(String transcricao) {
    }

    private final RestClient http;

    public TranscricaoClient(@Value("${laleo.fala.url:http://localhost:8090}") String url) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(3));
        fabrica.setReadTimeout(Duration.ofSeconds(30));
        this.http = RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
    }

    public String transcrever(byte[] audio) {
        MultiValueMap<String, Object> corpo = new LinkedMultiValueMap<>();
        corpo.add("audio", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return "gravacao.wav";
            }
        });
        Transcricao resultado = http.post()
                .uri("/transcrever")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(corpo)
                .retrieve()
                .body(Transcricao.class);
        return resultado == null ? null : resultado.transcricao();
    }
}
