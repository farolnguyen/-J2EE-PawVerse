package J2EE.PawVerse.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Verifies Google reCAPTCHA v2 tokens against Google's siteverify API.
 * Prevents automated bots from bypassing the frontend reCAPTCHA widget.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReCaptchaVerificationService {

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${recaptcha.secret-key:}")
    private String secretKey;

    private final RestTemplate restTemplate;

    /**
     * Verifies a reCAPTCHA token.
     * @throws IllegalArgumentException if verification fails.
     */
    public void verify(String token) {
        if (secretKey == null || secretKey.isBlank()) {
            log.warn("reCAPTCHA secret key not configured — skipping verification");
            return;
        }

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Vui lòng xác nhận bạn không phải robot (reCAPTCHA)");
        }

        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", secretKey);
            params.add("response", token);

            ReCaptchaResponse response = restTemplate.postForObject(VERIFY_URL, params, ReCaptchaResponse.class);

            if (response == null || !response.success()) {
                String errorCodes = response != null && response.errorCodes() != null
                        ? String.join(", ", response.errorCodes())
                        : "unknown";
                log.warn("reCAPTCHA verification failed. Error codes: {}", errorCodes);
                throw new IllegalArgumentException("Xác nhận reCAPTCHA thất bại. Vui lòng thử lại");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("reCAPTCHA verification request failed", e);
            throw new IllegalArgumentException("Không thể xác minh reCAPTCHA. Vui lòng thử lại");
        }
    }

    private record ReCaptchaResponse(
            boolean success,
            @JsonProperty("error-codes") List<String> errorCodes
    ) {}
}
