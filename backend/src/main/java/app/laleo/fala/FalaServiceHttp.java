package app.laleo.fala;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Chama o speech-service (ver speech-service/CONTRATO.md). Se o serviço
 * estiver fora do ar ou falhar, cai para o mock — a criança nunca fica
 * sem resposta no meio do exercício.
 */
@Service
@Primary
@ConditionalOnProperty("laleo.fala.url")
public class FalaServiceHttp implements FalaService {

    private static final Logger log = LoggerFactory.getLogger(FalaServiceHttp.class);

    private final RestClient http;
    private final FalaService reserva = new FalaServiceMock();

    @Autowired
    public FalaServiceHttp(@Value("${laleo.fala.url}") String url) {
        this(construirRestClient(url));
    }

    FalaServiceHttp(RestClient http) {
        this.http = http;
    }

    private static RestClient construirRestClient(String url) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(3));
        fabrica.setReadTimeout(Duration.ofSeconds(30));
        return RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
    }

    @Override
    public AnaliseFala analisar(byte[] audio, String palavraAlvo, String fonemaAlvo) {
        try {
            MultiValueMap<String, Object> corpo = new LinkedMultiValueMap<>();
            corpo.add("audio", new ByteArrayResource(audio) {
                @Override
                public String getFilename() {
                    return "gravacao.wav";
                }
            });
            corpo.add("palavraAlvo", palavraAlvo);
            corpo.add("fonemaAlvo", fonemaAlvo);

            AnaliseFala analise = http.post()
                    .uri("/analisar")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(corpo)
                    .retrieve()
                    .body(AnaliseFala.class);
            if (analise == null) {
                throw new IllegalStateException("resposta vazia do speech-service");
            }
            return analise;
        } catch (Exception e) {
            log.warn("speech-service indisponível ({}); usando análise mock", e.getMessage());
            return reserva.analisar(audio, palavraAlvo, fonemaAlvo);
        }
    }
}
