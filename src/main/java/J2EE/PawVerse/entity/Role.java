package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_role")
    private Long idRole;
    
    @Column(name = "ten_role", nullable = false, unique = true)
    private String tenRole;
    
    @Column(name = "mo_ta")
    private String moTa;
    
    @OneToMany(mappedBy = "role")
    private Set<User> users;
}
