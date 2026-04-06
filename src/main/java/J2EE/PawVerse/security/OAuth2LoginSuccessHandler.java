package J2EE.PawVerse.security;

import J2EE.PawVerse.entity.Role;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.RoleRepository;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.util.JwtUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String provider = authToken.getAuthorizedClientRegistrationId().toUpperCase();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        
        // GitHub: email may be null when user has private email setting
        // Use login (username) as fallback to construct a placeholder email
        if (email == null) {
            String login = oAuth2User.getAttribute("login"); // GitHub username
            if (login != null) {
                email = login + "@" + provider.toLowerCase() + ".oauth";
            }
        }
        
        // Discord: username is under "username" attribute, not "name"
        if (name == null) {
            name = oAuth2User.getAttribute("username");
        }
        
        Object idAttr = oAuth2User.getAttribute("id");
        String providerId = idAttr != null ? idAttr.toString() : oAuth2User.getAttribute("sub");
        
        // Try to find by providerId first to avoid duplicate users
        final String finalEmail = email;
        final String finalProvider = provider;
        final String finalProviderId = providerId;
        final String finalName = name;
        
        User user = userRepository.findByOauthProviderAndOauthProviderId(provider, providerId)
                .orElseGet(() -> userRepository.findByEmail(finalEmail)
                        .orElseGet(() -> createNewUser(finalEmail, finalName, finalProvider, finalProviderId)));
        
        if (user.getOauthProvider() == null) {
            user.setOauthProvider(provider);
            user.setOauthProviderId(providerId);
            userRepository.save(user);
        }
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getIdUser());
        claims.put("role", user.getRole().getTenRole());
        
        String token = jwtUtil.generateToken(user.getUsername(), claims);
        
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();
        
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
    
    private User createNewUser(String email, String name, String provider, String providerId) {
        Role userRole = roleRepository.findByTenRole("USER")
                .orElseThrow(() -> new RuntimeException("Default role USER not found"));
        
        String usernameBase = (email != null ? email.split("@")[0] : providerId) + "_" + provider.toLowerCase();
        String username = usernameBase;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = usernameBase + suffix++;
        }
        
        User newUser = User.builder()
                .username(username)
                .email(email)
                .fullName(name != null ? name : "User")
                .role(userRole)
                .isLocked(false)
                .failedLoginAttempts(0)
                .emailVerified(true)
                .oauthProvider(provider)
                .oauthProviderId(providerId)
                .build();
        
        return userRepository.save(newUser);
    }
    
}
