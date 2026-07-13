package app.laleo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;
import app.laleo.exercicio.TipoExercicio;

/**
 * Exercícios cobrindo os fonemas que mais desafiam crianças em pt-BR, nas
 * quatro interações de docs/metodologia.md. O seed é idempotente: insere
 * apenas o que falta (palavra+tipo), então exercícios novos entram em
 * bancos existentes sem duplicar nem apagar progresso.
 * TODO: revisar palavras, pares e progressão com fonoaudiólogo(a).
 */
@Configuration
@Profile("!test")
public class SeedData {

    @Bean
    CommandLineRunner seed(ExercicioRepository exercicios) {
        return args -> {
            java.util.function.Consumer<Exercicio> garantir = e -> {
                if (!exercicios.existsByPalavraAndTipo(e.getPalavra(), e.getTipo())) {
                    exercicios.save(e);
                }
            };

            // ── Ouça e repita (Van Riper: palavra curta → longa → frase) ──
            garantir.accept(new Exercicio("Rato", "R", 1, "O rato faz rrr, como um motorzinho!"));
            garantir.accept(new Exercicio("Barata", "R", 2, "A barata mexe o bigode: ba-RA-ta!"));
            garantir.accept(new Exercicio("O rato roeu a roupa", "R", 3, "Vamos falar do rato comilão!"));
            garantir.accept(new Exercicio("Sapo", "S", 1, "O sapo faz sss, como uma cobrinha!"));
            garantir.accept(new Exercicio("Sino", "S", 2, "O sino toca: si-no, si-no!"));
            garantir.accept(new Exercicio("Chave", "CH", 1, "Faz de conta que manda silêncio: shhh!"));
            garantir.accept(new Exercicio("Chuva", "CH", 2, "A chuva cai: chuá, chuá!"));
            garantir.accept(new Exercicio("Coelho", "LH", 1, "O coelho pula: co-e-LHO!"));
            garantir.accept(new Exercicio("Palhaço", "LH", 2, "O palhaço é engraçado: pa-LHA-ço!"));
            garantir.accept(new Exercicio("Lua", "L", 1, "A língua toca o céu da boca: LLLua!"));
            garantir.accept(new Exercicio("Bola", "L", 2, "Vamos jogar bola: bo-LA!"));
            garantir.accept(new Exercicio("Faca", "F", 1, "Morde o lábio de leve: fff!"));
            garantir.accept(new Exercicio("Foca", "F", 2, "A foca bate palmas: fo-ca!"));
            garantir.accept(new Exercicio("Vaca", "V", 1, "O vvv faz cócegas no lábio: vvvaca!"));
            garantir.accept(new Exercicio("Vela", "V", 2, "Sopra a vela do bolo: ve-la!"));
            garantir.accept(new Exercicio("Jacaré", "J", 1, "O jacaré nada: jjjacaré!"));
            garantir.accept(new Exercicio("Janela", "J", 2, "Abre a janela: ja-ne-la!"));
            garantir.accept(new Exercicio("Zebra", "Z", 1, "A abelha faz zzz, igual à zzzebra!"));
            garantir.accept(new Exercicio("Azul", "Z", 2, "O céu é azul: a-zul!"));
            garantir.accept(new Exercicio("Gato", "G", 1, "O gato mia: gggato!"));
            garantir.accept(new Exercicio("Galinha", "G", 2, "A galinha cisca: ga-li-nha!"));
            garantir.accept(new Exercicio("Casa", "C", 1, "O c estala na garganta: cccasa!"));
            garantir.accept(new Exercicio("Cavalo", "C", 2, "O cavalo galopa: ca-va-lo!"));
            garantir.accept(new Exercicio("Braço", "BR", 1, "Junta o b com o r: bbbraço!"));
            garantir.accept(new Exercicio("Brinquedo", "BR", 2, "Vamos brincar: brin-que-do!"));
            garantir.accept(new Exercicio("Trem", "TR", 1, "O trem apita: piuí! Tttrem!"));
            garantir.accept(new Exercicio("Trator", "TR", 2, "O trator trabalha: tra-tor!"));
            garantir.accept(new Exercicio("Prato", "PR", 1, "Junta o p com o r: pppra-to!"));

            // ── Pares mínimos (contraste fonológico: um fonema muda tudo) ──
            garantir.accept(new Exercicio("Rato", "R", 1, "Escute bem e toque na figura certa!",
                    TipoExercicio.PARES_MINIMOS, "rato|🐀;pato|🦆", "rato"));
            garantir.accept(new Exercicio("Faca", "F", 1, "Escute bem: qual é a figura certa?",
                    TipoExercicio.PARES_MINIMOS, "faca|🔪;vaca|🐄", "faca"));
            garantir.accept(new Exercicio("Chuva", "CH", 1, "Presta atenção no comecinho da palavra!",
                    TipoExercicio.PARES_MINIMOS, "chuva|🌧️;uva|🍇", "chuva"));
            garantir.accept(new Exercicio("Bola", "L", 1, "Escute o finalzinho da palavra!",
                    TipoExercicio.PARES_MINIMOS, "bola|⚽;bota|👢", "bola"));
            garantir.accept(new Exercicio("Vaca", "V", 1, "O vvv vibra, o fff sopra. Qual é?",
                    TipoExercicio.PARES_MINIMOS, "vaca|🐄;faca|🔪", "vaca"));
            garantir.accept(new Exercicio("Gato", "G", 1, "Escute o comecinho: g ou p?",
                    TipoExercicio.PARES_MINIMOS, "gato|🐈;pato|🦆", "gato"));
            garantir.accept(new Exercicio("Janela", "J", 1, "Escute bem o primeiro som!",
                    TipoExercicio.PARES_MINIMOS, "janela|🪟;panela|🍳", "janela"));
            garantir.accept(new Exercicio("Trem", "TR", 1, "Tr ou b? Escuta com atenção!",
                    TipoExercicio.PARES_MINIMOS, "trem|🚂;bem|❤️", "trem"));

            // ── Rima (consciência fonológica, sempre falada em voz alta) ──
            garantir.accept(new Exercicio("Gato", "R", 1, "Rima é quando o fim das palavras combina!",
                    TipoExercicio.RIMA, "rato|🐀;bola|⚽", "rato"));
            garantir.accept(new Exercicio("Janela", "L", 1, "Escute o fim das palavras: qual combina?",
                    TipoExercicio.RIMA, "panela|🍳;sapato|👟", "panela"));
            garantir.accept(new Exercicio("Coelho", "LH", 1, "Qual palavra rima com coelho?",
                    TipoExercicio.RIMA, "joelho|🦵;chave|🔑", "joelho"));
            garantir.accept(new Exercicio("Mão", "M", 1, "Rima com mão... escute bem!",
                    TipoExercicio.RIMA, "pão|🍞;gato|🐈", "pão"));
            garantir.accept(new Exercicio("Balão", "B", 1, "O que rima com balão?",
                    TipoExercicio.RIMA, "mão|🖐️;bola|⚽", "mão"));
            garantir.accept(new Exercicio("Estrela", "E", 1, "Qual combina com estrela?",
                    TipoExercicio.RIMA, "panela|🍳;trem|🚂", "panela"));

            // ── Escuta (bombardeio auditivo: só ouvir, sem pressão) ──
            garantir.accept(new Exercicio("Sons do R", "R", 1, "Agora é só escutar, bem quietinho!",
                    TipoExercicio.ESCUTA, "rato;roda;rua;carro;barata", null));
            garantir.accept(new Exercicio("Sons do S", "S", 1, "Escute os sons de cobrinha: sss!",
                    TipoExercicio.ESCUTA, "sapo;sino;sopa;sol", null));
            garantir.accept(new Exercicio("Sons do CH", "CH", 1, "Escute os sons de silêncio: shhh!",
                    TipoExercicio.ESCUTA, "chave;chuva;chá;chinelo", null));
            garantir.accept(new Exercicio("Sons do F", "F", 1, "Escute os sons de soprinho: fff!",
                    TipoExercicio.ESCUTA, "faca;foca;fada;festa", null));
            garantir.accept(new Exercicio("Sons do V", "V", 1, "Escute os sons que fazem cócegas: vvv!",
                    TipoExercicio.ESCUTA, "vaca;vela;vovó;avião", null));
            garantir.accept(new Exercicio("Sons do J", "J", 1, "Escute os sons do jacaré: jjj!",
                    TipoExercicio.ESCUTA, "jacaré;janela;jipe;jogo", null));
            garantir.accept(new Exercicio("Sons do TR e BR", "TR", 1, "Sons de trem e de brincadeira!",
                    TipoExercicio.ESCUTA, "trem;trator;braço;brinquedo", null));
        };
    }
}
