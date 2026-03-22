package J2EE.PawVerse.dto.chatbot;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CozeStreamResponse {
    
    @JsonProperty("event")
    private String event;
    
    @JsonProperty("message")
    private CozeMessageData message;
    
    @JsonProperty("conversation_id")
    private String conversationId;
    
    @JsonProperty("is_finish")
    private Boolean isFinish;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CozeMessageData {
        
        @JsonProperty("role")
        private String role;
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("content")
        private String content;
    }
}
