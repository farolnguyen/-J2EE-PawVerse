package J2EE.PawVerse.dto.chatbot;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CozeSendMessageRequest {
    
    @JsonProperty("bot_id")
    private String botId;
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("additional_messages")
    private List<CozeMessage> additionalMessages;
    
    @JsonProperty("stream")
    private Boolean stream;
    
    @JsonProperty("auto_save_history")
    private Boolean autoSaveHistory;
}
