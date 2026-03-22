package J2EE.PawVerse.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LockUserRequest {
    
    private Integer lockTimeHours; // 999 = admin lock permanent, null/0 = permanent, other = hours
    private String reason;
}
