package J2EE.PawVerse.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Multilingual profanity filter service.
 * Two severity levels:
 * - MILD: mildly inappropriate words → review auto-hidden, user can reveal
 * - SEVERE: extremely offensive/disrespectful → review blocked entirely
 */
@Service
@Slf4j
public class ProfanityFilterService {

    // SEVERE: extremely offensive, block submission entirely
    private static final List<String> SEVERE_WORDS_VI = List.of(
        "địt", "đụ", "đéo", "đĩ", "lồn", "buồi", "cặc", "dâm", "đỉ",
        "dit me", "du ma", "đụ má", "địt mẹ", "đù mé", "đù má",
        "con đĩ", "thằng chó", "con chó", "đồ chó", "chó đẻ", "chó má",
        "mặt lồn", "mặt cặc", "súc vật", "phò", "điếm", "khốn nạn", "cặn bã", 
        "đkm", "đmm", "vcl", "vkl", "vl", "đệch", "đệt", "đm", "ml", "cl", "cđm",
        "đcm", "dcm", "vãi lồn", "vãi lìn", "vãi cặc", "đĩ điếm", "đụ đĩ",
        "má mày", "bà nội cha", "tổ sư", "tiên sư", "mả cha", "thằng khốn",
        "hiếp dâm", "ấu dâm", "lăng loàn", "lồn mẹ", "lỗ lồn", "củ cặc", "cái lồn",
        "cmm", "đcc", "vãi đái", "ăn cứt", "bú cu", "bú liếm", "cứt"
    );

    private static final List<String> SEVERE_WORDS_EN = List.of(
        "fuck", "shit", "bitch", "asshole", "dick", "pussy", "cunt",
        "motherfucker", "cock", "nigger", "nigga", "faggot", "retard",
        "whore", "slut", "bastard", "damn", "bullshit", "fucker", 
        "fucking", "wanker", "twat", "dickhead", "shithead", "prick", 
        "pedophile", "rape", "dyke", "chink", "cocksucker", "dumbfuck",
        "fuckface", "skank", "thot", "cum", "semen", "dipshit", "jackass",
        "motherfucking", "fucked", "shitty", "bitchy", "kys", "nazi",
        "incest", "zoophile", "fag", "homo", "tranny", "slutty", "hooker", "shit"
    );

    // MILD: mildly inappropriate → auto-hide review
    private static final List<String> MILD_WORDS_VI = List.of(
        "ngu", "ngu học", "ngu xuẩn", "ngu dốt", "ngu si", "óc chó", 
        "dốt", "dốt nát", "khùng", "điên", "hâm", "ngốc", "đần", "đần độn",
        "bại não", "thiểu năng", "óc bã đậu", "ngáo", "ngáo đá", 
        "vớ vẩn", "rác", "rác rưởi", "rẻ rách", "bậy", "tào lao", "chán", "dở", "xấu",
        "lừa đảo", "scam", "lừa", "gian lận", "ăn cắp", "fake",
        "tệ", "ghê", "kinh", "thối", "nhảm", "nhảm nhí", "hãm", 
        "lùa gà", "đa cấp", "phế", "trẻ trâu", "trẩu", "trẩu tre", "né gấp", 
        "thất vọng", "kém", "cùi bắp", "hút máu", "ảo tưởng",
        "vứt", "vứt đi", "cùi", "như hạch", "lôm côm", "bố láo", "lếu láo", 
        "dở hơi", "dởm", "tẩy chay", "report", "cấm", "dẹp", "đừng tải", "chê"
    );

    private static final List<String> MILD_WORDS_EN = List.of(
        "stupid", "idiot", "dumb", "ugly", "trash", "garbage", "crap",
        "suck", "hate", "worst", "terrible", "horrible", "scam", "fraud",
        "fake", "liar", "cheat", "awful", "disgusting", "useless", 
        "pathetic", "annoying", "ripoff", "jerk", "moron", "loser", 
        "nasty", "gross", "avoid", "waste of money",
        "bs", "wtf", "stfu", "gtfo", "noob", "trashy", "dogshit", "nonsense",
        "greedy", "p2w", "pay to win", "uninstalled", "refund", "bot",
        "scammers", "lame", "boring", "creepy", "weird", "dumbass", "fool", "clown"
    );

    // Pattern to remove diacritics for Vietnamese normalization
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    /**
     * Analyze comment content for profanity.
     * @return "SEVERE" if blocked, "MILD" if should be hidden, "NONE" if clean
     */
    public String analyzeContent(String text) {
        if (text == null || text.isBlank()) return "NONE";

        String normalized = normalizeText(text);
        String noAccent = removeDiacritics(text).toLowerCase();
        String lower = text.toLowerCase();

        // Check SEVERE first
        for (String word : SEVERE_WORDS_VI) {
            if (containsWord(lower, word) || containsWord(noAccent, removeDiacritics(word).toLowerCase())) {
                log.info("SEVERE profanity detected (VI): '{}'", word);
                return "SEVERE";
            }
        }
        for (String word : SEVERE_WORDS_EN) {
            if (containsWord(normalized, word)) {
                log.info("SEVERE profanity detected (EN): '{}'", word);
                return "SEVERE";
            }
        }

        // Check MILD
        for (String word : MILD_WORDS_VI) {
            if (containsWord(lower, word) || containsWord(noAccent, removeDiacritics(word).toLowerCase())) {
                log.info("MILD profanity detected (VI): '{}'", word);
                return "MILD";
            }
        }
        for (String word : MILD_WORDS_EN) {
            if (containsWord(normalized, word)) {
                log.info("MILD profanity detected (EN): '{}'", word);
                return "MILD";
            }
        }

        // Check for obfuscation patterns (e.g., f**k, sh!t, f.u.c.k)
        if (checkObfuscation(normalized)) {
            log.info("Obfuscated profanity detected");
            return "MILD";
        }

        return "NONE";
    }

    /**
     * Check if the text contains the word as a whole or partial match.
     */
    private boolean containsWord(String text, String word) {
        if (word.contains(" ")) {
            return text.contains(word);
        }
        // Word boundary check
        String regex = "(?i)\\b" + Pattern.quote(word) + "\\b";
        try {
            return Pattern.compile(regex).matcher(text).find();
        } catch (Exception e) {
            return text.contains(word);
        }
    }

    /**
     * Remove Vietnamese diacritics for normalization.
     */
    private String removeDiacritics(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        normalized = DIACRITICS.matcher(normalized).replaceAll("");
        // Handle special Vietnamese chars
        normalized = normalized.replace("đ", "d").replace("Đ", "D");
        return normalized;
    }

    /**
     * Normalize text: lowercase, strip extra spaces.
     */
    private String normalizeText(String text) {
        return text.toLowerCase().trim().replaceAll("\\s+", " ");
    }

    /**
     * Detect obfuscated profanity patterns like f**k, sh!t, f.u.c.k, etc.
     */
    private boolean checkObfuscation(String text) {
        // Remove common substitution chars and check
        String cleaned = text
            .replaceAll("[*@#$!.\\-_]", "")
            .replaceAll("0", "o")
            .replaceAll("1", "i")
            .replaceAll("3", "e")
            .replaceAll("4", "a")
            .replaceAll("5", "s")
            .toLowerCase();

        for (String word : SEVERE_WORDS_EN) {
            if (cleaned.contains(word)) return true;
        }
        return false;
    }
}
