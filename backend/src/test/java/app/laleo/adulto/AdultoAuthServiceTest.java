package app.laleo.adulto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:teste-adulto")
@ActiveProfiles("test")
class AdultoAuthServiceTest {

    @Autowired
    private AdultoAuthService auth;

    @Test
    void criaVerificaEDerrubaSessoes() {
        assertThat(auth.pinExiste()).isFalse();

        // Primeira chamada cria o PIN e emite token
        var token = auth.entrarOuCriar("1234");
        assertThat(token).isPresent();
        assertThat(auth.pinExiste()).isTrue();
        assertThat(auth.tokenValido(token.get())).isTrue();

        // PIN errado não entra; PIN certo emite outro token
        assertThat(auth.entrarOuCriar("9999")).isEmpty();
        assertThat(auth.entrarOuCriar("1234")).isPresent();

        // Token inventado não vale
        assertThat(auth.tokenValido("qualquer-coisa")).isFalse();
        assertThat(auth.tokenValido(null)).isFalse();

        // Redefinir apaga o PIN e derruba as sessões abertas
        auth.redefinir();
        assertThat(auth.pinExiste()).isFalse();
        assertThat(auth.tokenValido(token.get())).isFalse();
    }
}
