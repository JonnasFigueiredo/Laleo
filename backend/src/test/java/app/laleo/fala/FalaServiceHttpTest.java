package app.laleo.fala;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class FalaServiceHttpTest {

    @Test
    void caiParaOMockQuandoOServicoEstaForaDoAr() {
        // Porta 1 não tem nada ouvindo: a chamada falha e o fallback assume
        FalaServiceHttp service = new FalaServiceHttp(RestClient.create("http://localhost:1"));

        byte[] audio = new byte[10_000];
        AnaliseFala analise = service.analisar(audio, "Rato", "R");

        assertThat(analise.palavraAlvo()).isEqualTo("Rato");
        assertThat(analise.notaGeral()).isBetween(70, 100);
    }
}
