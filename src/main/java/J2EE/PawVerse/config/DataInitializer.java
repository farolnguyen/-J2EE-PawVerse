package J2EE.PawVerse.config;

import J2EE.PawVerse.entity.Role;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.RoleRepository;
import J2EE.PawVerse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration(proxyBeanMethods = false)
@RequiredArgsConstructor
public class DataInitializer {
    
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Bean
    CommandLineRunner initData() {
        return args -> {
            if (roleRepository.count() == 0) {
                Role adminRole = Role.builder()
                        .tenRole("ADMIN")
                        .moTa("Administrator")
                        .build();
                
                Role staffRole = Role.builder()
                        .tenRole("STAFF")
                        .moTa("Staff member")
                        .build();
                
                Role userRole = Role.builder()
                        .tenRole("USER")
                        .moTa("Regular user")
                        .build();
                
                roleRepository.save(adminRole);
                roleRepository.save(staffRole);
                roleRepository.save(userRole);
                
                System.out.println("✅ Roles initialized successfully!");
                
                if (userRepository.count() == 0) {
                    User admin = User.builder()
                            .username("admin")
                            .email("admin@pawverse.com")
                            .passwordHash(passwordEncoder.encode("admin123"))
                            .fullName("Administrator")
                            .role(adminRole)
                            .isLocked(false)
                            .failedLoginAttempts(0)
                            .emailVerified(true)
                            .build();
                    
                    userRepository.save(admin);
                    System.out.println("✅ Default admin account created!");
                    System.out.println("   Username: admin");
                    System.out.println("   Password: admin123");
                }
            }
        };
    }
}
