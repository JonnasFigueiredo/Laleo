package app.laleo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// Máquinas Windows com antivírus/proxy que intercepta TLS quebram a
		// validação de certificados da JVM (chamadas à API da Anthropic, etc.).
		// Usar o repositório de certificados do próprio Windows resolve.
		if (System.getProperty("os.name", "").toLowerCase().contains("win")
				&& System.getProperty("javax.net.ssl.trustStoreType") == null) {
			System.setProperty("javax.net.ssl.trustStoreType", "WINDOWS-ROOT");
		}
		SpringApplication.run(BackendApplication.class, args);
	}

}
