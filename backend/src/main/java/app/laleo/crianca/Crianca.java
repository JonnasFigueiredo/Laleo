package app.laleo.crianca;

import java.time.Instant;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Perfil de criança no aparelho. Sem autenticação: os perfis servem para
 * separar progresso e recompensas entre irmãos/pacientes. Guardamos apenas
 * primeiro nome/apelido e um emoji — nada identificável além disso (LGPD).
 */
@Entity
public class Crianca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String emoji;

    /** Total de estrelas ganhas (nota ≥ 70 ou acerto em escolha). */
    private int estrelas;

    /**
     * Consentimento do responsável para guardar as gravações neste aparelho,
     * para o fono ouvir na revisão. Padrão desligado (fluxo sem áudio). Ao
     * desligar, o áudio guardado é apagado (LGPD — direito ao apagamento).
     */
    @ColumnDefault("false")
    private boolean audioConsentido;

    private Instant criadaEm;

    protected Crianca() {
    }

    public Crianca(String nome, String emoji) {
        this.nome = nome;
        this.emoji = emoji;
        this.estrelas = 0;
        this.criadaEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmoji() {
        return emoji;
    }

    public int getEstrelas() {
        return estrelas;
    }

    public void ganharEstrela() {
        this.estrelas++;
    }

    public boolean isAudioConsentido() {
        return audioConsentido;
    }

    public void setAudioConsentido(boolean audioConsentido) {
        this.audioConsentido = audioConsentido;
    }

    public Instant getCriadaEm() {
        return criadaEm;
    }
}
