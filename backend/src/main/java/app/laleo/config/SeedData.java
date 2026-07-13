package app.laleo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;

/**
 * Exercícios iniciais cobrindo os fonemas que mais desafiam crianças em pt-BR.
 * TODO: revisar palavras e progressão com fonoaudiólogo(a).
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
            // Fonema R (vibrante simples)
            exercicios.save(new Exercicio("Rato", "R", 1, "O rato faz rrr, como um motorzinho!"));
            exercicios.save(new Exercicio("Barata", "R", 2, "A barata mexe o bigode: ba-RA-ta!"));
            exercicios.save(new Exercicio("O rato roeu a roupa", "R", 3, "Vamos falar do rato comilão!"));
            // Fonema S
            exercicios.save(new Exercicio("Sapo", "S", 1, "O sapo faz sss, como uma cobrinha!"));
            exercicios.save(new Exercicio("Sino", "S", 2, "O sino toca: si-no, si-no!"));
            // Fonema CH
            exercicios.save(new Exercicio("Chave", "CH", 1, "Faz de conta que manda silêncio: shhh!"));
            exercicios.save(new Exercicio("Chuva", "CH", 2, "A chuva cai: chuá, chuá!"));
            // Fonema LH
            exercicios.save(new Exercicio("Coelho", "LH", 1, "O coelho pula: co-e-LHO!"));
            exercicios.save(new Exercicio("Palhaço", "LH", 2, "O palhaço é engraçado: pa-LHA-ço!"));
            // Fonema L
            exercicios.save(new Exercicio("Lua", "L", 1, "A língua toca o céu da boca: LLLua!"));
            exercicios.save(new Exercicio("Bola", "L", 2, "Vamos jogar bola: bo-LA!"));
        };
    }
}
