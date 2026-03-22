package J2EE.PawVerse.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {
    
    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        
        // Redirect to frontend login page with error parameter
        String errorMessage = exception.getMessage();
        String targetUrl = "http://localhost:5173/login?oauth_error=" + 
                          java.net.URLEncoder.encode(errorMessage, "UTF-8");
        
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
