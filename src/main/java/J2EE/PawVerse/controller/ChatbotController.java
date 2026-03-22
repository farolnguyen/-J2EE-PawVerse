package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.chatbot.ChatMessageRequest;
import J2EE.PawVerse.dto.chatbot.ChatbotResponse;
import J2EE.PawVerse.service.ChatbotService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/chatbot")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/send-message")
    public ResponseEntity<ApiResponse<ChatbotResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Get client IP for rate limiting
            String clientIp = getClientIp(httpRequest);

            // Check rate limit
            String rateLimitMsg = chatbotService.checkRateLimit(clientIp);
            if (rateLimitMsg != null) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ApiResponse.error(rateLimitMsg));
            }

            // Validate message length
            String msg = request.getMessage().trim();
            if (msg.length() > 500) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Tin nhắn không được vượt quá 500 ký tự"));
            }

            String response = chatbotService.sendMessage(msg, request.getConversationId());

            ChatbotResponse chatbotResponse = ChatbotResponse.builder()
                    .response(response)
                    .conversationId(request.getConversationId())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(chatbotResponse, "Success"));

        } catch (Exception e) {
            log.error("Error sending message to chatbot", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Đã xảy ra lỗi khi kết nối chatbot. Vui lòng thử lại sau."));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Take the first IP if multiple
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
