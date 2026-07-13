package app.laleo.fala;

/**
 * Analisa a gravação da criança contra a palavra alvo.
 * A implementação real chama o speech-service; em dev usa o mock.
 */
public interface FalaService {

    AnaliseFala analisar(byte[] audio, String palavraAlvo, String fonemaAlvo);
}
