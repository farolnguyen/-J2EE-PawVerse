package J2EE.PawVerse.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * IP-based sliding window rate limiter.
 * Different limits apply to different endpoint categories.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final int WINDOW_MS = 60_000; // 1 minute sliding window

    // Per-endpoint limits (requests per minute per IP)
    private static final int LIMIT_AUTH_LOGIN    = 10;
    private static final int LIMIT_AUTH_GENERAL  = 20;
    private static final int LIMIT_ORDER_CREATE  = 10;
    private static final int LIMIT_CART          = 60;
    private static final int LIMIT_API_DEFAULT   = 120;

    // key = "IP::bucket_name" → queue of timestamps
    private final Map<String, Queue<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws IOException {

        String ip = resolveClientIp(request);
        String uri = request.getRequestURI();
        String method = request.getMethod();

        String bucket = resolveBucket(uri, method);
        int limit = resolveLimit(bucket);

        String key = ip + "::" + bucket;
        long now = System.currentTimeMillis();

        Queue<Long> timestamps = requestLog.computeIfAbsent(key, k -> new ConcurrentLinkedQueue<>());

        // Evict timestamps outside the sliding window
        while (!timestamps.isEmpty() && now - timestamps.peek() > WINDOW_MS) {
            timestamps.poll();
        }

        if (timestamps.size() >= limit) {
            sendRateLimitResponse(response, limit);
            return false;
        }

        timestamps.add(now);
        return true;
    }

    private String resolveBucket(String uri, String method) {
        if (uri.contains("/api/auth/login"))         return "auth_login";
        if (uri.contains("/api/auth/"))              return "auth_general";
        if (uri.contains("/api/user/orders") && "POST".equalsIgnoreCase(method)) return "order_create";
        if (uri.contains("/api/user/cart"))          return "cart";
        return "api_default";
    }

    private int resolveLimit(String bucket) {
        return switch (bucket) {
            case "auth_login"    -> LIMIT_AUTH_LOGIN;
            case "auth_general"  -> LIMIT_AUTH_GENERAL;
            case "order_create"  -> LIMIT_ORDER_CREATE;
            case "cart"          -> LIMIT_CART;
            default              -> LIMIT_API_DEFAULT;
        };
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response, int limit) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
            "{\"success\":false,\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút. Giới hạn: "
            + limit + " request/phút.\"}"
        );
    }
}
