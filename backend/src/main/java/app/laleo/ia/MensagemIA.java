package app.laleo.ia;

/** Uma fala do diálogo entre a criança e o amiguinho. */
public record MensagemIA(Papel papel, String texto) {

    public enum Papel {
        CRIANCA, AMIGO
    }
}
