package J2EE.PawVerse.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple server-side math CAPTCHA.
 * Generates a challenge like "3 + 7 = ?" and validates the answer.
 * Challenges expire after 5 minutes.
 */
@Service
public class CaptchaService {

    private static final int EXPIRY_MINUTES = 5;
    private static final Random RANDOM = new Random();

    private record CaptchaEntry(int answer, LocalDateTime expiry) {}

    private final Map<String, CaptchaEntry> store = new ConcurrentHashMap<>();

    public record CaptchaChallenge(String captchaToken, String question) {}

    public CaptchaChallenge generateChallenge() {
        int a = RANDOM.nextInt(10) + 1;
        int b = RANDOM.nextInt(10) + 1;
        int answer = a + b;
        String question = a + " + " + b + " = ?";
        String token = UUID.randomUUID().toString();
        store.put(token, new CaptchaEntry(answer, LocalDateTime.now().plusMinutes(EXPIRY_MINUTES)));
        return new CaptchaChallenge(token, question);
    }

    /**
     * Validates the captcha answer.
     * Removes the token from store after validation (one-time use).
     * @throws IllegalArgumentException if token unknown/expired or answer wrong.
     */
    public void validate(String token, String answerStr) {
        if (token == null || answerStr == null) {
            throw new IllegalArgumentException("Vui lòng nhập mã xác nhận CAPTCHA");
        }

        CaptchaEntry entry = store.remove(token);
        if (entry == null) {
            throw new IllegalArgumentException("Mã CAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng tải lại");
        }

        if (LocalDateTime.now().isAfter(entry.expiry())) {
            throw new IllegalArgumentException("Mã CAPTCHA đã hết hạn. Vui lòng tải lại");
        }

        int provided;
        try {
            provided = Integer.parseInt(answerStr.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Mã CAPTCHA phải là số");
        }

        if (provided != entry.answer()) {
            throw new IllegalArgumentException("Mã CAPTCHA không đúng");
        }
    }
}
