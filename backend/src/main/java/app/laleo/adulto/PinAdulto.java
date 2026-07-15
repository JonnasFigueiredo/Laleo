package app.laleo.adulto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * PIN da área dos adultos, agora verificado no SERVIDOR (linha única).
 * Antes o hash vivia só no localStorage do cliente, o que não protegia
 * nada: qualquer aparelho na rede podia chamar os endpoints sensíveis
 * (áudio das crianças, transcrições) direto. Guardamos apenas o hash.
 */
@Entity
public class PinAdulto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String hash;

    protected PinAdulto() {
    }

    public PinAdulto(String hash) {
        this.hash = hash;
    }

    public Long getId() {
        return id;
    }

    public String getHash() {
        return hash;
    }
}
