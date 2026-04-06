package J2EE.PawVerse.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Iterator;
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
    // Values are tuned for ~100 concurrent users sharing one IP (classroom/lab environment).
    // Brute-force is still blocked by per-account lockout (7 failed attempts) + CAPTCHA.
    private static final int LIMIT_AUTH_LOGIN    = 300;   // 100 users login burst; brute-force blocked by lockout+CAPTCHA
    private static final int LIMIT_AUTH_GENERAL  = 600;   // register, OTP, forgot-password
    private static final int LIMIT_ORDER_CREATE  = 600;   // students placing/cancelling orders repeatedly
    private static final int LIMIT_CART          = 6000;  // ~60 cart ops/min/user × 100 users
    private static final int LIMIT_API_DEFAULT   = 15000; // ~150 req/min/user × 100 users (2-core 4GB handles ~500 req/s)

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
        String remoteAddr = request.getRemoteAddr();
        // Only trust proxy headers if the direct connection comes from localhost/private network
        // This prevents external clients from spoofing their IP via X-Forwarded-For
        if (isPrivateOrLoopback(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String candidate = forwarded.split(",")[0].trim();
                if (!candidate.isBlank()) return candidate;
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }
        return remoteAddr;
    }

    private boolean isPrivateOrLoopback(String ip) {
        return ip != null && (
            ip.startsWith("127.") ||
            ip.startsWith("10.") ||
            ip.startsWith("192.168.") ||
            ip.startsWith("172.16.") || ip.startsWith("172.17.") ||
            ip.startsWith("172.18.") || ip.startsWith("172.19.") ||
            ip.startsWith("172.2") || ip.startsWith("172.30.") ||
            ip.startsWith("172.31.") ||
            ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1")
        );
    }

    @Scheduled(fixedDelay = 300_000) // Clean up every 5 minutes
    public void evictStaleEntries() {
        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        Iterator<Map.Entry<String, Queue<Long>>> it = requestLog.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Queue<Long>> entry = it.next();
            Queue<Long> q = entry.getValue();
            // Remove timestamps outside the window
            while (!q.isEmpty() && q.peek() <= cutoff) {
                q.poll();
            }
            // Remove empty queues to free memory
            if (q.isEmpty()) {
                it.remove();
            }
        }
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
