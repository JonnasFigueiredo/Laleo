package app.laleo.meta;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-meta")
@ActiveProfiles("test")
class MetaControllerTest {

    @Autowired
    private MetaController controller;

    @Test
    void criaNormalizaNaoDuplicaERemove() {
        long crianca = 5L;
        Meta m = controller.criar(crianca, new MetaController.NovaMeta("r"));
        assertThat(m.getFonema()).isEqualTo("R");

        // mesma meta (caixa diferente) não duplica
        Meta repetida = controller.criar(crianca, new MetaController.NovaMeta("R"));
        assertThat(repetida.getId()).isEqualTo(m.getId());
        assertThat(controller.listar(crianca)).hasSize(1);

        // outra criança tem metas independentes
        controller.criar(99L, new MetaController.NovaMeta("S"));
        assertThat(controller.listar(crianca)).hasSize(1);

        var removida = controller.remover(m.getId());
        assertThat(removida.getStatusCode().value()).isEqualTo(204);
        assertThat(controller.listar(crianca)).isEmpty();
    }
}
