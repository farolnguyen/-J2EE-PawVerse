package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.chatbot.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.BufferedReader;
import java.io.StringReader;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatbotService {

    @Value("${coze.api.key}")
    private String cozeApiKey;

    @Value("${coze.bot.id}")
    private String cozeBotId;

    @Value("${coze.api.endpoint}")
    private String cozeApiEndpoint;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // Rate limiting: IP/session -> list of timestamps
    private final ConcurrentHashMap<String, List<Long>> rateLimitMap = new ConcurrentHashMap<>();
    private static final int MAX_MESSAGES_PER_MINUTE = 5;
    private static final int MAX_MESSAGES_PER_HOUR = 30;
    private static final long ONE_MINUTE_MS = 60_000L;
    private static final long ONE_HOUR_MS = 3_600_000L;

    public ChatbotService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Check rate limit for a given client key (IP or session).
     * @return error message if rate-limited, null if OK
     */
    public String checkRateLimit(String clientKey) {
        long now = System.currentTimeMillis();
        rateLimitMap.putIfAbsent(clientKey, Collections.synchronizedList(new ArrayList<>()));
        List<Long> timestamps = rateLimitMap.get(clientKey);

        // Clean old entries
        timestamps.removeIf(t -> now - t > ONE_HOUR_MS);

        long recentMinute = timestamps.stream().filter(t -> now - t < ONE_MINUTE_MS).count();
        if (recentMinute >= MAX_MESSAGES_PER_MINUTE) {
            return "Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi 1 phút trước khi gửi tiếp.";
        }

        if (timestamps.size() >= MAX_MESSAGES_PER_HOUR) {
            return "Bạn đã đạt giới hạn " + MAX_MESSAGES_PER_HOUR + " tin nhắn/giờ. Vui lòng thử lại sau.";
        }

        timestamps.add(now);
        return null;
    }

    /**
     * Send a message to the Coze API and return the bot response.
     * Parses SSE (Server-Sent Events) stream format like the old C# project.
     */
    public String sendMessage(String userMessage, String conversationId) {
        try {
            String userId = conversationId != null ? conversationId : "website_user_" + UUID.randomUUID();

            CozeMessage message = CozeMessage.builder()
                    .role("user")
                    .content(userMessage)
                    .contentType("text")
                    .build();

            CozeSendMessageRequest request = CozeSendMessageRequest.builder()
                    .botId(cozeBotId)
                    .userId(userId)
                    .additionalMessages(List.of(message))
                    .stream(true)
                    .autoSaveHistory(false)
                    .build();

            log.info("Sending streaming request to COZE API: {}", cozeApiEndpoint);

            // Get the raw SSE response as a single string
            String rawResponse = webClient.post()
                    .uri(cozeApiEndpoint)
                    .header("Authorization", "Bearer " + cozeApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (rawResponse == null || rawResponse.isBlank()) {
                return "Không nhận được phản hồi từ chatbot.";
            }

            // Parse SSE lines (same logic as old C# project)
            String assistantContent = parseSSEResponse(rawResponse);

            if (assistantContent.isEmpty()) {
                log.warn("No assistant content found in stream");
                return "Không nhận được phản hồi từ chatbot.";
            }

            // Apply duplicate removal before returning
            String cleaned = removeDuplicatedContent(assistantContent);
            log.info("Returning cleaned response (length={})", cleaned.length());
            return cleaned;

        } catch (Exception e) {
            log.error("Error sending message to Coze API", e);
            throw new RuntimeException("Lỗi kết nối chatbot: " + e.getMessage());
        }
    }

    /**
     * Parse SSE event stream, extract content from type="answer" role="assistant" messages.
     * Mirrors the C# parsing logic from the old project.
     */
    private String parseSSEResponse(String rawResponse) {
        StringBuilder assistantContent = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new StringReader(rawResponse))) {
            String line;
            boolean isCompleted = false;

            while ((line = reader.readLine()) != null && !isCompleted) {
                if (line.isBlank()) continue;

                if (line.startsWith("event:")) {
                    String eventType = line.substring("event:".length()).trim();
                    if ("conversation.chat.completed".equals(eventType)) {
                        isCompleted = true;
                    }
                } else if (line.startsWith("data:")) {
                    String data = line.substring("data:".length()).trim();
                    if (data.equals("[DONE]")) continue;

                    try {
                        JsonNode node = objectMapper.readTree(data);
                        String type = node.has("type") ? node.get("type").asText() : null;
                        String role = node.has("role") ? node.get("role").asText() : null;
                        String content = node.has("content") ? node.get("content").asText() : null;

                        if ("answer".equals(type) && "assistant".equals(role)
                                && content != null && !content.isEmpty()) {
                            assistantContent.append(content);
                        }
                    } catch (Exception e) {
                        log.warn("Exception parsing SSE data: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error reading SSE stream: {}", e.getMessage());
        }

        return assistantContent.toString();
    }

    // ========== Duplicate Removal (ported from old C# project) ==========

    private String removeDuplicatedContent(String content) {
        if (content == null || content.isEmpty()) return content;

        // STEP 1: Exact half-half duplicate
        if (content.length() % 2 == 0) {
            int half = content.length() / 2;
            String first = content.substring(0, half);
            String second = content.substring(half);
            if (first.equals(second)) {
                log.info("Detected exact duplicate (50-50), returning first half");
                return first;
            }
        }

        // STEP 2: Approximate ratio duplicates (40-60% splits)
        for (double ratio = 0.4; ratio <= 0.6; ratio += 0.05) {
            int splitPoint = (int) (content.length() * ratio);
            if (splitPoint > 10 && splitPoint < content.length() - 10) {
                String part1 = content.substring(0, splitPoint);
                String part2 = content.substring(splitPoint);
                int checkLen = Math.min(50, Math.min(part1.length(), part2.length()));
                if (checkLen > 0) {
                    double sim = levenshteinSimilarity(
                            part1.substring(0, checkLen).toLowerCase(),
                            part2.substring(0, checkLen).toLowerCase());
                    if (sim > 0.8) {
                        log.info("Detected duplicate at {}% with similarity {}", (int)(ratio*100), sim);
                        return part1.stripTrailing();
                    }
                }
            }
        }

        // STEP 3: Keyword-based duplicate detection
        int dupIdx = findPotentialDuplicateStart(content);
        if (dupIdx > 0) {
            log.info("Found potential duplicate at position {}", dupIdx);
            return content.substring(0, dupIdx).stripTrailing();
        }

        // STEP 4: Sentence-level dedup
        String[] sentences = content.split("[.!?]");
        List<String> filtered = Arrays.stream(sentences)
                .map(String::trim)
                .filter(s -> !s.isBlank() && s.length() > 5)
                .collect(Collectors.toList());

        if (filtered.size() <= 1) return content;

        List<String> unique = new ArrayList<>();
        for (String current : filtered) {
            boolean isDup = false;
            for (int j = 0; j < unique.size(); j++) {
                String u = unique.get(j);
                if (u.contains(current) || current.contains(u)) {
                    isDup = true;
                    break;
                }
                double sim = jaccardSimilarity(normalizeText(u), normalizeText(current));
                if (sim > 0.7) {
                    isDup = true;
                    if (current.length() > u.length()) {
                        unique.set(j, current);
                    }
                    break;
                }
            }
            if (!isDup) unique.add(current);
        }

        return String.join(". ", unique) + ".";
    }

    private int findPotentialDuplicateStart(String content) {
        if (content == null || content.length() < 20) return -1;

        String[] keywords = {
                "Xin chào", "Chào bạn", "Mình rất", "Tôi rất",
                "Bạn có cần", "giới thiệu", "hỗ trợ bạn",
                "về sản phẩm", "sản phẩm nào", "Dưới đây",
                "Các sản phẩm", "PawVerse", "thú cưng",
                "Tên sản phẩm:", "Giá bán:", "Danh mục:"
        };

        String lower = content.toLowerCase();
        for (String kw : keywords) {
            String kwLower = kw.toLowerCase();
            int first = lower.indexOf(kwLower);
            if (first >= 0) {
                int second = lower.indexOf(kwLower, first + kw.length());
                if (second > 0) {
                    int pos = Math.max(0, second - 10);
                    int sentBoundary = content.lastIndexOf('.', pos);
                    if (sentBoundary >= 0 && sentBoundary > first) return sentBoundary + 1;
                    int paraBoundary = content.lastIndexOf('\n', pos);
                    if (paraBoundary >= 0 && paraBoundary > first) return paraBoundary + 1;
                    return pos;
                }
            }
        }
        return -1;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase().chars()
                .filter(c -> Character.isLetterOrDigit(c))
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    private double jaccardSimilarity(String s1, String s2) {
        if (s1.isEmpty() || s2.isEmpty()) return 0;
        Set<Character> set1 = s1.chars().mapToObj(c -> (char) c).collect(Collectors.toSet());
        Set<Character> set2 = s2.chars().mapToObj(c -> (char) c).collect(Collectors.toSet());
        Set<Character> union = new HashSet<>(set1);
        union.addAll(set2);
        Set<Character> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        return union.isEmpty() ? 0 : (double) intersection.size() / union.size();
    }

    private double levenshteinSimilarity(String s1, String s2) {
        if (s1.isEmpty() || s2.isEmpty()) return 0;
        if (s1.equals(s2)) return 1.0;
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        int dist = dp[s1.length()][s2.length()];
        return 1.0 - ((double) dist / Math.max(s1.length(), s2.length()));
    }
}
