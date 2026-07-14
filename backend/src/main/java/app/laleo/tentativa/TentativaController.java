package app.laleo.tentativa;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import app.laleo.audio.ArmazenamentoAudio;
import app.laleo.crianca.Crianca;
import app.laleo.crianca.CriancaRepository;
import app.laleo.crianca.GamificacaoService;
import app.laleo.exercicio.Exercicio;
import app.laleo.exercicio.ExercicioRepository;
import app.laleo.fala.AnaliseFala;
import app.laleo.fala.FalaService;
import app.laleo.fala.NotaFonema;

@RestController
@RequestMapping("/api/exercicios/{exercicioId}/tentativas")
public class TentativaController {

    public record ResultadoTentativa(AnaliseFala analise, Integer estrelas,
            GamificacaoService.FigurinhaGanha figurinha) {
    }

    private final ExercicioRepository exercicios;
    private final TentativaRepository tentativas;
    private final FalaService falaService;
    private final GamificacaoService gamificacao;
    private final CriancaRepository criancas;
    private final ArmazenamentoAudio armazenamentoAudio;

    public TentativaController(ExercicioRepository exercicios, TentativaRepository tentativas,
            FalaService falaService, GamificacaoService gamificacao, CriancaRepository criancas,
            ArmazenamentoAudio armazenamentoAudio) {
        this.exercicios = exercicios;
        this.tentativas = tentativas;
        this.falaService = falaService;
        this.gamificacao = gamificacao;
        this.criancas = criancas;
        this.armazenamentoAudio = armazenamentoAudio;
    }

    /**
     * Recebe a gravação da criança, analisa e persiste só as notas.
     * O áudio é processado em memória e descartado.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResultadoTentativa> analisar(@PathVariable Long exercicioId,
            @RequestParam(value = "criancaId", required = false) Long criancaId,
            @RequestParam(value = "sessaoId", required = false) String sessaoId,
            @RequestPart("audio") MultipartFile audio) throws IOException {
        Exercicio exercicio = exercicios.findById(exercicioId).orElse(null);
        if (exercicio == null) {
            return ResponseEntity.notFound().build();
        }
        AnaliseFala analise = falaService.analisar(audio.getBytes(), exercicio.getPalavra(),
                exercicio.getFonemaAlvo());

        Tentativa tentativa = new Tentativa(exercicioId, criancaId, exercicio.getFonemaAlvo(),
                analise.notaGeral());
        tentativa.setTipoExercicio(exercicio.getTipo() == null ? null : exercicio.getTipo().name());
        tentativa.setOrigem("PRODUCAO");
        tentativa.setPalavraAlvo(exercicio.getPalavra());
        tentativa.setPosicaoAlvo(ClassificadorAuto.posicao(exercicio.getPalavra(), exercicio.getFonemaAlvo()));
        tentativa.setTranscricao(analise.transcricao());
        tentativa.setNotaFonema(notaDoFonemaAlvo(analise, exercicio.getFonemaAlvo()));
        tentativa.setResultadoAuto(
                ClassificadorAuto.classificar(exercicio.getPalavra(), exercicio.getFonemaAlvo(),
                        analise.transcricao()));
        tentativa.setSessaoId(sessaoId);
        tentativas.save(tentativa);

        // Só guarda o áudio se o responsável consentiu (fica local; ver ArmazenamentoAudio)
        if (criancaId != null && temConsentimento(criancaId)) {
            armazenamentoAudio.salvar(tentativa.getId(), audio.getBytes());
            tentativa.setTemAudio(true);
            tentativas.save(tentativa);
        }

        var recompensa = gamificacao.registrar(criancaId, analise.notaGeral());
        return ResponseEntity.ok(new ResultadoTentativa(
                analise,
                recompensa.map(GamificacaoService.Recompensa::estrelas).orElse(null),
                recompensa.map(GamificacaoService.Recompensa::figurinha).orElse(null)));
    }

    private boolean temConsentimento(Long criancaId) {
        return criancas.findById(criancaId).map(Crianca::isAudioConsentido).orElse(false);
    }

    /** Nota do fonema-alvo na análise; casa pelo nome e cai para o primeiro item. */
    private static Integer notaDoFonemaAlvo(AnaliseFala analise, String fonemaAlvo) {
        if (analise.fonemas() == null || analise.fonemas().isEmpty()) {
            return null;
        }
        return analise.fonemas().stream()
                .filter(f -> f.fonema() != null && f.fonema().equalsIgnoreCase(fonemaAlvo))
                .map(NotaFonema::nota)
                .findFirst()
                .orElse(analise.fonemas().get(0).nota());
    }
}
