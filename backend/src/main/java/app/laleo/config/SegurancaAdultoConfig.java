package app.laleo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import app.laleo.adulto.AdultoAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Protege no SERVIDOR os endpoints da área dos adultos — os que expõem voz
 * e transcrições das crianças (LGPD) ou alteram configuração terapêutica.
 * O PIN client-side sozinho não protegia nada: qualquer aparelho na rede
 * podia baixar os áudios por id. Exige o token emitido pelo AdultoController
 * (header X-Laleo-Token; ou ?token= para o <audio src>, que não manda header).
 *
 * Fora do escopo (fluxo da criança, sem PIN): exercícios, respostas,
 * tentativas via /api/exercicios, conversa, figurinhas e GET /api/metas
 * (a trilha da criança lê as metas para priorizar os sons).
 */
@Configuration
public class SegurancaAdultoConfig implements WebMvcConfigurer {

    private final AdultoAuthService auth;

    public SegurancaAdultoConfig(AdultoAuthService auth) {
        this.auth = auth;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        HandlerInterceptor exigirToken = new HandlerInterceptor() {
            @Override
            public boolean preHandle(@NonNull HttpServletRequest req,
                    @NonNull HttpServletResponse res, @NonNull Object handler) {
                if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
                    return true; // preflight CORS
                }
                // GET /api/metas é do fluxo da criança (prioriza a trilha)
                if ("GET".equalsIgnoreCase(req.getMethod())
                        && req.getRequestURI().startsWith("/api/metas")) {
                    return true;
                }
                String token = req.getHeader("X-Laleo-Token");
                if (token == null) {
                    token = req.getParameter("token");
                }
                if (auth.tokenValido(token)) {
                    return true;
                }
                res.setStatus(401);
                return false;
            }
        };

        registry.addInterceptor(exigirToken).addPathPatterns(
                "/api/tentativas/**",
                "/api/relatorio/**",
                "/api/progresso/**",
                "/api/metas/**",
                "/api/criancas/*/consentimento-audio");
    }
}
