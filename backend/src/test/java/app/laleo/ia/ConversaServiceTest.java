package app.laleo.ia;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class ConversaServiceTest {

    private ConversaService servicoCom(ProvedorIA provedor) {
        ObjectProvider<ProvedorIA> fornecedor = new ObjectProvider<>() {
            @Override
            public ProvedorIA getObject() {
                return provedor;
            }

            @Override
            public ProvedorIA getIfAvailable() {
                return provedor;
            }
        };
        return new ConversaService(fornecedor, new ProvedorDemo());
    }

    @Test
    void sanitizaLinksELimitaTamanho() {
        assertThat(ConversaService.sanitizar("Veja https://site.com/x agora"))
                .isEqualTo("Veja agora");
        assertThat(ConversaService.sanitizar("a".repeat(500))).hasSizeLessThanOrEqualTo(280);
        assertThat(ConversaService.sanitizar("")).isNotBlank();
        assertThat(ConversaService.sanitizar(null)).isNotBlank();
    }

    @Test
    void historicoELimitadoEComecaSempreComACrianca() {
        AtomicReference<List<MensagemIA>> recebido = new AtomicReference<>();
        ConversaService servico = servicoCom((sistema, historico) -> {
            recebido.set(historico);
            return "Oi!";
        });

        for (int i = 0; i < 10; i++) {
            servico.conversar("c1", "Lala", "fala numero " + i);
        }

        assertThat(recebido.get().size()).isLessThanOrEqualTo(8);
        assertThat(recebido.get().get(0).papel()).isEqualTo(MensagemIA.Papel.CRIANCA);
        assertThat(recebido.get().get(recebido.get().size() - 1).texto()).isEqualTo("fala numero 9");
    }

    @Test
    void caiParaDemoQuandoOProvedorFalha() {
        ConversaService servico = servicoCom((sistema, historico) -> {
            throw new IllegalStateException("api fora do ar");
        });

        String resposta = servico.conversar("c2", "Leo", "oi amigo");

        assertThat(resposta).isNotBlank();
    }

    @Test
    void promptDeSistemaCarregaAsRegrasDeSeguranca() {
        String prompt = ConversaService.promptSistema("Lala");

        assertThat(prompt).contains("Lala");
        assertThat(prompt).contains("português brasileiro");
        assertThat(prompt).contains("dados pessoais");
        assertThat(prompt).contains("adulto de");
    }
}
