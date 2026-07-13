package app.laleo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;
import app.laleo.exercicio.TipoExercicio;

/**
 * Exercícios iniciais cobrindo os fonemas que mais desafiam crianças em pt-BR,
 * nas quatro interações de docs/metodologia.md.
 * TODO: revisar palavras, pares e progressão com fonoaudiólogo(a).
 */
@Configuration
@Profile("!test")
public class SeedData {

    @Bean
    CommandLineRunner seed(ExercicioRepository exercicios) {
        return args -> {
            if (exercicios.count() > 0) {
                return;
            }

            // ── Ouça e repita (Van Riper: palavra curta → longa → frase) ──
            exercicios.save(new Exercicio("Rato", "R", 1, "O rato faz rrr, como um motorzinho!"));
            exercicios.save(new Exercicio("Barata", "R", 2, "A barata mexe o bigode: ba-RA-ta!"));
            exercicios.save(new Exercicio("O rato roeu a roupa", "R", 3, "Vamos falar do rato comilão!"));
            exercicios.save(new Exercicio("Sapo", "S", 1, "O sapo faz sss, como uma cobrinha!"));
            exercicios.save(new Exercicio("Sino", "S", 2, "O sino toca: si-no, si-no!"));
            exercicios.save(new Exercicio("Chave", "CH", 1, "Faz de conta que manda silêncio: shhh!"));
            exercicios.save(new Exercicio("Chuva", "CH", 2, "A chuva cai: chuá, chuá!"));
            exercicios.save(new Exercicio("Coelho", "LH", 1, "O coelho pula: co-e-LHO!"));
            exercicios.save(new Exercicio("Palhaço", "LH", 2, "O palhaço é engraçado: pa-LHA-ço!"));
            exercicios.save(new Exercicio("Lua", "L", 1, "A língua toca o céu da boca: LLLua!"));
            exercicios.save(new Exercicio("Bola", "L", 2, "Vamos jogar bola: bo-LA!"));

            // ── Pares mínimos (contraste fonológico: um fonema muda tudo) ──
            exercicios.save(new Exercicio("Rato", "R", 1, "Escute bem e toque na figura certa!",
                    TipoExercicio.PARES_MINIMOS, "rato|🐀;pato|🦆", "rato"));
            exercicios.save(new Exercicio("Faca", "F", 1, "Escute bem: qual é a figura certa?",
                    TipoExercicio.PARES_MINIMOS, "faca|🔪;vaca|🐄", "faca"));
            exercicios.save(new Exercicio("Chuva", "CH", 1, "Presta atenção no comecinho da palavra!",
                    TipoExercicio.PARES_MINIMOS, "chuva|🌧️;uva|🍇", "chuva"));
            exercicios.save(new Exercicio("Bola", "L", 1, "Escute o finalzinho da palavra!",
                    TipoExercicio.PARES_MINIMOS, "bola|⚽;bota|👢", "bola"));

            // ── Rima (consciência fonológica, sempre falada em voz alta) ──
            exercicios.save(new Exercicio("Gato", "R", 1, "Rima é quando o fim das palavras combina!",
                    TipoExercicio.RIMA, "rato|🐀;bola|⚽", "rato"));
            exercicios.save(new Exercicio("Janela", "L", 1, "Escute o fim das palavras: qual combina?",
                    TipoExercicio.RIMA, "panela|🍳;sapato|👟", "panela"));
            exercicios.save(new Exercicio("Coelho", "LH", 1, "Qual palavra rima com coelho?",
                    TipoExercicio.RIMA, "joelho|🦵;chave|🔑", "joelho"));

            // ── Escuta (bombardeio auditivo: só ouvir, sem pressão) ──
            exercicios.save(new Exercicio("Sons do R", "R", 1, "Agora é só escutar, bem quietinho!",
                    TipoExercicio.ESCUTA, "rato;roda;rua;carro;barata", null));
            exercicios.save(new Exercicio("Sons do S", "S", 1, "Escute os sons de cobrinha: sss!",
                    TipoExercicio.ESCUTA, "sapo;sino;sopa;sol", null));
            exercicios.save(new Exercicio("Sons do CH", "CH", 1, "Escute os sons de silêncio: shhh!",
                    TipoExercicio.ESCUTA, "chave;chuva;chá;chinelo", null));
        };
    }
}
