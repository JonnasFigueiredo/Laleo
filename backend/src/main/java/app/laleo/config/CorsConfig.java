package app.laleo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Libera o dev server do Vite; em produção o app é servido pelo mesmo host. */
@Configuration
@Profile("!prod")
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Padrão (não origem fixa): o Vite pode subir em 5173, 5174, 5175... conforme
        // a porta livre, e o navegador manda Origin no POST — fixar uma porta só dava 403.
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
